/**
 * SYCOGUARD Agentic Orchestrator
 * 
 * Coordinates the full intent-grounded cognitive defense pipeline:
 * 
 * USER INPUT
 *     ↓
 * CONTEXT & INTENT UNDERSTANDING (server/intentUnderstanding.ts)
 *     ↓
 * LLM DRAFT GENERATION (server/gemini.ts + providers)
 *     ↓
 * RESPONSE GROUNDING & RELEVANCE VALIDATION (server/responseValidator.ts)
 *     [If misaligned/unrelated: REJECT & REGENERATE using user intent]
 *     ↓
 * EPISTEMIC / SAFETY ANALYSIS (Gate, Hypothesis, RAG, Factuality, Sycophancy, Balance)
 *     ↓
 * COMPOSITE RISK ENGINE (Dual-Analysis on original user input & draft)
 *     ↓
 * INTERVENTION AGENT (Grounded in user's actual premise & topic)
 *     ↓
 * FINAL DELIVERED RESPONSE & OBSERVABILITY TRACE
 */

import {
  FirewallAnalysis,
  FirewallTraceStep,
  ConversationMessage
} from '../src/types.js';
import { generateDraftResponse } from './gemini.js';
import { retrieveEvidence } from './evidenceDb.js';
import { extractUserHypothesis, analyzeSycophancy } from './sycophancyAnalyzer.js';
import { analyzeFactuality } from './factualityAnalyzer.js';
import { analyzeEvidenceBalance } from './evidenceBalanceEngine.js';
import { analyzeTrajectory } from './trajectoryEngine.js';
import { computeRisk, getRiskWeights } from './riskEngine.js';
import { runInterventionAgent } from './interventionAgent.js';
import { evaluateEpistemicRelevance } from './epistemicGate.js';
import { analyzeUserIntent } from './intentUnderstanding.js';
import { validateResponseGrounding, regenerateGroundedResponse } from './responseValidator.js';

export interface OrchestrationResult {
  rawDraft: string;
  finalResponse: string;
  analysis: FirewallAnalysis;
  provider: string;
  isDemo: boolean;
}

export async function orchestrateFirewallPipeline(
  userMessage: string,
  history: ConversationMessage[] = [],
  preferredProvider: 'gemini' | 'openai' | 'openrouter' | 'auto' = 'auto'
): Promise<OrchestrationResult> {
  const trace: FirewallTraceStep[] = [];
  const startTotal = Date.now();
  const historyParts = history.map(h => ({ role: h.role, content: h.content }));

  // ============================================================
  // STAGE 1: Context & Intent Understanding
  // ============================================================
  const tIntent = Date.now();
  const intent = analyzeUserIntent(userMessage, historyParts);

  trace.push({
    id: 'step_1_intent',
    name: 'Context & Intent Understanding',
    status: intent.isAmbiguous ? 'flagged' : 'completed',
    timestamp: tIntent,
    durationMs: Math.max(1, Date.now() - tIntent),
    outputSummary: `Intent: ${intent.intentType} | Topic: "${intent.primaryTopic}" | Expected Output: ${intent.expectedOutputType}${intent.isAmbiguous ? ' [Ambiguous]' : ''}`,
    rawPayload: { ...intent }
  });

  // ============================================================
  // STAGE 2: Intercept Raw Model Draft
  // ============================================================
  const tDraft = Date.now();
  const { text: rawDraft, provider, isDemo } = await generateDraftResponse(userMessage, historyParts, preferredProvider, intent);

  trace.push({
    id: 'step_2_llm_draft',
    name: 'Intercept Raw Model Draft',
    status: 'completed',
    timestamp: tDraft,
    durationMs: Math.max(1, Date.now() - tDraft),
    outputSummary: `Generated ${rawDraft.length} chars via ${provider} (${isDemo ? 'Demo Mode' : 'Live Model'}). Intercepted before user display.`,
    rawPayload: { rawDraftSnippet: rawDraft.slice(0, 120) + '...', provider, isDemo }
  });

  // ============================================================
  // STAGE 3: Response Grounding & Relevance Validation
  // ============================================================
  const tVal = Date.now();
  let responseRelevance = validateResponseGrounding(userMessage, rawDraft, intent, historyParts);
  let effectiveDraft = rawDraft;
  let wasRegenerated = false;

  trace.push({
    id: 'step_3_grounding',
    name: 'Response Grounding & Relevance Validation',
    status: responseRelevance.status === 'ALIGNED' ? 'completed' : 'flagged',
    timestamp: tVal,
    durationMs: Math.max(1, Date.now() - tVal),
    outputSummary: `Grounding Status: ${responseRelevance.status} (Score: ${(responseRelevance.overallRelevanceScore * 100).toFixed(0)}%). Misalignments: ${responseRelevance.detectedMisalignments.length}`,
    rawPayload: { ...responseRelevance }
  });

  // If UNRELATED or PARTIALLY_ALIGNED: Reject and regenerate using user intent
  if (responseRelevance.regenerationRequired) {
    const tRegen = Date.now();
    effectiveDraft = regenerateGroundedResponse(userMessage, intent, rawDraft, responseRelevance.detectedMisalignments);
    wasRegenerated = true;

    // Re-verify the regenerated response
    const recheck = validateResponseGrounding(userMessage, effectiveDraft, intent, historyParts);
    responseRelevance = {
      ...recheck,
      regenerated: true,
      regenerationReason: responseRelevance.regenerationReason
    };

    trace.push({
      id: 'step_3b_regeneration',
      name: 'Intent-Grounded Response Regeneration',
      status: 'completed',
      timestamp: tRegen,
      durationMs: Math.max(1, Date.now() - tRegen),
      outputSummary: `Draft was regenerated to adhere to user intent. New Relevance Score: ${(responseRelevance.overallRelevanceScore * 100).toFixed(0)}% [${responseRelevance.status}]`,
      rawPayload: { regeneratedSnippet: effectiveDraft.slice(0, 120) + '...', originalReason: responseRelevance.regenerationReason }
    });
  }

  // ============================================================
  // STAGE 4: Epistemic Relevance Gate
  // ============================================================
  const tGate = Date.now();
  const epistemicResult = evaluateEpistemicRelevance(userMessage);

  trace.push({
    id: 'step_4_epistemic_gate',
    name: 'Epistemic Relevance Gate',
    status: epistemicResult.isEpistemicallyRelevant ? 'completed' : 'skipped',
    timestamp: tGate,
    durationMs: Math.max(1, Date.now() - tGate),
    outputSummary: epistemicResult.isEpistemicallyRelevant
      ? `Relevant (${epistemicResult.category}): ${epistemicResult.reason}`
      : `Bypassed (${epistemicResult.category}): Non-epistemic input. ${epistemicResult.reason}`,
    rawPayload: { ...epistemicResult }
  });

  // If NON-EPISTEMIC: Deliver the verified grounded draft directly
  if (!epistemicResult.isEpistemicallyRelevant) {
    const benignAnalysis: FirewallAnalysis = {
      intent,
      responseRelevance,
      epistemicRelevance: epistemicResult,
      sycophancy: {
        score: 0.0,
        confidence: 0.98,
        reasoning: 'Non-epistemic input. No hypothesis asserted and no belief-validation detected.',
        signals: [],
        validationStrength: 0.0,
        evidenceSupportRatio: 1.0,
        detectedHypothesis: 'None (Non-epistemic dialogue)',
        agreementMarkers: []
      },
      factuality: {
        score: 1.0,
        claims: [],
        supportedCount: 0,
        contradictedCount: 0,
        unverifiedCount: 0,
        summary: 'Non-epistemic conversational message. No empirical claims requiring scientific verification.'
      },
      evidenceBalance: {
        balanceScore: 1.0,
        supportingCount: 0,
        contradictoryCount: 0,
        neutralCount: 0,
        evidenceItems: [],
        imbalanceDetected: false,
        explanation: 'Non-epistemic input. Empirical literature balancing not applicable.'
      },
      trajectory: {
        reinforcementScore: 0.0,
        currentStance: 0.5,
        previousStances: history.map(h => h.analysis?.trajectory.currentStance ?? 0.5),
        stanceHistory: [
          ...history.map((h, idx) => ({
            turn: idx + 1,
            userStance: h.analysis?.trajectory.currentStance ?? 0.5,
            aiValidation: h.analysis?.sycophancy.score ?? 0.0,
            rawRisk: h.analysis?.risk.overallScore ?? 0.0,
            interventionApplied: h.analysis?.intervention.applied ?? false,
            hypothesis: h.content.slice(0, 40)
          })),
          {
            turn: history.length + 1,
            userStance: 0.5,
            aiValidation: 0.0,
            rawRisk: 0.0,
            interventionApplied: false,
            hypothesis: userMessage.slice(0, 40)
          }
        ],
        spiralDetected: false,
        consecutiveValidations: 0,
        trend: 'neutral',
        explanation: 'Non-epistemic interaction; belief trajectory steady at neutral baseline.'
      },
      risk: {
        overallScore: 0.0,
        level: 'LOW',
        weights: getRiskWeights(),
        components: {
          confirmationSeeking: 0.0,
          agreementPressure: 0.0,
          evidenceSuppression: 0.0,
          unsupportedCertainty: 0.0,
          claimStrength: 0.0,
          factualGrounding: 1.0,
          contradictoryEvidence: 0.0,
          modelSycophancy: 0.0,
          trajectoryReinforcement: 0.0,
          sycophancy: 0.0,
          hallucination: 0.0,
          evidenceImbalance: 0.0,
          reinforcement: 0.0
        },
        signals: {
          confirmationSeeking: 0.0,
          agreementPressure: 0.0,
          evidenceSuppression: 0.0,
          unsupportedCertainty: 0.0,
          claimStrength: 0.0,
          factualGrounding: 1.0,
          contradictoryEvidence: 0.0,
          modelSycophancy: 0.0,
          trajectoryReinforcement: 0.0,
          detectedMarkers: []
        },
        triggers: [],
        hardEscalations: []
      },
      intervention: {
        type: 'PASS',
        applied: false,
        reason: 'Non-epistemic input. Grounded response verified and passed directly.',
        details: 'The user message contains no hypothesis or belief-validation demand.',
        originalDraft: rawDraft,
        protectedResponse: effectiveDraft
      },
      trace
    };

    logPipelineObservability({
      userMessage,
      intent,
      rawDraft,
      responseRelevance,
      wasRegenerated,
      epistemicResult,
      risk: benignAnalysis.risk,
      intervention: benignAnalysis.intervention,
      finalResponse: effectiveDraft
    });

    return {
      rawDraft,
      finalResponse: effectiveDraft,
      analysis: benignAnalysis,
      provider,
      isDemo
    };
  }

  // ============================================================
  // STAGE 5: User Hypothesis Extraction
  // ============================================================
  const tHyp = Date.now();
  const { hypothesis, certaintyLevel, hasHypothesis } = extractUserHypothesis(userMessage);
  trace.push({
    id: 'step_5_hypothesis',
    name: 'Extract User Hypothesis & Stance',
    status: hasHypothesis ? 'completed' : 'skipped',
    timestamp: tHyp,
    durationMs: Math.max(1, Date.now() - tHyp),
    outputSummary: hasHypothesis
      ? `Detected hypothesis: "${hypothesis.slice(0, 70)}..." with certainty ${(certaintyLevel * 100).toFixed(0)}%`
      : `Open informational query (no leading user hypothesis asserted)`,
    rawPayload: { hypothesis, certaintyLevel, hasHypothesis }
  });

  // ============================================================
  // STAGE 6: Evidence Retrieval (Multi-Perspective RAG)
  // ============================================================
  const tRag = Date.now();
  const evidencePool = retrieveEvidence(userMessage + ' ' + effectiveDraft, hypothesis);
  trace.push({
    id: 'step_6_rag',
    name: 'Retrieve Multi-Perspective Evidence',
    status: 'completed',
    timestamp: tRag,
    durationMs: Math.max(1, Date.now() - tRag),
    outputSummary: evidencePool.length > 0
      ? `Retrieved ${evidencePool.length} empirical studies (Supporting, Counter, Neutral)`
      : `No empirical controversy indexed for this specific domain.`,
    rawPayload: { itemCount: evidencePool.length, topSource: evidencePool[0]?.source }
  });

  // ============================================================
  // STAGE 7: Parallel Diagnostic Analyzers
  // ============================================================
  const tDiag = Date.now();
  const supCount = evidencePool.filter(e => e.classification === 'SUPPORTING').length;
  const totalRelevant = evidencePool.length || 1;
  const evidenceSupportRatio = evidencePool.length > 0 ? supCount / totalRelevant : 0.5;

  const factuality = analyzeFactuality(effectiveDraft, evidencePool);
  const sycophancy = analyzeSycophancy(userMessage, effectiveDraft, evidenceSupportRatio, history.length + 1);
  const evidenceBalance = analyzeEvidenceBalance(effectiveDraft, evidencePool);

  trace.push({
    id: 'step_7_factuality',
    name: 'Atomic Claims & Factuality Verification',
    status: factuality.contradictedCount > 0 ? 'flagged' : 'completed',
    timestamp: tDiag,
    durationMs: Math.max(1, Date.now() - tDiag),
    outputSummary: `Extracted ${factuality.claims.length} atomic claims. Supported: ${factuality.supportedCount}, Contradicted: ${factuality.contradictedCount}, Unverified: ${factuality.unverifiedCount}`,
    rawPayload: { score: factuality.score, claims: factuality.claims }
  });

  trace.push({
    id: 'step_7_sycophancy',
    name: 'Sycophancy & Agreement Disproportion Analysis',
    status: sycophancy.score >= 0.60 ? 'flagged' : 'completed',
    timestamp: tDiag,
    durationMs: Math.max(1, Date.now() - tDiag),
    outputSummary: `Sycophancy Score: ${(sycophancy.score * 100).toFixed(0)}%. Validation strength: ${(sycophancy.validationStrength * 100).toFixed(0)}%`,
    rawPayload: { score: sycophancy.score, agreementMarkers: sycophancy.agreementMarkers }
  });

  trace.push({
    id: 'step_7_evidence_balance',
    name: 'Evidence Balance & Cherry-Picking Assessment',
    status: evidenceBalance.imbalanceDetected ? 'flagged' : 'completed',
    timestamp: tDiag,
    durationMs: Math.max(1, Date.now() - tDiag),
    outputSummary: `Balance Score: ${(evidenceBalance.balanceScore * 100).toFixed(0)}%. Contradictory items omitted: ${evidenceBalance.contradictoryCount}`,
    rawPayload: { balanceScore: evidenceBalance.balanceScore, imbalanceDetected: evidenceBalance.imbalanceDetected }
  });

  // ============================================================
  // STAGE 8: Multi-Turn Trajectory Analysis
  // ============================================================
  const tTraj = Date.now();
  const tempRisk = computeRisk(userMessage, effectiveDraft, evidencePool, 0.2);
  const trajectory = analyzeTrajectory(history, userMessage, sycophancy.score, tempRisk.overallScore);

  trace.push({
    id: 'step_8_trajectory',
    name: 'Belief Reinforcement Trajectory Analysis',
    status: trajectory.spiralDetected ? 'flagged' : 'completed',
    timestamp: tTraj,
    durationMs: Math.max(1, Date.now() - tTraj),
    outputSummary: `Reinforcement Risk: ${(trajectory.reinforcementScore * 100).toFixed(0)}%. Consecutive validations: ${trajectory.consecutiveValidations}. Spiral: ${trajectory.spiralDetected ? 'YES' : 'NO'}`,
    rawPayload: { reinforcementScore: trajectory.reinforcementScore, trend: trajectory.trend }
  });

  // ============================================================
  // STAGE 9: Composite Epistemic Risk Engine (Dual-Analysis)
  // ============================================================
  const tRisk = Date.now();
  const weights = getRiskWeights();
  const risk = computeRisk(
    userMessage,
    effectiveDraft,
    evidencePool,
    trajectory.reinforcementScore,
    weights
  );

  trace.push({
    id: 'step_9_risk',
    name: 'Composite Risk Engine',
    status: risk.level === 'HIGH' || risk.level === 'CRITICAL' ? 'flagged' : 'completed',
    timestamp: tRisk,
    durationMs: Math.max(1, Date.now() - tRisk),
    outputSummary: `Composite Risk Score: ${(risk.overallScore * 100).toFixed(0)}% [${risk.level}]. Triggers: ${risk.triggers.join(', ') || 'None'}`,
    rawPayload: { overallScore: risk.overallScore, level: risk.level, components: risk.components, signals: risk.signals }
  });

  // ============================================================
  // STAGE 10: Grounded Intervention Agent
  // ============================================================
  const tInt = Date.now();
  const intervention = runInterventionAgent(
    userMessage,
    effectiveDraft,
    risk,
    sycophancy,
    evidencePool,
    intent
  );

  trace.push({
    id: 'step_10_intervention',
    name: 'Intervention Agent Execution',
    status: intervention.applied ? 'flagged' : 'completed',
    timestamp: tInt,
    durationMs: Math.max(1, Date.now() - tInt),
    outputSummary: `Action: ${intervention.type} (${intervention.applied ? 'Applied' : 'Passed'}). ${intervention.reason}`,
    rawPayload: { type: intervention.type, applied: intervention.applied, reason: intervention.reason }
  });

  const finalResponse = intervention.applied ? intervention.protectedResponse : effectiveDraft;

  // Log complete pipeline trace to development console
  logPipelineObservability({
    userMessage,
    intent,
    rawDraft,
    responseRelevance,
    wasRegenerated,
    epistemicResult,
    risk,
    intervention,
    finalResponse
  });

  return {
    rawDraft,
    finalResponse,
    analysis: {
      intent,
      responseRelevance,
      epistemicRelevance: epistemicResult,
      sycophancy,
      factuality,
      evidenceBalance,
      trajectory,
      risk,
      intervention,
      trace
    },
    provider,
    isDemo
  };
}

/**
 * Structured pipeline observability logging.
 */
function logPipelineObservability(params: {
  userMessage: string;
  intent: any;
  rawDraft: string;
  responseRelevance: any;
  wasRegenerated: boolean;
  epistemicResult: any;
  risk: any;
  intervention: any;
  finalResponse: string;
}) {
  const { userMessage, intent, rawDraft, responseRelevance, wasRegenerated, epistemicResult, risk, intervention, finalResponse } = params;

  console.log('\n============================================================');
  console.log('[SYCOGUARD INTENT & RESPONSE GROUNDING TRACE]');
  console.log(`USER INPUT:\n  "${userMessage}"`);
  console.log(`\n→ DETECTED INTENT:`);
  console.log(`  Type: ${intent.intentType}`);
  console.log(`  Primary Topic: "${intent.primaryTopic}"`);
  console.log(`  Key Entities: [${intent.keyEntities.join(', ')}]`);
  console.log(`  Expected Output: ${intent.expectedOutputType}`);
  console.log(`  Ambiguous: ${intent.isAmbiguous ? `YES (${intent.ambiguityReason})` : 'NO'}`);
  console.log(`\n→ RELEVANT CONTEXT:`);
  console.log(`  Dependencies: [${intent.contextDependencies?.join(', ') || 'None (isolated current-task boundary)'}]`);
  console.log(`\n→ GENERATED DRAFT (Raw):`);
  console.log(`  "${rawDraft.slice(0, 160).replace(/\n/g, ' ')}..."`);
  console.log(`\n→ RELEVANCE ANALYSIS:`);
  console.log(`  Status: ${responseRelevance.status} (Score: ${Math.round(responseRelevance.overallRelevanceScore * 100)}%)`);
  console.log(`  Intent Alignment: ${Math.round(responseRelevance.intentAlignmentScore * 100)}% | Topic Alignment: ${Math.round(responseRelevance.topicAlignmentScore * 100)}%`);
  console.log(`  Request Alignment: ${Math.round(responseRelevance.requestAlignmentScore * 100)}% | Context Alignment: ${Math.round(responseRelevance.contextAlignmentScore * 100)}%`);
  if (responseRelevance.detectedMisalignments && responseRelevance.detectedMisalignments.length > 0) {
    console.log(`\n→ DETECTED MISALIGNMENTS:`);
    responseRelevance.detectedMisalignments.forEach((m: string) => console.log(`  ⚠️ ${m}`));
  }
  console.log(`\n→ REGENERATION IF REQUIRED:`);
  console.log(`  ${wasRegenerated ? `YES (Regenerated grounded response to resolve misalignments)` : 'NO (Draft is well-grounded)'}`);
  console.log(`\n→ EPISTEMIC ANALYSIS:`);
  console.log(`  Relevant: ${epistemicResult.isEpistemicallyRelevant ? 'YES' : 'NO'} (${epistemicResult.category})`);
  if (risk.signals) {
    console.log(`  Confirmation Seeking: ${Math.round((risk.signals.confirmationSeeking || 0) * 100)}% | Agreement Pressure: ${Math.round((risk.signals.agreementPressure || 0) * 100)}%`);
    console.log(`  Evidence Suppression: ${Math.round((risk.signals.evidenceSuppression || 0) * 100)}% | Model Sycophancy: ${Math.round((risk.signals.modelSycophancy || 0) * 100)}%`);
  }
  console.log(`\n→ RISK DECISION:`);
  console.log(`  Level: ${risk.level} (${Math.round(risk.overallScore * 100)}%) | Triggers: ${risk.triggers.join(', ') || 'None'}`);
  console.log(`  Intervention: ${intervention.type} (Applied: ${intervention.applied})`);
  console.log(`\n→ FINAL RESPONSE:`);
  console.log(`  "${finalResponse.slice(0, 180).replace(/\n/g, ' ')}..."`);
  console.log('============================================================\n');
}

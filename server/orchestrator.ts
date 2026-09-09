/**
 * SYCOGUARD Agentic Orchestrator
 * 
 * Coordinates the multi-analyzer pipeline, computes composite risk,
 * executes interventions, and produces transparent execution traces for observability.
 * 
 * Stage 0: Epistemic Relevance Gate prevents false-positive interventions on
 * greetings, pleasantries, non-epistemic tasks, and casual inquiries.
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

  // ============================================================
  // STAGE 0: Epistemic Relevance Gate
  // ============================================================
  const tGate = Date.now();
  const epistemicResult = evaluateEpistemicRelevance(userMessage);

  trace.push({
    id: 'step_0_epistemic_gate',
    name: 'Epistemic Relevance Gate',
    status: epistemicResult.isEpistemicallyRelevant ? 'completed' : 'skipped',
    timestamp: tGate,
    durationMs: Math.max(1, Date.now() - tGate),
    outputSummary: epistemicResult.isEpistemicallyRelevant
      ? `Relevant (${epistemicResult.category}): ${epistemicResult.reason}`
      : `Bypassed (${epistemicResult.category}): Non-epistemic input. ${epistemicResult.reason}`,
    rawPayload: { ...epistemicResult }
  });

  // If NON-EPISTEMIC: Generate natural model draft and bypass belief-defense pipeline
  if (!epistemicResult.isEpistemicallyRelevant) {
    const tDraft = Date.now();
    const historyParts = history.map(h => ({ role: h.role, content: h.content }));
    const { text: rawDraft, provider, isDemo } = await generateDraftResponse(userMessage, historyParts, preferredProvider);

    trace.push({
      id: 'step_2_llm_draft',
      name: 'Intercept Raw Model Draft',
      status: 'completed',
      timestamp: tDraft,
      durationMs: Math.max(1, Date.now() - tDraft),
      outputSummary: `Generated ${rawDraft.length} chars via ${provider}. Intercepted and passed without modification.`,
      rawPayload: { rawDraftSnippet: rawDraft.slice(0, 100) + '...', provider, isDemo }
    });

    const benignAnalysis: FirewallAnalysis = {
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
          sycophancy: 0.0,
          hallucination: 0.0,
          evidenceImbalance: 0.0,
          reinforcement: 0.0
        },
        triggers: []
      },
      intervention: {
        type: 'PASS',
        applied: false,
        reason: 'Non-epistemic input. Normal conversational response passed through.',
        details: 'The user message contains no hypothesis, factual controversy, or confirmation-seeking signals.',
        originalDraft: rawDraft,
        protectedResponse: rawDraft
      },
      trace
    };

    return {
      rawDraft,
      finalResponse: rawDraft,
      analysis: benignAnalysis,
      provider,
      isDemo
    };
  }

  // ============================================================
  // STAGE 1: User Hypothesis Extraction
  // ============================================================
  const t0 = Date.now();
  const { hypothesis, certaintyLevel, hasHypothesis } = extractUserHypothesis(userMessage);
  trace.push({
    id: 'step_1_hypothesis',
    name: 'Extract User Hypothesis & Stance',
    status: hasHypothesis ? 'completed' : 'skipped',
    timestamp: t0,
    durationMs: Math.max(1, Date.now() - t0),
    outputSummary: hasHypothesis
      ? `Detected hypothesis: "${hypothesis.slice(0, 70)}..." with certainty ${(certaintyLevel * 100).toFixed(0)}%`
      : `Open informational query (no leading user hypothesis asserted)`,
    rawPayload: { hypothesis, certaintyLevel, hasHypothesis }
  });

  // ============================================================
  // STAGE 2: Generate Raw Model Draft (Intercepted)
  // ============================================================
  const t1 = Date.now();
  const historyParts = history.map(h => ({ role: h.role, content: h.content }));
  const { text: rawDraft, provider, isDemo } = await generateDraftResponse(userMessage, historyParts, preferredProvider);
  trace.push({
    id: 'step_2_llm_draft',
    name: 'Intercept Raw Model Draft',
    status: 'completed',
    timestamp: t1,
    durationMs: Math.max(1, Date.now() - t1),
    outputSummary: `Generated ${rawDraft.length} chars via ${provider} (${isDemo ? 'Demo Mode' : 'Live Model'}). Intercepted before user display.`,
    rawPayload: { rawDraftSnippet: rawDraft.slice(0, 100) + '...', provider, isDemo }
  });

  // ============================================================
  // STAGE 3: Evidence Retrieval (Multi-Perspective RAG)
  // ============================================================
  const t2 = Date.now();
  const evidencePool = retrieveEvidence(userMessage + ' ' + rawDraft, hypothesis);
  trace.push({
    id: 'step_3_rag',
    name: 'Retrieve Multi-Perspective Evidence',
    status: 'completed',
    timestamp: t2,
    durationMs: Math.max(1, Date.now() - t2),
    outputSummary: evidencePool.length > 0
      ? `Retrieved ${evidencePool.length} empirical studies (Supporting, Counter, Neutral)`
      : `No empirical controversy indexed for this specific domain.`,
    rawPayload: { itemCount: evidencePool.length, topSource: evidencePool[0]?.source }
  });

  // ============================================================
  // STAGE 4: Parallel Diagnostic Analyzers
  // ============================================================
  const t3 = Date.now();
  
  const supCount = evidencePool.filter(e => e.classification === 'SUPPORTING').length;
  const totalRelevant = evidencePool.length || 1;
  const evidenceSupportRatio = evidencePool.length > 0 ? supCount / totalRelevant : 0.5;

  const factuality = analyzeFactuality(rawDraft, evidencePool);
  const sycophancy = analyzeSycophancy(userMessage, rawDraft, evidenceSupportRatio, history.length + 1);
  const evidenceBalance = analyzeEvidenceBalance(rawDraft, evidencePool);

  trace.push({
    id: 'step_4_claims_factuality',
    name: 'Atomic Claims & Factuality Verification',
    status: factuality.contradictedCount > 0 ? 'flagged' : 'completed',
    timestamp: t3,
    durationMs: Math.max(1, Date.now() - t3),
    outputSummary: `Extracted ${factuality.claims.length} atomic claims. Supported: ${factuality.supportedCount}, Contradicted: ${factuality.contradictedCount}, Unverified: ${factuality.unverifiedCount}`,
    rawPayload: { score: factuality.score, claims: factuality.claims }
  });

  trace.push({
    id: 'step_5_sycophancy',
    name: 'Sycophancy & Agreement Disproportion Analysis',
    status: sycophancy.score >= 0.60 ? 'flagged' : 'completed',
    timestamp: t3,
    durationMs: Math.max(1, Date.now() - t3),
    outputSummary: `Sycophancy Score: ${(sycophancy.score * 100).toFixed(0)}%. Validation strength: ${(sycophancy.validationStrength * 100).toFixed(0)}% vs Evidence support: ${(evidenceSupportRatio * 100).toFixed(0)}%`,
    rawPayload: { score: sycophancy.score, agreementMarkers: sycophancy.agreementMarkers, signals: sycophancy.signals }
  });

  trace.push({
    id: 'step_6_evidence_balance',
    name: 'Evidence Balance & Cherry-Picking Assessment',
    status: evidenceBalance.imbalanceDetected ? 'flagged' : 'completed',
    timestamp: t3,
    durationMs: Math.max(1, Date.now() - t3),
    outputSummary: `Balance Score: ${(evidenceBalance.balanceScore * 100).toFixed(0)}%. Contradictory evidence items omitted: ${evidenceBalance.contradictoryCount}`,
    rawPayload: { balanceScore: evidenceBalance.balanceScore, imbalanceDetected: evidenceBalance.imbalanceDetected }
  });

  // ============================================================
  // STAGE 5: Multi-Turn Trajectory Analysis
  // ============================================================
  const t4 = Date.now();
  const tempRisk = computeRisk(sycophancy.score, factuality.score, evidenceBalance.balanceScore, 0.2);
  const trajectory = analyzeTrajectory(history, userMessage, sycophancy.score, tempRisk.overallScore);

  trace.push({
    id: 'step_7_trajectory',
    name: 'Belief Reinforcement Trajectory Analysis',
    status: trajectory.spiralDetected ? 'flagged' : 'completed',
    timestamp: t4,
    durationMs: Math.max(1, Date.now() - t4),
    outputSummary: `Reinforcement Risk: ${(trajectory.reinforcementScore * 100).toFixed(0)}%. Consecutive validations: ${trajectory.consecutiveValidations}. Spiral alert: ${trajectory.spiralDetected ? 'YES' : 'NO'}`,
    rawPayload: { reinforcementScore: trajectory.reinforcementScore, trend: trajectory.trend, turns: trajectory.stanceHistory.length }
  });

  // ============================================================
  // STAGE 6: Composite Risk Engine
  // ============================================================
  const t5 = Date.now();
  const weights = getRiskWeights();
  const risk = computeRisk(
    sycophancy.score,
    factuality.score,
    evidenceBalance.balanceScore,
    trajectory.reinforcementScore,
    weights
  );

  trace.push({
    id: 'step_8_risk',
    name: 'Composite Risk Engine',
    status: risk.level === 'HIGH' || risk.level === 'CRITICAL' ? 'flagged' : 'completed',
    timestamp: t5,
    durationMs: Math.max(1, Date.now() - t5),
    outputSummary: `Composite Risk Score: ${(risk.overallScore * 100).toFixed(0)}% [${risk.level}]. Triggers: ${risk.triggers.join(', ') || 'None'}`,
    rawPayload: { overallScore: risk.overallScore, level: risk.level, components: risk.components }
  });

  // ============================================================
  // STAGE 7: Intervention Agent
  // ============================================================
  const t6 = Date.now();
  const intervention = runInterventionAgent(
    userMessage,
    rawDraft,
    risk,
    sycophancy,
    evidencePool
  );

  trace.push({
    id: 'step_9_intervention',
    name: 'Intervention Agent Execution',
    status: intervention.applied ? 'flagged' : 'completed',
    timestamp: t6,
    durationMs: Math.max(1, Date.now() - t6),
    outputSummary: `Action: ${intervention.type} (${intervention.applied ? 'Applied' : 'Passed'}). ${intervention.reason}`,
    rawPayload: { type: intervention.type, applied: intervention.applied, reason: intervention.reason }
  });

  const finalResponse = intervention.applied ? intervention.protectedResponse : rawDraft;

  return {
    rawDraft,
    finalResponse,
    analysis: {
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

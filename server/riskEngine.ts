/**
 * SYCOGUARD Epistemic Risk Engine (Calibrated)
 * 
 * Analyzes BOTH:
 * 1. The original USER MESSAGE (confirmationSeeking, agreementPressure, evidenceSuppression, unsupportedCertainty)
 * 2. The generated LLM DRAFT RESPONSE (modelSycophancy, factualGrounding, evidenceBalance)
 * 
 * Weighted Risk Calculation:
 * - confirmationSeeking       25%
 * - agreementPressure         25%
 * - evidenceSuppression       20%
 * - unsupportedCertainty      15%
 * - factualGrounding (defect) 10%
 * - modelSycophancy            5%
 * 
 * Intervention Thresholds:
 * - 0–24   = LOW       → PASS
 * - 25–49  = MODERATE  → QUALIFY
 * - 50–74  = HIGH      → BALANCE
 * - 75–100 = CRITICAL  → REWRITE
 */

import { 
  RiskAssessment, 
  RiskLevel, 
  RiskWeights, 
  EpistemicSignals, 
  EvidenceItem, 
  InterventionResult 
} from '../src/types.js';

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  confirmationSeeking: 0.25,
  agreementPressure: 0.25,
  evidenceSuppression: 0.20,
  unsupportedCertainty: 0.15,
  factualGrounding: 0.10,
  modelSycophancy: 0.05,
  // Legacy weights
  sycophancy: 0.30,
  hallucination: 0.25,
  evidenceImbalance: 0.20,
  reinforcement: 0.25
};

let activeWeights: RiskWeights = { ...DEFAULT_RISK_WEIGHTS };

export function getRiskWeights(): RiskWeights {
  return { ...activeWeights };
}

export function setRiskWeights(newWeights: Partial<RiskWeights>): RiskWeights {
  activeWeights = {
    ...activeWeights,
    ...newWeights
  };
  return { ...activeWeights };
}

/**
 * Extracts independent epistemic detection signals from both the User Prompt
 * and the Model's Raw Intercepted Draft.
 */
export function extractEpistemicSignals(
  userMessage: string,
  rawDraft: string = '',
  evidencePool: EvidenceItem[] = [],
  trajectoryScore: number = 0.0
): EpistemicSignals {
  const trimmed = userMessage.trim();
  const markers: string[] = [];

  // -------------------------------------------------------------
  // 1. CONFIRMATION SEEKING (0.0 to 1.0)
  // -------------------------------------------------------------
  let confirmationSeeking = 0.0;
  
  if (/\b(?:find|give me|search for|provide)\s+(?:scientific\s+)?(?:evidence|studies|proof|papers)\s+(?:that\s+)?(?:proves?|shows?|confirms?)\s+(?:that\s+)?(?:i'm|i\s+am|my\s+theory\s+is)\s+right\b/i.test(trimmed)) {
    confirmationSeeking = 0.96;
    markers.push('Explicit request to prove user is right');
  } else if (/\b(?:prove\s+(?:i'm|i\s+am|me)\s+right|proves?\s+i'm\s+right)\b/i.test(trimmed)) {
    confirmationSeeking = 0.95;
    markers.push('Demand for proof of user rightness');
  } else if (/\b(?:find|give me)\s+(?:scientific\s+)?(?:evidence|studies)\s+(?:proving|that proves)\b/i.test(trimmed)) {
    confirmationSeeking = 0.92;
    markers.push('Cherry-picking scientific evidence request');
  } else if (/\b(?:confirm\s+(?:that|this|my)|back\s+me\s+up|validate\s+(?:that|this|my))\b/i.test(trimmed)) {
    confirmationSeeking = 0.85;
    markers.push('Validation seeking indicator ("Confirm this/that")');
  } else if (/\b(?:don't|do not)\s+give\s+me\s+both\s+sides\b/i.test(trimmed)) {
    confirmationSeeking = Math.max(confirmationSeeking, 0.90);
    markers.push('One-sided perspective demand');
  } else if (/\b(?:isn't it (?:obviously |clearly )?true that|don't you agree that|agree with me that|admit that)\b/i.test(trimmed)) {
    confirmationSeeking = 0.80;
    markers.push('Leading confirmation question');
  } else if (/\b(right\?|agree\?|correct\?)\s*$/i.test(trimmed)) {
    confirmationSeeking = 0.65;
    markers.push('Tag-question seeking agreement');
  } else if (/^(what|how|why|does|can|is|are)\b/i.test(trimmed) && !/\b(right|agree|correct)\b/i.test(trimmed)) {
    confirmationSeeking = 0.05;
  } else if (trimmed.length > 25 && !trimmed.endsWith('?')) {
    confirmationSeeking = 0.35;
  }

  // -------------------------------------------------------------
  // 2. AGREEMENT PRESSURE (0.0 to 1.0)
  // -------------------------------------------------------------
  let agreementPressure = 0.0;

  if (/\b(?:agree\s+with\s+me|tell\s+me\s+i'm\s+right|admit\s+(?:that\s+)?i'm\s+right|you\s+(?:must|have\s+to)\s+agree|don't\s+disagree)\b/i.test(trimmed)) {
    agreementPressure = 0.98;
    markers.push('Explicit command to agree');
  } else if (/\bi\s+am\s+(?:100%|completely|definitely)\s+right\b/i.test(trimmed) && /\bagree\b/i.test(trimmed)) {
    agreementPressure = 1.0;
    markers.push('Absolute user certainty paired with agreement demand');
  } else if (/\b(?:don't|do not)\s+give\s+me\s+both\s+sides\b/i.test(trimmed) && /\b(?:prove|evidence)\b/i.test(trimmed)) {
    agreementPressure = 0.98;
    markers.push('Strict constraint against counter-arguments with proof demand');
  } else if (/\b(?:don't|do not)\s+challenge\s+(?:my\s+assumption|me|my\s+theory)\b/i.test(trimmed)) {
    agreementPressure = 0.95;
    markers.push('Instruction forbidding challenge');
  } else if (/\b(?:don't|do not)\s+give\s+me\s+both\s+sides\b/i.test(trimmed)) {
    agreementPressure = 0.92;
    markers.push('Suppression of balanced dialogue');
  } else if (/\b(?:confirm\s+(?:this|that)|validate\s+(?:this|that))\b/i.test(trimmed)) {
    agreementPressure = 0.70;
    markers.push('Directive to confirm assertion');
  } else if (/\b(?:isn't it (?:obviously )?true|don't you agree)\b/i.test(trimmed)) {
    agreementPressure = 0.55;
  }

  // -------------------------------------------------------------
  // 3. EVIDENCE SUPPRESSION (0.0 to 1.0)
  // -------------------------------------------------------------
  let evidenceSuppression = 0.0;

  if (/\b(?:don't|do not)\s+give\s+me\s+both\s+sides\b/i.test(trimmed)) {
    evidenceSuppression = 0.94;
    markers.push('Explicit suppression of opposing sides ("Don\'t give me both sides")');
  } else if (/\b(?:ignore|omit|skip|leave out)\s+(?:opposing|counter|contrary|negative|contradictory)\s+(?:evidence|studies|arguments|facts|findings)\b/i.test(trimmed)) {
    evidenceSuppression = 0.96;
    markers.push('Direct command to omit countervailing empirical evidence');
  } else if (/\b(?:don't|do not)\s+challenge\s+my\s+assumption\b/i.test(trimmed)) {
    evidenceSuppression = 0.93;
    markers.push('Command prohibiting empirical falsification');
  } else if (/\bonly\s+(?:give me|find|show me)\s+(?:evidence|studies|data)\s+(?:that\s+proves|supporting|in\s+favor)\b/i.test(trimmed)) {
    evidenceSuppression = 0.88;
    markers.push('Directive for selective confirmation bias');
  }

  // -------------------------------------------------------------
  // 4. UNSUPPORTED CERTAINTY (0.0 to 1.0)
  // -------------------------------------------------------------
  let unsupportedCertainty = 0.0;
  const certaintyKeywords = /\b(already\s+know|know\s+for\s+a\s+fact|100%|definitely|permanently|undeniably|indisputably|certainly|obviously|without\s+a\s+doubt|settled\s+science|far\s+superior|superior\s+to)\b/i;
  const empiricalTopics = /\b(coffee|caffeine|fasting|autophagy|calorie|memory|intelligence|sentience|sentient|consciousness|productivity|treatment|cure|vaccine)\b/i;

  if (certaintyKeywords.test(trimmed) && empiricalTopics.test(trimmed)) {
    if (/\bpermanently\s+(?:improves?|enhances?|boosts?)\b/i.test(trimmed) || /\b(?:already\s+know\s+that)\b/i.test(trimmed)) {
      unsupportedCertainty = 0.91;
      markers.push('Dogmatic claim of permanent empirical enhancement ("already know ... permanently improves")');
    } else {
      unsupportedCertainty = 0.82;
      markers.push('High ungrounded certainty on contested empirical subject');
    }
  } else if (certaintyKeywords.test(trimmed)) {
    unsupportedCertainty = 0.70;
    markers.push('Strong certainty markers in assertion');
  } else if (/^(what|how|why|does|can|is|are)\b/i.test(trimmed)) {
    unsupportedCertainty = 0.05;
  } else {
    unsupportedCertainty = 0.25;
  }

  // -------------------------------------------------------------
  // 5. CLAIM STRENGTH (0.0 to 1.0)
  // -------------------------------------------------------------
  let claimStrength = 0.0;
  if (/\bpermanently\s+(?:improves?|alters?|boosts?|changes?)\b/i.test(trimmed) || /\b(?:superior|cure|proven)\b/i.test(trimmed)) {
    claimStrength = 0.90;
  } else if (empiricalTopics.test(trimmed) && !trimmed.endsWith('?')) {
    claimStrength = 0.70;
  } else if (trimmed.endsWith('?')) {
    claimStrength = 0.20;
  }

  // -------------------------------------------------------------
  // 6. FACTUAL GROUNDING & CONTRADICTORY EVIDENCE
  // -------------------------------------------------------------
  let factualGrounding = 0.50;
  let contradictoryEvidence = 0.50;

  if (evidencePool.length > 0) {
    const sup = evidencePool.filter(e => e.classification === 'SUPPORTING').length;
    const con = evidencePool.filter(e => e.classification === 'CONTRADICTORY').length;
    const total = evidencePool.length;
    
    factualGrounding = Number((sup / total).toFixed(2));
    contradictoryEvidence = Number((con / total).toFixed(2));
  } else if (/\b(5\s+cups.*permanently.*memory|permanently\s+improves\s+memory\s+and\s+intelligence)\b/i.test(trimmed)) {
    // Known medical literature consensus: caffeine does not permanently increase baseline intelligence; induces tolerance & sleep debt
    factualGrounding = 0.20;
    contradictoryEvidence = 0.85;
  } else if (/\b(fasting.*superior.*because.*autophagy)\b/i.test(trimmed)) {
    factualGrounding = 0.40;
    contradictoryEvidence = 0.75;
  } else if (/^(what|how|why|does|can)\b/i.test(trimmed)) {
    factualGrounding = 0.85;
    contradictoryEvidence = 0.20;
  }

  // -------------------------------------------------------------
  // 7. MODEL SYCOPHANCY (MEASURED ON LLM DRAFT RESPONSE)
  // -------------------------------------------------------------
  let modelSycophancy = 0.05; // Default low when draft is objective

  const sycophanticAgreementPatterns = [
    /\b(you're|you are) (absolutely|completely|totally|definitely|100%|clearly|undeniably) (right|correct|on point|spot on)\b/i,
    /\b(that|this) definitely proves\b/i,
    /\byour (theory|hypothesis|intuition|analysis|observation) is (correct|proven|indisputable|brilliant|sound)\b/i,
    /\bi (completely|fully|entirely|wholeheartedly) agree with you\b/i,
    /\byou('ve| have) nailed it\b/i
  ];

  for (const pat of sycophanticAgreementPatterns) {
    if (pat.test(rawDraft)) {
      modelSycophancy = Math.max(modelSycophancy, 0.85);
      markers.push('LLM Draft exhibited explicit sycophantic agreement');
      break;
    }
  }

  if (/\b(you make a great point|good point|i agree)\b/i.test(rawDraft)) {
    modelSycophancy = Math.max(modelSycophancy, 0.45);
  }

  return {
    confirmationSeeking: Number(confirmationSeeking.toFixed(2)),
    agreementPressure: Number(agreementPressure.toFixed(2)),
    evidenceSuppression: Number(evidenceSuppression.toFixed(2)),
    unsupportedCertainty: Number(unsupportedCertainty.toFixed(2)),
    claimStrength: Number(claimStrength.toFixed(2)),
    factualGrounding: Number(factualGrounding.toFixed(2)),
    contradictoryEvidence: Number(contradictoryEvidence.toFixed(2)),
    modelSycophancy: Number(modelSycophancy.toFixed(2)),
    trajectoryReinforcement: Number(trajectoryScore.toFixed(2)),
    detectedMarkers: markers
  };
}

/**
 * Computes composite epistemic risk using the weighted formula:
 * 
 * confirmationSeeking       25%
 * agreementPressure         25%
 * evidenceSuppression       20%
 * unsupportedCertainty      15%
 * factualGrounding (defect) 10%
 * modelSycophancy            5%
 * 
 * Applies hard escalation rules and maps to intervention thresholds:
 * 0–24   = LOW       → PASS
 * 25–49  = MODERATE  → QUALIFY
 * 50–74  = HIGH      → BALANCE
 * 75–100 = CRITICAL  → REWRITE
 */
export function computeRisk(
  userMessage: string,
  rawDraft: string,
  evidencePool: EvidenceItem[] = [],
  trajectoryScore: number = 0.0,
  weights: RiskWeights = activeWeights
): RiskAssessment {
  const signals = extractEpistemicSignals(userMessage, rawDraft, evidencePool, trajectoryScore);
  const w = weights;

  // Groundedness defect penalty: lower factual grounding increases risk
  const factualDefect = Math.max(0, 1.0 - signals.factualGrounding);

  const wCS = w.confirmationSeeking ?? 0.25;
  const wAP = w.agreementPressure ?? 0.25;
  const wES = w.evidenceSuppression ?? 0.20;
  const wUC = w.unsupportedCertainty ?? 0.15;
  const wFG = w.factualGrounding ?? 0.10;
  const wMS = w.modelSycophancy ?? 0.05;

  const rawWeightedScore = (
    (wCS * signals.confirmationSeeking) +
    (wAP * signals.agreementPressure) +
    (wES * signals.evidenceSuppression) +
    (wUC * signals.unsupportedCertainty) +
    (wFG * factualDefect) +
    (wMS * signals.modelSycophancy)
  );

  let overallScore = rawWeightedScore;
  const hardEscalations: string[] = [];
  const triggers: string[] = [];

  // -------------------------------------------------------------
  // HARD ESCALATION RULES
  // -------------------------------------------------------------

  // Rule 1: IF agreementPressure is very high AND confirmationSeeking is high -> overall risk cannot be LOW
  if (signals.agreementPressure >= 0.70 && signals.confirmationSeeking >= 0.70) {
    if (overallScore < 0.75) {
      overallScore = Math.max(overallScore, 0.75);
    }
    hardEscalations.push('High agreement pressure combined with confirmation-seeking precludes LOW risk.');
    triggers.push('Aggressive Confirmation & Agreement Demanded');
  }

  // Rule 2: IF evidenceSuppression is high AND user makes an empirical claim -> overall risk must be at least HIGH
  if (signals.evidenceSuppression >= 0.70 && (signals.claimStrength >= 0.50 || signals.unsupportedCertainty >= 0.50)) {
    if (overallScore < 0.70) {
      overallScore = Math.max(overallScore, 0.70);
    }
    hardEscalations.push('Evidence suppression on empirical claim escalates risk to at least HIGH.');
    triggers.push('Evidence Suppression on Empirical Claim');
  }

  // Rule 3: IF user explicitly requests: "agree with me" OR "prove I'm right" OR "ignore opposing evidence" OR "don't challenge my assumption" OR "don't give me both sides"
  const explicitEscalationPatterns = [
    /\b(?:agree\s+with\s+me|tell\s+me\s+i'm\s+right)\b/i,
    /\b(?:prove\s+(?:i'm|i\s+am|me)\s+right|proves?\s+i'm\s+right)\b/i,
    /\b(?:ignore|omit|skip)\s+(?:opposing|counter|contrary)\s+evidence\b/i,
    /\b(?:don't|do not)\s+challenge\s+my\s+assumption\b/i,
    /\b(?:don't|do not)\s+give\s+me\s+both\s+sides\b/i
  ];

  const hasExplicitCommand = explicitEscalationPatterns.some(regex => regex.test(userMessage));
  if (hasExplicitCommand) {
    // Set to CRITICAL tier (>= 0.85). If strong multiple features match, escalate to 0.95
    if (signals.agreementPressure >= 0.90 && signals.confirmationSeeking >= 0.90) {
      overallScore = Math.max(overallScore, 0.95);
    } else {
      overallScore = Math.max(overallScore, 0.85);
    }
    hardEscalations.push('Explicit command demanding agreement, proof of rightness, or evidence suppression triggered CRITICAL firewall escalation.');
    triggers.push('Explicit Bias/Suppression Mandate');
  }

  // Multi-turn spiral trigger
  if (trajectoryScore >= 0.60) {
    overallScore = Math.max(overallScore, 0.80);
    hardEscalations.push('Multi-turn belief reinforcement spiral active.');
    triggers.push('Belief Spiral Reinforcement');
  }

  // Normalization
  overallScore = Math.min(1.0, Math.max(0.0, Number(overallScore.toFixed(2))));

  // -------------------------------------------------------------
  // INTERVENTION THRESHOLDS
  // -------------------------------------------------------------
  // 0–24   = LOW       → PASS
  // 25–49  = MODERATE  → QUALIFY
  // 50–74  = HIGH      → BALANCE
  // 75–100 = CRITICAL  → REWRITE
  const percentScore = Math.round(overallScore * 100);
  let level: RiskLevel = 'LOW';

  if (percentScore >= 75) {
    level = 'CRITICAL';
  } else if (percentScore >= 50) {
    level = 'HIGH';
  } else if (percentScore >= 25) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  // Add specific descriptive triggers for UI
  if (signals.confirmationSeeking >= 0.80) triggers.push(`High Confirmation Seeking (${Math.round(signals.confirmationSeeking * 100)}%)`);
  if (signals.agreementPressure >= 0.80) triggers.push(`High Agreement Pressure (${Math.round(signals.agreementPressure * 100)}%)`);
  if (signals.evidenceSuppression >= 0.80) triggers.push(`Evidence Suppression Detected (${Math.round(signals.evidenceSuppression * 100)}%)`);
  if (signals.unsupportedCertainty >= 0.80) triggers.push(`Ungrounded Absolute Certainty (${Math.round(signals.unsupportedCertainty * 100)}%)`);
  if (signals.modelSycophancy >= 0.50) triggers.push(`Model Draft Excessive Agreement (${Math.round(signals.modelSycophancy * 100)}%)`);

  // Remove duplicates
  const uniqueTriggers = Array.from(new Set(triggers));

  return {
    overallScore,
    level,
    weights: { ...weights },
    components: {
      confirmationSeeking: signals.confirmationSeeking,
      agreementPressure: signals.agreementPressure,
      evidenceSuppression: signals.evidenceSuppression,
      unsupportedCertainty: signals.unsupportedCertainty,
      claimStrength: signals.claimStrength,
      factualGrounding: signals.factualGrounding,
      contradictoryEvidence: signals.contradictoryEvidence,
      modelSycophancy: signals.modelSycophancy,
      trajectoryReinforcement: signals.trajectoryReinforcement,
      // Legacy mapping
      sycophancy: signals.modelSycophancy,
      hallucination: Number(factualDefect.toFixed(2)),
      evidenceImbalance: signals.evidenceSuppression,
      reinforcement: signals.trajectoryReinforcement
    },
    signals,
    triggers: uniqueTriggers,
    hardEscalations
  };
}

/**
 * Diagnostic logger to verify the complete epistemic pipeline in development.
 */
export function logEpistemicPipelineTrace(params: {
  userMessage: string;
  signals: EpistemicSignals;
  risk: RiskAssessment;
  intervention: InterventionResult;
  rawDraft: string;
  protectedResponse: string;
}) {
  const { userMessage, signals, risk, intervention, protectedResponse } = params;

  console.log('\n============================================================');
  console.log('[SYCOGUARD EPISTEMIC RISK PIPELINE DEBUG]');
  console.log(`USER MESSAGE:\n  "${userMessage}"\n`);
  
  console.log('→ DETECTED SIGNALS & ANALYZER SCORES:');
  console.log(`  • Confirmation Seeking:      ${Math.round(signals.confirmationSeeking * 100)}%`);
  console.log(`  • Agreement Pressure:        ${Math.round(signals.agreementPressure * 100)}%`);
  console.log(`  • Evidence Suppression:      ${Math.round(signals.evidenceSuppression * 100)}%`);
  console.log(`  • Unsupported Certainty:     ${Math.round(signals.unsupportedCertainty * 100)}%`);
  console.log(`  • Claim Strength:            ${Math.round(signals.claimStrength * 100)}%`);
  console.log(`  • Factual Grounding:         ${Math.round(signals.factualGrounding * 100)}%`);
  console.log(`  • Contradictory Evidence:    ${Math.round(signals.contradictoryEvidence * 100)}%`);
  console.log(`  • Model Sycophancy (Draft):  ${Math.round(signals.modelSycophancy * 100)}%`);
  console.log(`  • Trajectory Reinforcement:  ${Math.round(signals.trajectoryReinforcement * 100)}%`);
  if (signals.detectedMarkers && signals.detectedMarkers.length > 0) {
    console.log(`  • Markers: [${signals.detectedMarkers.join(', ')}]`);
  }

  if (risk.hardEscalations && risk.hardEscalations.length > 0) {
    console.log('\n→ HARD ESCALATION RULES APPLIED:');
    risk.hardEscalations.forEach(r => console.log(`  ⚡ [ESCALATION] ${r}`));
  }

  console.log('\n→ WEIGHTED RISK CALCULATION:');
  console.log(`  Formula: (0.25 * CS) + (0.25 * AP) + (0.20 * ES) + (0.15 * UC) + (0.10 * (1 - FG)) + (0.05 * MS)`);
  console.log(`  Calculation: (0.25 * ${signals.confirmationSeeking.toFixed(2)}) + (0.25 * ${signals.agreementPressure.toFixed(2)}) + (0.20 * ${signals.evidenceSuppression.toFixed(2)}) + (0.15 * ${signals.unsupportedCertainty.toFixed(2)}) + (0.10 * ${(1 - signals.factualGrounding).toFixed(2)}) + (0.05 * ${signals.modelSycophancy.toFixed(2)})`);
  console.log(`  Computed Overall Risk: ${Math.round(risk.overallScore * 100)}% [${risk.level}]`);

  console.log('\n→ FINAL RISK LEVEL:');
  console.log(`  Level: ${risk.level} (${Math.round(risk.overallScore * 100)}%)`);
  console.log(`  Triggers: ${risk.triggers.join(', ') || 'None'}`);

  console.log('\n→ INTERVENTION DECISION:');
  console.log(`  Action: ${intervention.type} (Applied: ${intervention.applied})`);
  console.log(`  Rationale: ${intervention.reason}`);

  console.log('\n→ PROTECTED RESPONSE:');
  console.log(`  "${protectedResponse.slice(0, 240)}${protectedResponse.length > 240 ? '...' : ''}"`);
  console.log('============================================================\n');
}


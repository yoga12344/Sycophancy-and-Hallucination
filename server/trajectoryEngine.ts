/**
 * SYCOGUARD Belief & Trajectory Engine
 * 
 * Tracks the multi-turn epistemic drift of the user:
 * User expresses hypothesis -> AI validates -> User escalates certainty -> Spiral risk.
 * 
 * Clearly labeled: "Prototype application-level estimate — not a clinical or literal Bayesian posterior."
 */

import { TrajectoryAnalysis, TrajectoryPoint, ConversationMessage } from '../src/types.js';

export function estimateUserStance(text: string, currentTurn: number): number {
  const lower = text.toLowerCase();

  // Strong certainty markers
  if (/\b(definitely|100%|certainly|i know for a fact|undoubtedly|proves it|indisputable|convinced|obvious)\b/i.test(lower)) {
    return 0.90;
  }
  // Moderate certainty
  if (/\b(i think|i believe|my theory|pretty sure|seems clear|makes sense|i suspect)\b/i.test(lower)) {
    return 0.70;
  }
  // Inquiring / tentative
  if (/\b(could it be|wondering|is it true|possible|might|curious|what is|how does)\b/i.test(lower)) {
    return 0.45;
  }
  // Skeptical / doubtful
  if (/\b(skeptical|doubtful|unsure|not sure|confused|disagree)\b/i.test(lower)) {
    return 0.30;
  }

  // Baseline default stance for neutral input (stable 0.50, no artificial turn drift)
  return 0.50;
}

export function analyzeTrajectory(
  history: ConversationMessage[],
  currentMessage: string,
  currentSycophancyScore: number,
  currentRawRisk: number
): TrajectoryAnalysis {
  const points: TrajectoryPoint[] = [];

  let turn = 1;
  for (const msg of history) {
    if (msg.role === 'user') {
      const stance = estimateUserStance(msg.content, turn);
      const prevAssistant = history[history.indexOf(msg) - 1];
      const aiVal = prevAssistant?.analysis?.sycophancy.score ?? 0.35;
      const interventionApplied = prevAssistant?.analysis?.intervention.applied ?? false;

      points.push({
        turn,
        userStance: stance,
        aiValidation: aiVal,
        rawRisk: prevAssistant?.analysis?.risk.overallScore ?? 0.3,
        interventionApplied,
        hypothesis: msg.content.slice(0, 60)
      });
      turn++;
    }
  }

  // Current turn point
  const currentStance = estimateUserStance(currentMessage, turn);
  points.push({
    turn,
    userStance: currentStance,
    aiValidation: currentSycophancyScore,
    rawRisk: currentRawRisk,
    interventionApplied: false,
    hypothesis: currentMessage.slice(0, 60)
  });

  const previousStances = points.slice(0, -1).map(p => p.userStance);

  // Detect spiral pattern:
  // Is user stance monotonically increasing over recent turns AND AI validation remained high?
  let consecutiveValidations = 0;
  let escalatingStance = false;

  if (points.length >= 2) {
    const recent = points.slice(-3);
    let increasing = true;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].userStance <= recent[i - 1].userStance) {
        increasing = false;
        break;
      }
    }
    escalatingStance = increasing;

    consecutiveValidations = points.filter(p => p.aiValidation >= 0.55).length;
  }

  const spiralDetected = (points.length >= 3 && escalatingStance && consecutiveValidations >= 2) ||
                         (points.length >= 2 && currentStance > 0.85 && currentSycophancyScore > 0.70);

  // Compute reinforcement risk score (0.0 to 1.0)
  let reinforcementScore = 0.0;
  if (spiralDetected) {
    reinforcementScore = Math.min(0.96, 0.65 + (consecutiveValidations * 0.1));
  } else if (currentStance > 0.75 && currentSycophancyScore > 0.6) {
    reinforcementScore = 0.60;
  } else if (escalatingStance) {
    reinforcementScore = 0.40;
  } else if (currentSycophancyScore >= 0.50) {
    reinforcementScore = 0.25;
  }

  let trend: 'accelerating' | 'stable' | 'de-escalating' | 'neutral' = 'neutral';
  if (escalatingStance) trend = 'accelerating';
  else if (currentStance < (previousStances[previousStances.length - 1] ?? 0.5)) trend = 'de-escalating';
  else if (points.length > 1) trend = 'stable';

  const explanation = spiralDetected
    ? `Repeated belief reinforcement detected across ${points.length} turns. User certainty escalated from ${((points[0]?.userStance ?? 0.5) * 100).toFixed(0)}% to ${(currentStance * 100).toFixed(0)}% with repeated AI validation.`
    : `Trajectory shows ${trend} epistemic certainty (${(currentStance * 100).toFixed(0)}%).`;

  return {
    reinforcementScore: Number(reinforcementScore.toFixed(2)),
    currentStance: Number(currentStance.toFixed(2)),
    previousStances,
    stanceHistory: points,
    spiralDetected,
    consecutiveValidations,
    trend,
    explanation
  };
}

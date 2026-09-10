/**
 * SYCOGUARD Intervention Agent
 * 
 * Intercepts high-risk or unbalanced drafts and crafts calibrated, evidence-balanced responses.
 * Never purely adversarial; communicates uncertainty and grounds claims in evidence.
 */

import { InterventionResult, InterventionType, RiskAssessment, EvidenceItem, SycophancyAnalysis, DetectedIntent } from '../src/types.js';
import { extractSalientEntities } from './intentUnderstanding.js';

export function runInterventionAgent(
  userMessage: string,
  rawDraft: string,
  risk: RiskAssessment,
  sycophancy: SycophancyAnalysis,
  evidenceItems: EvidenceItem[],
  intent?: DetectedIntent
): InterventionResult {
  // If risk is LOW (0-24), PASS without intervention
  if (risk.level === 'LOW') {
    return {
      type: 'PASS',
      applied: false,
      reason: 'No meaningful epistemic-risk signal detected. Response verified and passed through directly.',
      details: 'User prompt is open or objective, and draft response maintains adequate epistemic distance and evidential grounding.',
      originalDraft: rawDraft,
      protectedResponse: rawDraft
    };
  }

  const supporting = evidenceItems.filter(e => e.classification === 'SUPPORTING');
  const contradictory = evidenceItems.filter(e => e.classification === 'CONTRADICTORY');
  const neutral = evidenceItems.filter(e => e.classification === 'NEUTRAL');

  let type: InterventionType = 'QUALIFY';
  let reason = '';
  let details = '';

  // Calibrated Intervention Thresholds:
  // 75–100 = CRITICAL  → REWRITE
  // 50–74  = HIGH      → BALANCE
  // 25–49  = MODERATE  → QUALIFY
  if (risk.level === 'CRITICAL') {
    type = 'REWRITE';
    reason = 'Response rewritten because high confirmation-seeking, agreement pressure, or evidence suppression was detected.';
    details = 'Blocked affirming echo chamber loop and evidence filtering. Replaced with objective scientific assessment, rigorous countervailing evidence, and epistemic boundaries.';
  } else if (risk.level === 'HIGH') {
    type = 'BALANCE';
    reason = 'Added relevant counter-evidence and multi-perspective findings that were omitted in the raw response.';
    details = 'Balanced selective confirmation bias by presenting peer-reviewed contradictory literature and methodological caveats.';
  } else {
    type = 'QUALIFY';
    reason = 'Added epistemic uncertainty because empirical evidence remains preliminary or contested.';
    details = 'Clarified the distinction between preliminary observations and definitive scientific consensus.';
  }

  // Extract topic and entities for grounded intervention
  const entities = intent?.keyEntities && intent.keyEntities.length > 0 
    ? intent.keyEntities 
    : extractSalientEntities(userMessage);
  const primaryEntity = entities[0] || 'your premise';
  const topicLabel = intent?.primaryTopic || entities.slice(0, 2).join(' and ') || 'this topic';

  // Construct the protected response grounded in the user's specific topic
  const lines: string[] = [];

  // Opening: Calibrated framing grounded in actual topic
  if (type === 'REWRITE') {
    lines.push(
      `While you've developed a strongly held premise around ${topicLabel}, empirical scientific consensus does not establish that your assertion is definitively true. In rigorous empirical inquiry, distinguishing between subjective correlation and verified causal proof regarding ${primaryEntity} is critical.`
    );
  } else if (type === 'BALANCE') {
    lines.push(
      `There are observable factors supporting certain aspects of your perspective on ${topicLabel}, but looking solely at confirming evidence creates an incomplete or cherry-picked picture.`
    );
  } else {
    lines.push(
      `Your hypothesis regarding ${topicLabel} addresses an interesting question, though the empirical data remains preliminary and requires careful scientific qualification.`
    );
  }

  // Evidence synthesis
  if (supporting.length > 0 || contradictory.length > 0 || neutral.length > 0) {
    lines.push('\n**Key Evidence Breakdown:**');

    if (supporting.length > 0) {
      lines.push(`- **Supporting Observations**: ${supporting[0].snippet} *(Source: ${supporting[0].source})*`);
    }

    if (contradictory.length > 0) {
      lines.push(`- **Countervailing Evidence**: ${contradictory[0].snippet} *(Source: ${contradictory[0].source})*`);
      if (contradictory.length > 1) {
        lines.push(`- **Further Rebuttal**: ${contradictory[1].snippet} *(Source: ${contradictory[1].source})*`);
      }
    } else {
      lines.push(`- **Methodological Limitations**: Controlled evaluations of ${primaryEntity} require reproducible cohorts before general causal mechanisms can be assumed.`);
    }

    if (neutral.length > 0) {
      lines.push(`- **Contextual Factor**: ${neutral[0].snippet} *(Source: ${neutral[0].source})*`);
    }
  } else {
    // Dynamic grounded evidence balance when no static database records match
    lines.push('\n**Scientific & Methodological Perspective:**');
    lines.push(`- **Empirical Boundaries**: Controlled evaluations of ${primaryEntity} require reproducible cohort data and multi-center trials before broad claims can be established.`);
    lines.push(`- **Alternative Explanations**: Confounding factors and placebo or expectancy effects frequently account for perceived correlations in ${topicLabel}.`);
  }

  // Epistemic conclusion
  lines.push(
    `\n**Conclusion & Epistemic Stance:**\n` +
    `Instead of adopting an all-or-nothing stance on ${primaryEntity}, the balanced consensus indicates that while specific contextual effects may exist, broader assertions of universal certainty remain unsupported. What specific experimental conditions or testable criteria would you consider to evaluate both perspectives fairly?`
  );

  const protectedResponse = lines.join('\n');

  return {
    type,
    applied: true,
    reason,
    details,
    originalDraft: rawDraft,
    protectedResponse
  };
}

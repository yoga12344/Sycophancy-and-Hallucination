/**
 * SYCOGUARD Intervention Agent
 * 
 * Intercepts high-risk or unbalanced drafts and crafts calibrated, evidence-balanced responses.
 * Never purely adversarial; communicates uncertainty and grounds claims in evidence.
 */

import { InterventionResult, InterventionType, RiskAssessment, EvidenceItem, SycophancyAnalysis } from '../src/types.js';

export function runInterventionAgent(
  userMessage: string,
  rawDraft: string,
  risk: RiskAssessment,
  sycophancy: SycophancyAnalysis,
  evidenceItems: EvidenceItem[]
): InterventionResult {
  // If risk is LOW and sycophancy is low, PASS
  if (risk.level === 'LOW' && sycophancy.score < 0.40) {
    return {
      type: 'PASS',
      applied: false,
      reason: 'No significant firewall concern detected.',
      details: 'Draft response maintains balanced epistemic boundaries and adequate evidential grounding.',
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

  if (risk.level === 'CRITICAL' || risk.components.reinforcement >= 0.70) {
    type = 'HIGH_RISK_INTERVENTION';
    reason = 'Response rewritten because the conversation shows repeated belief reinforcement and escalating certainty.';
    details = 'Blocked affirming echo chamber loop. Grounded discussion with rigorous counter-evidence and explicit epistemological boundaries.';
  } else if (risk.components.sycophancy >= 0.60) {
    type = 'REWRITE';
    reason = 'Removed unsupported validation and unconditional agreement markers.';
    details = 'Replaced sycophantic praise with objective scientific assessment and multi-perspective findings.';
  } else if (risk.components.evidenceImbalance >= 0.50) {
    type = 'BALANCE';
    reason = 'Added relevant counter-evidence that was omitted in the raw response.';
    details = 'Balanced selective confirmation bias by presenting peer-reviewed contradictory literature.';
  } else {
    type = 'QUALIFY';
    reason = 'Added epistemic uncertainty because empirical evidence remains mixed or incomplete.';
    details = 'Clarified the distinction between preliminary observations and definitive scientific consensus.';
  }

  // Construct the protected response
  const lines: string[] = [];

  // Opening: Calibrated framing
  if (type === 'HIGH_RISK_INTERVENTION') {
    lines.push(
      `While you've developed an intuitive theory around this topic, empirical evidence does not establish that your conclusion is definitively true. In scientific inquiry, distinguishing between subjective correlation and rigorous causal proof is critical.`
    );
  } else if (type === 'REWRITE') {
    lines.push(
      `The available evidence suggests a more nuanced reality than direct confirmation. Rather than declaring this proven, the current scientific literature presents substantial complexities.`
    );
  } else if (type === 'BALANCE') {
    lines.push(
      `There are observable factors supporting certain aspects of your perspective, but looking solely at confirming evidence creates an incomplete picture.`
    );
  } else {
    lines.push(
      `Your hypothesis addresses an interesting question, though the empirical data remains preliminary and requires careful qualification.`
    );
  }

  // Evidence synthesis (only include breakdown if empirical literature items exist)
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
      lines.push(`- **Methodological Limitations**: Independent meta-analyses require reproducible cohorts before general causal mechanisms can be assumed.`);
    }

    if (neutral.length > 0) {
      lines.push(`- **Contextual Factor**: ${neutral[0].snippet} *(Source: ${neutral[0].source})*`);
    }
  }

  // Epistemic conclusion
  lines.push(
    `\n**Conclusion & Epistemic Stance:**\n` +
    `Instead of adopting an all-or-nothing stance, the balanced consensus indicates that while specific short-term or contextual effects exist, broader assertions of universal truth remain unsupported. What specific experimental conditions or testable criteria would you consider to evaluate both perspectives fairly?`
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

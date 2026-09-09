/**
 * SYCOGUARD Evidence Balance Engine
 * 
 * Addresses "Factual Sycophancy" (selective reporting of true facts to reinforce a false belief).
 * Label: "Prototype evidence-balance estimate — not scientifically validated."
 */

import { EvidenceBalanceAnalysis, EvidenceItem } from '../src/types.js';

export function analyzeEvidenceBalance(
  draftResponse: string,
  evidencePool: EvidenceItem[]
): EvidenceBalanceAnalysis {
  let supportingCount = 0;
  let contradictoryCount = 0;
  let neutralCount = 0;

  for (const item of evidencePool) {
    if (item.classification === 'SUPPORTING') supportingCount++;
    else if (item.classification === 'CONTRADICTORY') contradictoryCount++;
    else neutralCount++;
  }

  // Check how many contradictory aspects or qualification nuances are addressed
  const draftLower = draftResponse.toLowerCase();
  let contradictoryAcknowledgedCount = 0;

  // General nuance/qualification markers in the draft
  const hasNuanceMarkers = /\b(however|although|on the other hand|nonetheless|limitation|tolerance|no significant difference|mixed results|drawback|contradicts|caveat|caution)\b/i.test(draftLower);
  
  const contradictoryItems = evidencePool.filter(i => i.classification === 'CONTRADICTORY');
  for (const item of contradictoryItems) {
    const keyPhrases = item.snippet.toLowerCase().split(/\W+/).filter(w => w.length > 5);
    const matches = keyPhrases.filter(p => draftLower.includes(p));
    if (matches.length >= 2 || (matches.length >= 1 && hasNuanceMarkers)) {
      contradictoryAcknowledgedCount++;
    }
  }

  let balanceScore = 1.0;
  let imbalanceDetected = false;
  let explanation = 'Prototype evidence-balance estimate: Available empirical evidence is proportionally represented.';

  if (evidencePool.length === 0) {
    balanceScore = 1.0;
    imbalanceDetected = false;
    explanation = 'Prototype evidence-balance estimate: No empirical controversy or evidence omission detected.';
  } else if (contradictoryCount > 0) {
    const inclusionRatio = contradictoryAcknowledgedCount / contradictoryCount;

    if (inclusionRatio < 0.5) {
      imbalanceDetected = true;
      balanceScore = Math.max(0.18, Number((inclusionRatio * 0.5).toFixed(2)));
      explanation = `Prototype evidence-balance estimate: Relevant contradictory evidence (${contradictoryCount} item(s)) exists in scientific literature, but was omitted from the raw draft in favor of one-sided confirmation.`;
    } else {
      balanceScore = Math.min(1.0, 0.70 + (inclusionRatio * 0.30));
      explanation = 'Prototype evidence-balance estimate: Countervailing evidence and empirical limitations are acknowledged.';
    }
  } else if (supportingCount > 0) {
    balanceScore = 0.95;
    explanation = 'Prototype evidence-balance estimate: Supported by empirical literature with no prominent countervailing trials identified.';
  }

  return {
    balanceScore: Number(balanceScore.toFixed(2)),
    supportingCount,
    contradictoryCount,
    neutralCount,
    evidenceItems: evidencePool,
    imbalanceDetected,
    explanation
  };
}

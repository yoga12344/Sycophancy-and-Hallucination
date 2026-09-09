/**
 * SYCOGUARD Factuality & Hallucination Analyzer
 * 
 * Splits assistant response into atomic claims and cross-references against
 * empirical evidence. Unverified claims remain strictly marked as 'unverifiable'.
 */

import { AtomicClaim, FactualityAnalysis, EvidenceItem } from '../src/types.js';

export function splitIntoAtomicClaims(text: string): string[] {
  // Strip introductory fluff like "You are right!"
  const clean = text
    .replace(/^(you('re| are) (absolutely|completely|totally)? (right|correct)[.!]?\s*)/i, '')
    .trim();

  // Split into sentences
  const rawSentences = clean
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const atomicClaims: string[] = [];

  for (const sentence of rawSentences) {
    // If sentence contains compound clauses with 'and' or 'while'
    if (sentence.includes(' and ') && sentence.length > 60) {
      const parts = sentence.split(/\s+and\s+/);
      for (const part of parts) {
        if (part.trim().length > 15) {
          atomicClaims.push(part.trim().replace(/[.?!]$/, ''));
        }
      }
    } else {
      atomicClaims.push(sentence.replace(/[.?!]$/, ''));
    }
  }

  return atomicClaims.slice(0, 6); // Cap at top 6 atomic claims for clean analysis
}

export function analyzeFactuality(
  draftResponse: string,
  evidencePool: EvidenceItem[]
): FactualityAnalysis {
  const rawClaims = splitIntoAtomicClaims(draftResponse);
  const claims: AtomicClaim[] = [];

  let supportedCount = 0;
  let contradictedCount = 0;
  let unverifiableCount = 0;

  for (let i = 0; i < rawClaims.length; i++) {
    const claimText = rawClaims[i];
    const claimLower = claimText.toLowerCase();

    // Check evidence pool for matches
    let bestSupportingEvidence: EvidenceItem | undefined;
    let bestContradictoryEvidence: EvidenceItem | undefined;

    for (const ev of evidencePool) {
      const evLower = ev.snippet.toLowerCase();
      // Token overlap heuristic
      const words = claimLower.split(/\W+/).filter(w => w.length > 4);
      const matchedWords = words.filter(w => evLower.includes(w));
      const overlapRatio = words.length > 0 ? matchedWords.length / words.length : 0;

      if (overlapRatio >= 0.3) {
        if (ev.classification === 'SUPPORTING') {
          bestSupportingEvidence = ev;
        } else if (ev.classification === 'CONTRADICTORY') {
          bestContradictoryEvidence = ev;
        }
      }
    }

    let status: 'supported' | 'contradicted' | 'uncertain' | 'unverifiable' = 'unverifiable';
    let confidence = 0.70;
    let evidenceSource: string | undefined;
    let contradictoryEvidence: string | undefined;

    // Strict truth assignment rules
    if (bestContradictoryEvidence && bestSupportingEvidence) {
      status = 'uncertain';
      confidence = 0.85;
      evidenceSource = bestSupportingEvidence.source;
      contradictoryEvidence = bestContradictoryEvidence.snippet;
    } else if (bestContradictoryEvidence) {
      status = 'contradicted';
      confidence = 0.92;
      contradictoryEvidence = bestContradictoryEvidence.snippet;
      contradictedCount++;
    } else if (bestSupportingEvidence) {
      status = 'supported';
      confidence = 0.88;
      evidenceSource = bestSupportingEvidence.source;
      supportedCount++;
    } else {
      // In accordance with product rules:
      // "If verification cannot be performed: status = 'unverifiable', not 'supported'"
      status = 'unverifiable';
      confidence = 0.60;
      unverifiableCount++;
    }

    claims.push({
      id: `claim_${i + 1}`,
      claim: claimText,
      status,
      confidence,
      evidenceSource,
      contradictoryEvidence
    });
  }

  // Calculate overall factuality score (0.0 to 1.0)
  // Contradictions represent confirmed hallucinations / falsehoods and drop the score severely.
  // Unverifiable claims (claims outside local retrieval corpus) carry an epistemic discount without false hallucination alarms.
  const total = claims.length;
  let score = 1.0;

  if (total === 0) {
    score = 1.0;
  } else if (contradictedCount > 0) {
    // Severe penalty for empirical contradictions
    const contradictionRatio = contradictedCount / total;
    score = Math.max(0.05, 0.65 - (contradictionRatio * 0.60) + (supportedCount / total) * 0.25);
  } else if (supportedCount > 0) {
    // Grounded in evidence with some unverifiable secondary claims
    score = Math.min(1.0, 0.85 + ((supportedCount / total) * 0.15));
  } else {
    // All claims unverified by local corpus, but 0 contradictions
    score = 0.82;
  }

  score = Math.min(1.0, Math.max(0.0, Number(score.toFixed(2))));

  return {
    score,
    claims,
    supportedCount,
    contradictedCount,
    unverifiedCount: unverifiableCount,
    summary: contradictedCount > 0 
      ? `Found ${contradictedCount} empirical contradiction(s) in draft response claims.` 
      : unverifiableCount > 0 
        ? `${unverifiableCount} claim(s) lack empirical grounding in the retrieval corpus.`
        : `All extracted claims are grounded in verifiable research literature.`
  };
}

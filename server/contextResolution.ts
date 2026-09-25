/**
 * SYCOGUARD Conversation Context Resolution Engine
 * 
 * Pipeline Stage 1a:
 * Determines the contextual relationship between the current user message and
 * conversation history. Resolves pronouns, ellipsis, follow-up references, and
 * corrections into a standalone `resolvedUserRequest` while preserving `rawUserMessage`
 * as the authoritative specification.
 * 
 * Principles:
 * 1. Do NOT dump the full conversation history indiscriminately. Identify the minimum
 *    relevant context turns necessary.
 * 2. Enforce strict topic boundaries: if the user shifts topics, previous context is isolated.
 * 3. Never mutate or overwrite `rawUserMessage`.
 * 4. Use semantic and discourse patterns rather than hard-coded topic keywords.
 */

import { ConversationTurn } from './intentUnderstanding.js';

export type ContextContinuityType =
  | 'NEW_TOPIC'
  | 'CONTINUATION'
  | 'FOLLOW_UP_QUESTION'
  | 'CORRECTION'
  | 'INDEPENDENT'
  | 'AMBIGUOUS';

export interface ContextResolutionResult {
  continuityType: ContextContinuityType;
  hasDependency: boolean;
  relevantTurns: ConversationTurn[];
  referencedSubjects: string[];
  resolvedUserRequest: string;
  rawUserMessage: string;
  resolutionNotes: string;
}

// Pronouns and demonstrative references pointing to prior discourse entities
const PRONOUN_REFERENCE_REGEX = /\b(it|they|them|this|that|these|those|the former|the latter|the same|its|their|the first one|the second one)\b/i;

// Follow-up question starters that rely on previous turn context
const ELLIPTICAL_FOLLOWUP_REGEX = /^(why|how so|what about\b|how about\b|and\?|where\?|when\?|who\?|can it\b|does it\b|is it\b|will it\b|could it\b|should it\b|what else\b)/i;

// Correction markers indicating user is revising a previous statement or preference
const CORRECTION_REGEX = /^(actually|wait|no|i mean|i meant|rather|correction|instead of|not that)\b/i;

// Discourse continuation markers
const CONTINUATION_MARKERS = /\b(elaborate|expand on (?:that|it|this)|tell me more|continue|go on|in that case|following up on)\b/i;

/**
 * Extracts salient noun phrases / subjects from text for contextual reference.
 */
function extractCoreSubject(text: string): string {
  // Strip code blocks and markdown formatting
  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/[#*_`]/g, '')
    .trim();

  // Pattern: "What is [Subject] primarily used for..." or "What is [Subject]?"
  const whatIsMatch = clean.match(/what\s+is\s+(?:a\s+|an\s+|the\s+)?([A-Za-z0-9_\-]+(?:\s+[A-Za-z0-9_\-]+)?)(?:\s+(?:primarily|mainly)?\s+used\s+for|\b|\?)/i);
  if (whatIsMatch && whatIsMatch[1]) {
    return whatIsMatch[1].trim();
  }

  // Try extracting subject from standard question/statement patterns
  const match = clean.match(/(?:about|regarding|how\s+(?:does|do|can|is)\s+|what\s+is\s+(?:a\s+|an\s+|the\s+)?|explain\s+)([A-Za-z0-9_\-\s]{2,40})/i);
  if (match && match[1]) {
    const rawSubject = match[1].trim();
    // Strip trailing predicate phrases
    const stripped = rawSubject.replace(/\s+(?:primarily|mainly)?\s*(?:used\s+for|work|works|in\s+modern|in|on|at|for|to).*$/i, '').trim();
    return stripped || rawSubject.split(/\s+/).slice(0, 3).join(' ');
  }

  // Fallback: take the first significant capitalized noun phrase or major words
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !/^(the|this|that|what|how|why|when|where|does|with|from|have|been|will|would|could|should)$/i.test(w));
  return words.slice(0, 3).join(' ') || 'the previous topic';
}

/**
 * Resolves conversation context and produces a standalone resolved request.
 */
export function resolveConversationContext(
  userMessage: string,
  history: ConversationTurn[] = []
): ContextResolutionResult {
  const raw = userMessage.trim();
  const lower = raw.toLowerCase();
  const wordCount = raw.split(/\s+/).length;

  // Case 0: No prior history — strictly independent
  if (!history || history.length === 0) {
    return {
      continuityType: 'INDEPENDENT',
      hasDependency: false,
      relevantTurns: [],
      referencedSubjects: [],
      resolvedUserRequest: raw,
      rawUserMessage: raw,
      resolutionNotes: 'First turn in conversation; standalone task specification.'
    };
  }

  // Get most recent user and assistant turns
  const lastTurn = history[history.length - 1];
  const lastUserTurn = [...history].reverse().find(t => t.role === 'user');
  const lastAssistantTurn = [...history].reverse().find(t => t.role === 'assistant');

  const priorSubject = lastUserTurn ? extractCoreSubject(lastUserTurn.content) : (lastAssistantTurn ? extractCoreSubject(lastAssistantTurn.content) : '');

  // Case 1: Correction of prior turn
  if (CORRECTION_REGEX.test(lower)) {
    const correctionClean = raw.replace(CORRECTION_REGEX, '').replace(/^[,\s]+/, '').trim();
    const resolved = priorSubject 
      ? `Regarding ${priorSubject}: Correction: ${correctionClean}`
      : raw;

    return {
      continuityType: 'CORRECTION',
      hasDependency: true,
      relevantTurns: history.slice(-2),
      referencedSubjects: priorSubject ? [priorSubject] : [],
      resolvedUserRequest: resolved,
      rawUserMessage: raw,
      resolutionNotes: `User issued a correction to preceding turn regarding ${priorSubject || 'prior topic'}.`
    };
  }

  // Case 2: Elliptical follow-up ("Why?", "What about persistence?", "How so?")
  if (ELLIPTICAL_FOLLOWUP_REGEX.test(lower)) {
    let resolved = raw;
    if (priorSubject) {
      if (/^(why|how so)\??$/i.test(raw)) {
        resolved = `Why does ${priorSubject} work this way?`;
      } else if (/^what about\s+/i.test(raw)) {
        const aspect = raw.replace(/^what about\s+/i, '').replace(/[?.\s]+$/, '').trim();
        resolved = `Regarding ${priorSubject}, what about ${aspect}?`;
      } else if (/^(can|does|is|will|could|should)\s+it\b/i.test(raw)) {
        resolved = raw.replace(/\bit\b/i, priorSubject);
      } else {
        resolved = `In the context of ${priorSubject}: ${raw}`;
      }
    }

    return {
      continuityType: 'FOLLOW_UP_QUESTION',
      hasDependency: true,
      relevantTurns: history.slice(-2),
      referencedSubjects: priorSubject ? [priorSubject] : [],
      resolvedUserRequest: resolved,
      rawUserMessage: raw,
      resolutionNotes: `Resolved elliptical follow-up referencing prior subject: ${priorSubject || 'previous turn'}.`
    };
  }

  // Case 3: Explicit pronoun references ("How does it handle X?", "Compare them")
  if (PRONOUN_REFERENCE_REGEX.test(lower) && wordCount <= 12 && priorSubject) {
    // Replace singular 'it' / 'this' / 'that' with priorSubject if appropriate
    const resolved = raw.replace(/\b(it|this|that)\b/i, priorSubject);

    return {
      continuityType: 'CONTINUATION',
      hasDependency: true,
      relevantTurns: history.slice(-2),
      referencedSubjects: [priorSubject],
      resolvedUserRequest: resolved,
      rawUserMessage: raw,
      resolutionNotes: `Resolved pronoun reference to prior subject: "${priorSubject}".`
    };
  }

  // Case 4: Continuation markers ("elaborate", "expand on that", "tell me more")
  if (CONTINUATION_MARKERS.test(lower)) {
    const resolved = priorSubject
      ? `Please provide an in-depth expansion on ${priorSubject}, addressing: ${raw}`
      : raw;

    return {
      continuityType: 'CONTINUATION',
      hasDependency: true,
      relevantTurns: history.slice(-2),
      referencedSubjects: priorSubject ? [priorSubject] : [],
      resolvedUserRequest: resolved,
      rawUserMessage: raw,
      resolutionNotes: `User requested elaboration on ${priorSubject || 'prior topic'}.`
    };
  }

  // Case 5: Independent topic or fresh query
  return {
    continuityType: 'NEW_TOPIC',
    hasDependency: false,
    relevantTurns: [],
    referencedSubjects: [],
    resolvedUserRequest: raw,
    rawUserMessage: raw,
    resolutionNotes: 'Distinct standalone task; previous conversation context isolated.'
  };
}

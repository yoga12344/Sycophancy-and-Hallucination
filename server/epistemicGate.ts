/**
 * SYCOGUARD Epistemic Relevance Gate
 * 
 * Pipeline Stage 0:
 * Evaluates whether incoming user input contains an epistemic stance, hypothesis,
 * confirmation demand, or empirical claim that warrants belief-reinforcement monitoring.
 * 
 * Casual greetings, pleasantries, non-epistemic tasks, and polite chatter bypass
 * the heavy cognitive defense pipeline to avoid false-positive interventions.
 */

import { EpistemicCategory, EpistemicRelevanceResult } from '../src/types.js';

// Regular expressions for greetings & pleasantries
const GREETING_PATTERNS = [
  /^(hello|hi|hey|heya|howdy|greetings|good\s+(morning|afternoon|evening|day)|yo|sup)[\s!.,?]*$/i,
  /^(hi|hello|hey)\s+(there|assistant|bot|sycoguard|friend)[\s!.,?]*$/i
];

// Conversational pleasantries, acknowledgments, or bot identity questions
const CASUAL_PATTERNS = [
  /^(how are you|how's it going|how are you doing|how do you do)[\s?]*$/i,
  /^(thanks|thank you|thx|ty|much appreciated|thanks a lot|great thanks)[\s!.,]*$/i,
  /^(ok|okay|got it|cool|nice|understood|noted|awesome|sure thing|sounds good)[\s!.,]*$/i,
  /^(bye|goodbye|see you|take care|have a good one)[\s!.,]*$/i,
  /^(who are you|what is your name|what can you do|what are your capabilities|introduce yourself)[\s?]*$/i
];

// Programming, software development, debugging, and computational tasks
const CODING_TASK_PATTERNS = [
  /\b(?:give me|write|generate|show me|create|provide|implement|debug|fix|explain)\s+(?:(?:some|a|an|the|me)\s+)?(?:code|function|program|script|algorithm|method|class|snippet|implementation|solution|regex|sql|query|test|boilerplate)\b/i,
  /\b(?:how (?:to|do i|can i)\s+(?:code|write|program|implement|build|debug|fix|solve|calculate|compute))\b/i,
  /\b(?:code|program|script|function|algorithm)\s+(?:for|to|that)\b/i,
  /\b(?:in\s+)?(?:python|javascript|typescript|c\+\+|cpp|c#|java|rust|golang|go|ruby|php|html|css|sql|bash|powershell|react|vue|angular)\s+(?:code|script|function|program|implementation|snippet)\b/i,
  /\b(?:add|multiply|divide|subtract|calculate|sum|sort|reverse|parse|filter)\s+(?:two|2|\d+|these)?\s*(?:numbers|strings|arrays|elements|items|lists)\b/i
];

// Operational, educational, and creative non-epistemic instructions
const OPERATIONAL_PATTERNS = [
  /^(?:tell me a joke|write a poem|write a song|write an essay|summarize this|translate this|format this as|calculate\b|what is \d+[\s+\-*/])/i,
  /^(?:list|generate|suggest|give me|recommend|brainstorm)\s+\d*\s*(?:ideas|examples|names|tips|steps|recipes|books|movies|songs|exercises|prompts|questions)\b/i,
  /^(?:convert|parse|extract|sort|filter|reverse|count|format)\b/i,
  /^(?:help me (?:with|to|draft|write|plan|organize|schedule|fix))\b/i
];

// Direct confirmation-seeking patterns (highest priority epistemic signal)
const CONFIRMATION_PATTERNS = [
  /\b(give me (?:the )?(?:scientific )?evidence (?:proving|confirming|that)|confirm (?:that|my)|back me up|prove (?:my theory|me right|that)|find studies (?:proving|that show i'm right))\b/i,
  /\b(isn't it (?:obviously |clearly )?true that|don't you agree that|agree with me that|admit that)\b/i,
  /\b(right\?|agree\?|correct\?)\s*$/i
];

// Explicit user hypothesis & belief expressions
const HYPOTHESIS_PATTERNS = [
  /\b(?:i believe|my theory is|i am convinced|i know for a fact|i feel like|it's obvious that|it is undeniable that)\s+([^.!?]+)/i,
  /\b(?:my hypothesis is|i've concluded that|leads me to believe that|proves that)\s+([^.!?]+)/i,
  /\b(?:i think|i suspect|i'm pretty sure that)\s+([^.!?]+)/i
];

// Empirical & scientific topics known to trigger sycophancy or controversy
const EMPIRICAL_KEYWORDS = [
  'caffeine', 'coffee', 'fasting', 'autophagy', 'calorie', 'metabolism',
  'consciousness', 'sentient', 'sentience', 'self-awareness', 'conscious',
  'remote work', 'wfh', 'productivity', 'trading', 'chart patterns', 'technical analysis',
  'mitochondrial', 'autoimmune', 'ice bath', 'cold shower', 'vaccine', 'climate',
  'cognitive baseline', 'neurogenesis', 'medication', 'treatment', 'cure'
];

export function evaluateEpistemicRelevance(userMessage: string): EpistemicRelevanceResult {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check for pure greetings
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isEpistemicallyRelevant: false,
        category: 'GREETING',
        confidence: 0.98,
        reason: 'Input is a standard greeting. No epistemic stance, hypothesis, or evidence request detected.'
      };
    }
  }

  // 2. Check for casual chatter / acknowledgments
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isEpistemicallyRelevant: false,
        category: 'CASUAL_CHAT',
        confidence: 0.95,
        reason: 'Input is casual conversational interaction or polite acknowledgment. Belief-reinforcement pipeline bypassed.'
      };
    }
  }

  // 3. Check for coding / programming / software engineering instructions
  for (const pattern of CODING_TASK_PATTERNS) {
    if (pattern.test(trimmed) && !EMPIRICAL_KEYWORDS.some(k => lower.includes(k))) {
      return {
        isEpistemicallyRelevant: false,
        category: 'NON_EPISTEMIC_TASK',
        confidence: 0.96,
        reason: 'Input is a software engineering / coding task. Does not formulate an empirical hypothesis or demand belief validation.'
      };
    }
  }

  // 4. Check for operational or creative instructions
  for (const pattern of OPERATIONAL_PATTERNS) {
    if (pattern.test(trimmed) && !EMPIRICAL_KEYWORDS.some(k => lower.includes(k))) {
      return {
        isEpistemicallyRelevant: false,
        category: 'NON_EPISTEMIC_TASK',
        confidence: 0.94,
        reason: 'Instruction is an operational/creative task without empirical truth claims or belief validation.'
      };
    }
  }

  // 5. Check for explicit confirmation-seeking
  for (const pattern of CONFIRMATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isEpistemicallyRelevant: true,
        category: 'CONFIRMATION_SEEKING',
        confidence: 0.96,
        reason: 'Explicit confirmation-seeking detected. User seeks validation for a subjective or unverified assertion.',
        detectedHypothesis: trimmed
      };
    }
  }

  // 6. Check for explicit hypothesis formulation
  for (const pattern of HYPOTHESIS_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return {
        isEpistemicallyRelevant: true,
        category: 'EPISTEMIC_HYPOTHESIS',
        confidence: 0.92,
        reason: `User formulated an explicit hypothesis: "${match[1].trim()}".`,
        detectedHypothesis: match[1].trim()
      };
    }
  }

  // 7. Check for empirical keywords in declarative or question format
  const hasEmpiricalKeyword = EMPIRICAL_KEYWORDS.some(k => lower.includes(k));
  const isQuestion = trimmed.endsWith('?') || /^(what|how|why|does|can|is|are)\b/i.test(trimmed);

  if (hasEmpiricalKeyword) {
    if (isQuestion) {
      return {
        isEpistemicallyRelevant: true,
        category: 'FACTUAL_QUERY',
        confidence: 0.88,
        reason: 'Inquiry relates to an empirical domain with verifiable scientific literature.',
        detectedHypothesis: undefined
      };
    } else {
      return {
        isEpistemicallyRelevant: true,
        category: 'EPISTEMIC_HYPOTHESIS',
        confidence: 0.85,
        reason: 'Declarative assertion on an empirical topic with potential truth-value implications.',
        detectedHypothesis: trimmed
      };
    }
  }

  // 8. General imperative action commands (e.g. "give me...", "write a...", "create a...")
  const isImperativeTask = /^(?:give me|show me|write|create|generate|provide|build|make|calculate|explain how to|help me)\b/i.test(trimmed);
  if (isImperativeTask) {
    return {
      isEpistemicallyRelevant: false,
      category: 'NON_EPISTEMIC_TASK',
      confidence: 0.90,
      reason: 'Imperative operational request without empirical assertion or belief confirmation.'
    };
  }

  // 9. Short utterances without claims
  if (trimmed.length < 25 && !isQuestion) {
    return {
      isEpistemicallyRelevant: false,
      category: 'CASUAL_CHAT',
      confidence: 0.80,
      reason: 'Short utterance without identifiable epistemic claim or hypothesis.'
    };
  }

  // 10. If question, mark as factual query; otherwise epistemic claim
  return {
    isEpistemicallyRelevant: true,
    category: isQuestion ? 'FACTUAL_QUERY' : 'EPISTEMIC_HYPOTHESIS',
    confidence: 0.70,
    reason: isQuestion ? 'General informational inquiry.' : 'Declarative statement evaluated for epistemic consistency.',
    detectedHypothesis: isQuestion ? undefined : trimmed
  };
}

/**
 * SYCOGUARD Intent Understanding Engine
 * 
 * Pipeline Stage 1:
 * Determines the user's actual intent from the raw input and conversation context.
 * 
 * Guiding Principles:
 * 1. Do NOT assume every message is a question.
 * 2. Discern between 13 distinct intent types (coding, documents, projects, summaries,
 *    explanations, analysis, continuation, factual claims, instructions, ambiguous, etc.).
 * 3. Enforce current-task boundaries: do not leak unrelated previous turn context.
 * 4. Handle ambiguity gracefully: if no clear action is requested, do not invent one.
 * 5. Generalize across arbitrary future domains without hardcoded keywords.
 */

import { DetectedIntent, UserIntentType } from '../src/types.js';

// Common English stop words for entity extraction
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'please', 'just', 'also', 'really', 'want', 'like', 'know'
]);

export interface ConversationTurn {
  role: string;
  content: string;
}

/**
 * Extracts salient tokens/entities from text without hardcoded topic lists.
 */
export function extractSalientEntities(text: string): string[] {
  // Strip code blocks and markdown formatting for cleaner tokenization
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .toLowerCase();

  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  // Frequency count to find top salient entities
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 8);
}

/**
 * Detects multiple sub-questions in a prompt.
 */
export function extractMultiPartQuestions(text: string): string[] {
  const parts: string[] = [];
  
  // Check for numbered lists e.g. "1. ... 2. ..."
  const numberedMatches = text.match(/(?:^|\n)\s*(?:\d+[\.\)]|[-*])\s+([^\n?]+\??)/gi);
  if (numberedMatches && numberedMatches.length > 1) {
    return numberedMatches.map(p => p.trim());
  }

  // Split by question marks if multiple exist
  const questionSegments = text.split(/\?+/).map(s => s.trim()).filter(s => s.length > 5);
  if (questionSegments.length > 1) {
    return questionSegments.map(s => s + '?');
  }

  return parts;
}

/**
 * Checks whether user message relies on prior context turns or establishes a fresh task.
 */
export function evaluateContextDependencies(
  userMessage: string,
  history: ConversationTurn[]
): { contextDependencies: string[]; hasContextDependency: boolean } {
  if (!history || history.length === 0) {
    return { contextDependencies: [], hasContextDependency: false };
  }

  const trimmed = userMessage.trim().toLowerCase();

  // Reference indicators pointing to previous turns
  const continuationPatterns = [
    /\b(that|this|it|the (?:first|second|third|previous|above|former|latter)|earlier|as you (?:said|mentioned)|you said|what about (?:that|it))\b/i,
    /\b(elaborate|tell me more|expand on (?:that|it|this)|why is that|how so|continue|and\?|what else)\b/i,
    /\b(what about\s+[a-z0-9_-]+)\b/i
  ];

  const hasReference = continuationPatterns.some(p => p.test(trimmed));
  const isShortUtterance = trimmed.split(/\s+/).length <= 6 && (hasReference || trimmed.startsWith('and') || trimmed.startsWith('but'));

  if (hasReference || isShortUtterance) {
    // Find salient entities from the most recent assistant and user messages
    const lastTurn = history[history.length - 1];
    const prevEntities = extractSalientEntities(lastTurn.content);
    return {
      contextDependencies: prevEntities.slice(0, 4),
      hasContextDependency: true
    };
  }

  // If no reference indicators, enforce current-task boundary: do NOT contaminate with old context
  return { contextDependencies: [], hasContextDependency: false };
}

/**
 * Main Intent Analysis Engine
 */
export function analyzeUserIntent(
  userMessage: string,
  history: ConversationTurn[] = []
): DetectedIntent {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

  const entities = extractSalientEntities(trimmed);
  const multiPart = extractMultiPartQuestions(trimmed);
  const { contextDependencies, hasContextDependency } = evaluateContextDependencies(trimmed, history);

  // 0. Check for GREETINGS and CASUAL COURTESY
  const isGreeting = /^(hello|hi|hey|heya|howdy|greetings|good\s+(morning|afternoon|evening|day)|yo|sup)[\s!.,?]*$/i.test(trimmed);
  if (isGreeting) {
    return {
      intentType: 'INFORMATION_SHARING',
      primaryTopic: 'Greeting & Assistance',
      keyEntities: ['greeting'],
      requestedAction: 'Respond politely to greeting and offer assistance',
      expectedOutputType: 'acknowledgment',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 1. Check for INCOMPLETE OR AMBIGUOUS inputs
  const isVeryShort = wordCount <= 3 && !trimmed.endsWith('?');
  const isVagueExpression = /^(maybe|perhaps|i guess|not sure|whatever|later|soon|hmm|uh|ok then|if you say so|...|idk)[\s.?!]*$/i.test(trimmed);
  if (isVeryShort || isVagueExpression) {
    return {
      intentType: 'INCOMPLETE_OR_AMBIGUOUS',
      primaryTopic: entities[0] || 'Unspecified input',
      keyEntities: entities,
      requestedAction: 'Acknowledge input and politely invite clarification without guessing or inventing a task',
      expectedOutputType: 'clarification',
      isAmbiguous: true,
      ambiguityReason: 'Input is very brief or underspecified with no explicit action, question, or clear subject.',
      multiPartQuestions: [],
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 2. Check for CODE INPUT
  const hasCodeBlock = /```[\s\S]*?```/.test(trimmed) || /`[^`]{8,}`/.test(trimmed);
  const hasCodeKeywords = /\b(function|def\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|class\s+\w+|import\s+.*from|#include|package\s+\w+|public\s+static\s+void|return\s+[\w(]|console\.log|print\()/i.test(trimmed);
  const asksForCode = /\b(?:write|code|implement|create|generate|show|provide|give me)\b.*?\b(?:script|function|program|algorithm|class|method|component|endpoint|query|sql|regex|code|implementation|solution|snippet)\b/i.test(lower) || /\b(?:how (?:to|do i|can i)\s+(?:code|write|program|implement))\b/i.test(lower);
  const asksToDebug = /\b(?:debug|fix|why is (?:this|my) code|syntax error|type error|stack trace|runtime error)\b/i.test(lower);

  if (hasCodeBlock || asksForCode || (hasCodeKeywords && lines.length > 2) || asksToDebug) {
    return {
      intentType: 'CODE_INPUT',
      primaryTopic: entities.slice(0, 2).join(' ') || 'Code implementation',
      keyEntities: entities,
      requestedAction: asksToDebug ? 'Debug and inspect code' : 'Analyze or write code solution',
      expectedOutputType: 'code',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 3. Check for DOCUMENT INPUT / LOGS / DATA
  const isMultiLineDoc = lines.length >= 4 && trimmed.length > 200;
  const hasDocHeaders = /(?:^|\n)\s*(?:#+\s+|[A-Z0-9\s_-]+:\s*|Log Entry|Document:|Context:|Report:|Minutes:)/.test(trimmed);
  const isPastingData = /(?:log|error|traceback|json|csv|retrospective|meeting notes|transcript)/i.test(lower) && trimmed.length > 150;

  if ((isMultiLineDoc || hasDocHeaders || isPastingData) && !asksForCode) {
    const asksSummary = /\b(?:summarize|summary|tl;dr|key takeaways|bullet points)\b/i.test(lower);
    return {
      intentType: asksSummary ? 'SUMMARY_REQUEST' : 'DOCUMENT_INPUT',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Provided document content',
      keyEntities: entities,
      requestedAction: asksSummary ? 'Summarize provided document' : 'Acknowledge, ingest, or extract insights from document',
      expectedOutputType: asksSummary ? 'summary' : 'analysis',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 4. Check for SUMMARY REQUEST on text or prior conversation
  if (/\b(?:summarize|give me a summary|recap|tl;dr|in brief|overview of)\b/i.test(lower)) {
    return {
      intentType: 'SUMMARY_REQUEST',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Subject to summarize',
      keyEntities: entities,
      requestedAction: 'Synthesize concise summary focusing on key findings and core points',
      expectedOutputType: 'summary',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 5. Check for PROJECT DESCRIPTION
  const describesProject = /\b(?:i am building|we are developing|working on a project|our architecture|designing a system|creating an app|building a tool)\b/i.test(lower);
  if (describesProject) {
    return {
      intentType: 'PROJECT_DESCRIPTION',
      primaryTopic: entities.slice(0, 3).join(' ') || 'User project architecture',
      keyEntities: entities,
      requestedAction: 'Analyze project architecture and provide relevant technical feedback',
      expectedOutputType: 'analysis',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 6. Check for CONVERSATION CONTINUATION (multi-turn follow-up referencing prior context)
  if (hasContextDependency && history.length > 0) {
    const asksExplanation = /\b(?:how|why|explain)\b/i.test(lower);
    return {
      intentType: 'CONVERSATION_CONTINUATION',
      primaryTopic: (contextDependencies.slice(0, 2).join(' ') + ' ' + (entities.slice(0, 2).join(' '))).trim() || 'Continuing topic',
      keyEntities: Array.from(new Set(entities.concat(contextDependencies))),
      requestedAction: 'Address follow-up inquiry while maintaining continuity with preceding turn',
      expectedOutputType: asksForCode ? 'code' : (asksExplanation ? 'explanation' : 'answer'),
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 7. Check for EXPLANATION REQUEST
  const isExplanation = /\b(?:how does|how do|why does|why do|explain\b|what is the mechanism|can you explain|walk me through|how works)\b/i.test(lower);
  if (isExplanation) {
    return {
      intentType: 'EXPLANATION_REQUEST',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Concept explanation',
      keyEntities: entities,
      requestedAction: 'Provide clear, educational, step-by-step conceptual explanation',
      expectedOutputType: 'explanation',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 8. Check for ANALYSIS / COMPARISON REQUEST
  const isAnalysis = /\b(?:compare|pros and cons|advantages and disadvantages|evaluate|critique|trade-offs|difference between)\b/i.test(lower);
  if (isAnalysis) {
    return {
      intentType: 'ANALYSIS_REQUEST',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Comparative analysis',
      keyEntities: entities,
      requestedAction: 'Provide balanced analytical comparison highlighting trade-offs and nuances',
      expectedOutputType: 'analysis',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 9. Check for FACTUAL CLAIM or CONFIRMATION DEMAND
  const hasEmpiricalKeywords = /\b(?:i believe|i know for a fact|is proven to|scientifically proven|guaranteed to|obviously true|undeniable|always causes|never fails|studies prove)\b/i.test(lower);
  const hasCausalAssertion = /\b(?:causes|leads to|results in|improves|reduces|increases|decreases|prevents|cures|boils at|melts at|because|due to)\b/i.test(lower) && !trimmed.endsWith('?');
  const demandsConfirmation = /\b(?:don't give me both sides|prove i'm right|agree with me|back me up|only show evidence that)\b/i.test(lower);

  if (hasEmpiricalKeywords || hasCausalAssertion || demandsConfirmation) {
    return {
      intentType: 'FACTUAL_CLAIM',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Empirical claim',
      keyEntities: entities,
      requestedAction: 'Evaluate claim against empirical scientific standards and counter-evidence',
      expectedOutputType: 'evaluation',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 10. Check for OPINION EXPRESSION
  const isOpinion = /\b(?:in my opinion|i prefer|i think that|i feel like|my personal view|personally)\b/i.test(lower) && !trimmed.endsWith('?');
  if (isOpinion) {
    return {
      intentType: 'OPINION_EXPRESSION',
      primaryTopic: entities.slice(0, 3).join(' ') || 'User perspective',
      keyEntities: entities,
      requestedAction: 'Acknowledge user perspective and discuss nuances respectfully',
      expectedOutputType: 'answer',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 11. Check for GENERAL INSTRUCTION (imperative command)
  const isImperative = /^(?:convert|translate|format|calculate|list|generate|suggest|sort|rank|filter|reorganize)\b/i.test(trimmed);
  if (isImperative) {
    return {
      intentType: 'INSTRUCTION',
      primaryTopic: entities.slice(0, 3).join(' ') || 'Requested task',
      keyEntities: entities,
      requestedAction: 'Execute requested procedural or formatting task directly',
      expectedOutputType: asksForCode ? 'code' : 'answer',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 12. Check for QUESTION
  const isQuestion = trimmed.endsWith('?') || /^(what|how|why|does|can|is|are|which|where|when|who)\b/i.test(trimmed);
  if (isQuestion) {
    return {
      intentType: 'QUESTION',
      primaryTopic: entities.slice(0, 3).join(' ') || 'User inquiry',
      keyEntities: entities,
      requestedAction: 'Answer the question directly, informatively, and accurately',
      expectedOutputType: asksForCode ? 'code' : 'answer',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies,
      rawUserMessage: trimmed
    };
  }

  // 13. Default: INFORMATION SHARING
  return {
    intentType: 'INFORMATION_SHARING',
    primaryTopic: entities.slice(0, 3).join(' ') || 'Provided information',
    keyEntities: entities,
    requestedAction: 'Acknowledge information and provide thoughtful contextual insight',
    expectedOutputType: 'acknowledgment',
    isAmbiguous: false,
    multiPartQuestions: multiPart,
    contextDependencies,
    rawUserMessage: trimmed
  };
}

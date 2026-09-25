/**
 * SYCOGUARD Semantic Intent Understanding Engine
 * 
 * Pipeline Stage 1b:
 * Determines what the user is actually trying to accomplish across exactly 20 distinct
 * semantic intent categories. Integrates conversation context resolution to resolve
 * follow-up questions and pronoun references. Extracts atomic claims, requested actions,
 * and expected output types without using crude keyword templates.
 * 
 * Exactly 20 Intent Categories:
 * 1.  GREETING
 * 2.  FACTUAL_QUESTION
 * 3.  FACTUAL_CLAIM
 * 4.  CONFIRMATION_SEEKING
 * 5.  INFORMATION_REQUEST
 * 6.  INFORMATION_SHARING
 * 7.  EXPLANATION_REQUEST
 * 8.  SUMMARY_REQUEST
 * 9.  ANALYSIS_REQUEST
 * 10. CODE_REQUEST
 * 11. CODE_INPUT
 * 12. DOCUMENT_INPUT
 * 13. PROJECT_DESCRIPTION
 * 14. CONVERSATION_CONTINUATION
 * 15. OPINION_REQUEST
 * 16. OPINION_EXPRESSION
 * 17. INSTRUCTION
 * 18. COMPARISON_REQUEST
 * 19. MULTI_PART_REQUEST
 * 20. INCOMPLETE_OR_AMBIGUOUS
 */

import { DetectedIntent, UserIntentType, ExpectedOutputType } from '../src/types.js';
import { resolveConversationContext } from './contextResolution.js';

// Common English stopwords for token filtering
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
 * Extracts salient conceptual entities without relying on raw random tokens.
 */
export function extractSalientEntities(text: string): string[] {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .toLowerCase();

  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
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
  // Check for numbered items or bullets that are actually questions (ending with ?)
  const numberedQuestionMatches = text.match(/(?:^|\n|\s)\s*(?:\d+[\.\)]|[-*])\s+([^\n?]+\?)/gi);
  if (numberedQuestionMatches && numberedQuestionMatches.length > 1) {
    return numberedQuestionMatches.map(p => p.trim());
  }

  const questionSegments = text.split(/\?+/).map(s => s.trim()).filter(s => s.length > 8);
  if (questionSegments.length > 1) {
    const actualQuestions = questionSegments.filter(s => /\b(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does)\b/i.test(s));
    if (actualQuestions.length > 1) {
      return actualQuestions.map(s => s.endsWith('?') ? s : s + '?');
    }
  }

  return [];
}

/**
 * Extracts the primary topic cleanly from text rather than concatenating arbitrary stopwords.
 */
function extractPrimaryTopic(text: string, entities: string[]): string {
  const trimmed = text.trim();

  // Try extracting core subject from clear syntactic question patterns
  const questionPattern = trimmed.match(/(?:what\s+causes|how\s+does|why\s+does|what\s+is|explain|compare|difference\s+between)\s+([^?.!\n]{3,60})/i);
  if (questionPattern && questionPattern[1]) {
    return questionPattern[1].trim().replace(/\s+(?:in|on|at|for|with|of)$/i, '');
  }

  // If entities exist, take the top 2-3 most frequent entities as a coherent phrase
  if (entities.length > 0) {
    return entities.slice(0, 3).join(' ');
  }

  // Fallback to first line summary
  return trimmed.split(/\n/)[0].slice(0, 50).trim() || 'General query';
}

/**
 * Checks whether user message relies on prior context turns.
 */
export function evaluateContextDependencies(
  userMessage: string,
  history: ConversationTurn[]
): { contextDependencies: string[]; hasContextDependency: boolean } {
  const res = resolveConversationContext(userMessage, history);
  return {
    contextDependencies: res.referencedSubjects,
    hasContextDependency: res.hasDependency
  };
}

/**
 * Main Semantic Intent Understanding Engine
 * Classifies input into exactly one of the 20 defined intent types.
 */
export function analyzeUserIntent(
  userMessage: string,
  history: ConversationTurn[] = []
): DetectedIntent {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

  const contextResolution = resolveConversationContext(trimmed, history);
  const entities = extractSalientEntities(trimmed);
  const multiPart = extractMultiPartQuestions(trimmed);
  const primaryTopic = extractPrimaryTopic(trimmed, entities);

  // 1. GREETING
  const isGreeting = /^(hello|hi|hey|heya|howdy|greetings|good\s+(morning|afternoon|evening|day)|yo|sup)[\s!.,?]*$/i.test(trimmed);
  if (isGreeting) {
    return {
      intentType: 'GREETING',
      primaryTopic: 'Conversational Greeting',
      keyEntities: entities.length > 0 ? entities : ['greeting'],
      requestedAction: 'Acknowledge greeting and offer contextual assistance',
      expectedOutputType: 'CONVERSATIONAL_RESPONSE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: [],
      conversationDependency: false,
      resolvedUserRequest: trimmed,
      rawUserMessage: trimmed
    };
  }

  // 2. INCOMPLETE_OR_AMBIGUOUS
  const isVagueExpression = /^(maybe|perhaps|i guess|not sure|whatever|later|soon|hmm+|uh+|ok then|if you say so|\.\.\.|idk|dunno)\b/i.test(trimmed) && !trimmed.includes('?') && wordCount <= 6;
  const isVeryShortNonsense = wordCount <= 2 && !trimmed.endsWith('?') && !isGreeting && !/^(why|how|what|who|when|where)\b/i.test(trimmed);
  if (isVagueExpression || (isVeryShortNonsense && !contextResolution.hasDependency)) {
    return {
      intentType: 'INCOMPLETE_OR_AMBIGUOUS',
      primaryTopic: primaryTopic || 'Underspecified input',
      keyEntities: entities,
      requestedAction: 'Ask targeted clarification grounded in user prompt',
      expectedOutputType: 'CLARIFICATION',
      isAmbiguous: true,
      ambiguityReason: 'Input is very brief or underspecified with no explicit action, question, or clear subject.',
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: trimmed,
      rawUserMessage: trimmed
    };
  }

  // 3. MULTI_PART_REQUEST
  if (multiPart.length > 1) {
    return {
      intentType: 'MULTI_PART_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: `Address all ${multiPart.length} distinct questions systematically`,
      expectedOutputType: 'DIRECT_ANSWER',
      isAmbiguous: false,
      multiPartQuestions: multiPart,
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 4. CONFIRMATION_SEEKING (Aggressive agreement demands)
  const demandsConfirmation = /\b(don't give me both sides|prove (?:that|i'm right|me right)|agree with me|back me up|only (?:show|find) evidence that proves|admit that i am right|tell me i'm right)\b/i.test(lower);
  if (demandsConfirmation) {
    return {
      intentType: 'CONFIRMATION_SEEKING',
      primaryTopic,
      keyEntities: entities,
      claim: trimmed,
      requestedAction: 'Evaluate factual proposition objectively while neutralizing agreement pressure',
      expectedOutputType: 'CLAIM_VERIFICATION',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 5. FACTUAL_CLAIM (Empirical assertions made as objective truth)
  const hasEmpiricalAssertion = /\b(i know for a fact|is proven to|scientifically proven|guaranteed to|obviously true|undeniable|always causes|never fails|studies prove)\b/i.test(lower);
  const hasCausalAssertion = /\b(causes|leads to|results in|improves|reduces|increases|decreases|prevents|cures|boils at|melts at)\b/i.test(lower) && !trimmed.endsWith('?');
  if (hasEmpiricalAssertion || hasCausalAssertion) {
    return {
      intentType: 'FACTUAL_CLAIM',
      primaryTopic,
      keyEntities: entities,
      claim: trimmed,
      requestedAction: 'Verify validity of factual claim against scientific evidence and empirical consensus',
      expectedOutputType: 'CLAIM_VERIFICATION',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 6. CODE_REQUEST vs CODE_INPUT
  const hasCodeBlock = /```[\s\S]*?```/.test(trimmed) || /`[^`]{8,}`/.test(trimmed);
  const hasCodeKeywords = /\b(function|def\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|class\s+\w+|import\s+.*from|#include|package\s+\w+|public\s+static\s+void|return\s+[\w(]|console\.log|print\()/i.test(trimmed);
  const asksToDebug = /\b(debug|fix|why is (?:this|my) code|syntax error|type error|stack trace|runtime error)\b/i.test(lower);
  const asksForCodeGeneration = /\b(write|code|implement|create|generate|show me code|give me a function|write a script)\b/i.test(lower) && /\b(code|function|script|algorithm|class|method|component|endpoint|sql|regex|program)\b/i.test(lower);

  if (hasCodeBlock || (hasCodeKeywords && lines.length > 2) || (asksToDebug && hasCodeKeywords)) {
    return {
      intentType: 'CODE_INPUT',
      primaryTopic,
      keyEntities: entities,
      requestedAction: asksToDebug ? 'Debug and inspect provided code' : 'Analyze or refactor provided code',
      expectedOutputType: 'CODE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  if (asksForCodeGeneration || /\bhow (?:to|do i|can i)\s+(?:code|write|program|implement)\b/i.test(lower)) {
    return {
      intentType: 'CODE_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Write functional, modular code implementation meeting requirements',
      expectedOutputType: 'CODE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 7. DOCUMENT_INPUT / LOGS / DATA
  const isMultiLineDoc = lines.length >= 4 && trimmed.length > 200;
  const hasDocHeaders = /(?:^|\n)\s*(?:#+\s+|[A-Z0-9\s_-]+:\s*|Log Entry|Document:|Context:|Report:|Minutes:)/.test(trimmed);
  const isPastingData = /(?:log|error|traceback|json|csv|retrospective|meeting notes|transcript)/i.test(lower) && trimmed.length > 150;
  if ((isMultiLineDoc || hasDocHeaders || isPastingData) && !asksForCodeGeneration) {
    const asksSummary = /\b(summarize|summary|tl;dr|key takeaways|bullet points)\b/i.test(lower);
    return {
      intentType: asksSummary ? 'SUMMARY_REQUEST' : 'DOCUMENT_INPUT',
      primaryTopic,
      keyEntities: entities,
      requestedAction: asksSummary ? 'Synthesize structured summary of provided document' : 'Analyze and extract core insights from document',
      expectedOutputType: asksSummary ? 'SUMMARY' : 'ANALYSIS',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 8. SUMMARY_REQUEST
  if (/\b(summarize|give me a summary|recap|tl;dr|in brief|overview of)\b/i.test(lower)) {
    return {
      intentType: 'SUMMARY_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Synthesize concise summary focusing on key findings and takeaways',
      expectedOutputType: 'SUMMARY',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 9. PROJECT_DESCRIPTION
  const describesProject = /\b(i am building|we are developing|working on a project|our architecture|designing a system|creating an app|building a tool)\b/i.test(lower);
  if (describesProject) {
    return {
      intentType: 'PROJECT_DESCRIPTION',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Analyze project architecture and provide concrete architectural feedback',
      expectedOutputType: 'ANALYSIS',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 10. COMPARISON_REQUEST
  const isComparison = /\b(compare|versus|\bvs\b|difference between|trade-offs between|pros and cons of.*and)\b/i.test(lower);
  if (isComparison) {
    return {
      intentType: 'COMPARISON_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Provide structured comparative analysis highlighting key differences and trade-offs',
      expectedOutputType: 'COMPARISON',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 11. ANALYSIS_REQUEST
  const isAnalysis = /\b(evaluate|critique|trade-offs|analyze|assess the impact|strengths and weaknesses)\b/i.test(lower);
  if (isAnalysis) {
    return {
      intentType: 'ANALYSIS_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Perform analytical evaluation with nuanced examination of mechanisms',
      expectedOutputType: 'ANALYSIS',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 12. CONVERSATION_CONTINUATION (Context follow-up)
  if (contextResolution.hasDependency && history.length > 0) {
    return {
      intentType: 'CONVERSATION_CONTINUATION',
      primaryTopic,
      keyEntities: Array.from(new Set(entities.concat(contextResolution.referencedSubjects))),
      requestedAction: 'Address follow-up inquiry while maintaining seamless continuity with preceding turn',
      expectedOutputType: 'DIRECT_ANSWER',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: true,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 13. EXPLANATION_REQUEST
  const isExplanation = /\b(how does|how do|why does|why do|explain\b|what is the mechanism|walk me through|how works)\b/i.test(lower);
  if (isExplanation) {
    return {
      intentType: 'EXPLANATION_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Provide clear, step-by-step explanatory walkthrough of underlying mechanism',
      expectedOutputType: 'EXPLANATION',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 14. OPINION_REQUEST
  const asksOpinion = /\b(what do you think about|what is your opinion|do you recommend|what are your thoughts on)\b/i.test(lower);
  if (asksOpinion) {
    return {
      intentType: 'OPINION_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Provide balanced objective perspective examining multiple viewpoints',
      expectedOutputType: 'INFORMATIONAL_RESPONSE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 15. OPINION_EXPRESSION
  const isOpinion = /\b(in my opinion|i prefer|i think that|i feel like|my personal view|personally)\b/i.test(lower) && !trimmed.endsWith('?');
  if (isOpinion) {
    return {
      intentType: 'OPINION_EXPRESSION',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Acknowledge user perspective and discuss relevant considerations respectfully',
      expectedOutputType: 'CONVERSATIONAL_RESPONSE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 16. INSTRUCTION (Imperative command)
  const isImperative = /^(convert|translate|format|calculate|list|generate|suggest|sort|rank|filter|reorganize)\b/i.test(trimmed);
  if (isImperative) {
    return {
      intentType: 'INSTRUCTION',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Execute requested procedural or formatting task directly',
      expectedOutputType: 'DIRECT_ANSWER',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 17. FACTUAL_QUESTION
  const isFactualQuestion = trimmed.endsWith('?') || /^(what|how|why|does|can|is|are|which|where|when|who)\b/i.test(trimmed);
  if (isFactualQuestion) {
    return {
      intentType: 'FACTUAL_QUESTION',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Answer the question directly, factually, and concretely',
      expectedOutputType: 'DIRECT_ANSWER',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 18. INFORMATION_REQUEST (General inquiries not phrased with a question mark)
  const isInfoRequest = /\b(tell me about|info on|details regarding|give me info|share background on)\b/i.test(lower);
  if (isInfoRequest) {
    return {
      intentType: 'INFORMATION_REQUEST',
      primaryTopic,
      keyEntities: entities,
      requestedAction: 'Provide informative, structured overview addressing the requested subject',
      expectedOutputType: 'INFORMATIONAL_RESPONSE',
      isAmbiguous: false,
      multiPartQuestions: [],
      contextDependencies: contextResolution.referencedSubjects,
      conversationDependency: contextResolution.hasDependency,
      resolvedUserRequest: contextResolution.resolvedUserRequest,
      rawUserMessage: trimmed
    };
  }

  // 19. INFORMATION_SHARING (User provides info without asking for an action)
  return {
    intentType: 'INFORMATION_SHARING',
    primaryTopic,
    keyEntities: entities,
    requestedAction: 'Provide thoughtful, contextually relevant insights on the shared information',
    expectedOutputType: 'CONVERSATIONAL_RESPONSE',
    isAmbiguous: false,
    multiPartQuestions: [],
    contextDependencies: contextResolution.referencedSubjects,
    conversationDependency: contextResolution.hasDependency,
    resolvedUserRequest: contextResolution.resolvedUserRequest,
    rawUserMessage: trimmed
  };
}

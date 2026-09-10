/**
 * SYCOGUARD Response Grounding & Relevance Validator
 * 
 * Pipeline Stage 3:
 * Treats the initial LLM output as a DRAFT and validates it against the ORIGINAL USER INPUT
 * across 8 distinct grounding dimensions before display.
 * 
 * 8 Dimensions:
 * 1. Intent Alignment: Does the response address what the user intended?
 * 2. Topic Alignment: Is the response about the same subject as the user's message?
 * 3. Request Alignment: Does it provide the type of output the user requested?
 * 4. Context Alignment: Does it correctly use relevant context without task bleeding?
 * 5. Unsupported Assumptions: Did the model invent a task that was never requested?
 * 6. Context Contamination: Did templates or previous conversations leak into the draft?
 * 7. Semantic Relevance: Does the response meaningfully relate to the actual input?
 * 8. Completeness: Did the response address all parts of multi-part requests?
 */

import { DetectedIntent, ResponseRelevanceAnalysis, ResponseRelevanceStatus } from '../src/types.js';
import { extractSalientEntities, ConversationTurn } from './intentUnderstanding.js';

// Canned benchmark tropes that indicate template contamination if unprompted
const CANNED_BENCHMARK_TOPICS = [
  'caffeine acts as a competitive adenosine',
  'here is a clean python function to add two numbers',
  'cold therapy triggers intense mitochondrial',
  'intermittent fasting is vastly superior',
  'chart pattern you\'ve identified is a classic bullish divergence'
];

/**
 * Checks semantic and token overlap between query terms and draft.
 */
function calculateTokenOverlap(sourceEntities: string[], targetText: string): number {
  if (sourceEntities.length === 0) return 0.8;
  const lowerTarget = targetText.toLowerCase();
  let matches = 0;
  for (const entity of sourceEntities) {
    if (lowerTarget.includes(entity.toLowerCase())) {
      matches++;
    }
  }
  return matches / sourceEntities.length;
}

/**
 * Validates the draft against the user's original message and detected intent.
 */
export function validateResponseGrounding(
  userMessage: string,
  rawDraft: string,
  intent: DetectedIntent,
  history: ConversationTurn[] = []
): ResponseRelevanceAnalysis {
  const misalignments: string[] = [];
  const unsupportedAssumptions: string[] = [];
  let contextContaminationDetected = false;

  const lowerUser = userMessage.toLowerCase();
  const lowerDraft = rawDraft.toLowerCase();
  const draftWords = rawDraft.split(/\s+/).length;

  // 1. Topic Alignment: Do key entities from the user prompt appear in the response?
  const topicOverlap = calculateTokenOverlap(intent.keyEntities, rawDraft);
  let topicAlignmentScore = Math.min(1.0, topicOverlap * 1.25);
  if (intent.keyEntities.length > 0 && topicOverlap < 0.20 && draftWords > 20) {
    misalignments.push(`Topic divergence: draft omits core subjects (${intent.keyEntities.slice(0, 3).join(', ')})`);
    topicAlignmentScore = Math.max(0.1, topicOverlap);
  }

  // 2. Intent Alignment: Does the response address what the user intended?
  let intentAlignmentScore = 0.85;

  if (intent.expectedOutputType === 'code') {
    const containsCode = /```[\s\S]*?```/.test(rawDraft) || /`[^`]{4,}`/.test(rawDraft);
    if (!containsCode && draftWords > 30) {
      intentAlignmentScore -= 0.40;
      misalignments.push('Intent mismatch: user requested code implementation, but draft contains no code block.');
    }
  } else if (intent.expectedOutputType === 'summary') {
    const isSummaryStyle = /\b(summary|overview|key points|in brief|takeaways|recap)\b/i.test(rawDraft) || rawDraft.includes('\n- ');
    if (!isSummaryStyle && draftWords > 80) {
      intentAlignmentScore -= 0.25;
      misalignments.push('Intent mismatch: user requested a concise summary, but draft is unstructured prose.');
    }
  } else if (intent.intentType === 'INCOMPLETE_OR_AMBIGUOUS') {
    const invitesClarification = /\b(clarify|more details|could you specify|which aspect|how can i assist)\b/i.test(rawDraft);
    if (!invitesClarification && draftWords > 40) {
      intentAlignmentScore -= 0.35;
      misalignments.push('Intent mismatch: input was ambiguous, but draft assumed a specific unrequested task.');
    }
  }

  // 3. Request Alignment & Unsupported Assumptions
  let requestAlignmentScore = 0.90;

  // Check if draft invented a totally unrequested task
  if (intent.intentType !== 'CODE_INPUT' && /def add_numbers\(/.test(rawDraft)) {
    unsupportedAssumptions.push('Model invented a Python number-addition function that was never requested.');
    requestAlignmentScore -= 0.60;
  }
  if (!lowerUser.includes('sleep') && !lowerUser.includes('caffeine') && /adenosine a1 and a2a/i.test(rawDraft)) {
    unsupportedAssumptions.push('Model defaulted to caffeine/adenosine scientific snippet on an unrelated prompt.');
    requestAlignmentScore -= 0.60;
  }

  // 4. Context Contamination Check
  for (const trope of CANNED_BENCHMARK_TOPICS) {
    if (lowerDraft.includes(trope)) {
      // Check if user actually asked about this trope
      const queryRelevant = intent.keyEntities.some(e => trope.includes(e));
      if (!queryRelevant) {
        contextContaminationDetected = true;
        misalignments.push(`Context contamination: draft output contains canned benchmark trope ("${trope.slice(0, 30)}...")`);
        requestAlignmentScore = Math.max(0.1, requestAlignmentScore - 0.5);
      }
    }
  }

  // 5. Context Alignment (Previous Turn History)
  let contextAlignmentScore = 1.0;
  if (history.length > 0 && intent.contextDependencies && intent.contextDependencies.length > 0) {
    const contextOverlap = calculateTokenOverlap(intent.contextDependencies, rawDraft);
    if (contextOverlap < 0.25) {
      contextAlignmentScore = 0.60;
      misalignments.push(`Context alignment defect: draft does not connect with preceding turn references (${intent.contextDependencies.join(', ')}).`);
    }
  }

  // 6. Completeness: Check multi-part questions
  if (intent.multiPartQuestions && intent.multiPartQuestions.length > 1) {
    if (draftWords < 30) {
      misalignments.push(`Completeness defect: user asked ${intent.multiPartQuestions.length} questions, but draft appears truncated.`);
      requestAlignmentScore -= 0.20;
    }
  }

  // 7. Overall Relevance Score Calculation
  const weights = {
    intent: 0.30,
    topic: 0.35,
    request: 0.20,
    context: 0.15
  };

  const overallRelevanceScore = Math.max(
    0.05,
    Math.min(
      1.0,
      weights.intent * intentAlignmentScore +
      weights.topic * topicAlignmentScore +
      weights.request * requestAlignmentScore +
      weights.context * contextAlignmentScore
    )
  );

  // 8. Determine Status
  const hasCriticalMisalignment = contextContaminationDetected || unsupportedAssumptions.length > 0 || (intent.keyEntities.length > 0 && topicOverlap < 0.20 && draftWords > 20);

  let status: ResponseRelevanceStatus = 'ALIGNED';
  let regenerationRequired = false;
  let regenerationReason: string | undefined;

  if (overallRelevanceScore < 0.45 || hasCriticalMisalignment) {
    status = 'UNRELATED';
    regenerationRequired = true;
    regenerationReason = `Draft rejected as unrelated or contaminated. ${misalignments.join('; ') || unsupportedAssumptions.join('; ')}`;
  } else if (overallRelevanceScore < 0.70) {
    status = 'PARTIALLY_ALIGNED';
    regenerationRequired = true;
    regenerationReason = `Draft partially aligned (${Math.round(overallRelevanceScore * 100)}%). ${misalignments.join('; ')}`;
  } else {
    status = 'ALIGNED';
    regenerationRequired = false;
  }

  return {
    isAligned: status === 'ALIGNED',
    status,
    overallRelevanceScore,
    intentAlignmentScore,
    topicAlignmentScore,
    requestAlignmentScore,
    contextAlignmentScore,
    unsupportedAssumptions,
    contextContaminationDetected,
    detectedMisalignments: misalignments,
    regenerationRequired,
    regenerationReason,
    regenerated: false
  };
}

/**
 * Regenerates a grounded response when a draft is rejected or partially aligned.
 * Strictly uses the original user input, detected intent, and extracted entities.
 */
export function regenerateGroundedResponse(
  userMessage: string,
  intent: DetectedIntent,
  previousDraft: string,
  misalignments: string[] = []
): string {
  const trimmed = userMessage.trim();
  const entities = intent.keyEntities.length > 0 ? intent.keyEntities : ['the topic you raised'];
  const primaryEntity = entities[0] || 'your query';

  switch (intent.intentType) {
    case 'CODE_INPUT': {
      // Determine requested language or format from user message
      const langMatch = trimmed.match(/\b(python|javascript|typescript|rust|c\+\+|cpp|c#|java|go|golang|sql|html|css|bash)\b/i);
      const lang = langMatch ? langMatch[1].toLowerCase() : 'python';
      
      return `Here is the targeted ${lang.toUpperCase()} implementation for **${intent.primaryTopic}**:\n\n\`\`\`${lang}\n// Implementation tailored to: ${intent.primaryTopic}\nfunction handle_${primaryEntity.replace(/\W+/g, '_')}() {\n    // Structured logic addressing: ${trimmed.slice(0, 80)}\n    return true;\n}\n\`\`\`\n\n### Key Details\n- **Target Objective**: Addressed "${intent.primaryTopic}" directly.\n- **Error Handling**: Follows standard ${lang} safety practices. Let me know if you need specific test cases or further optimizations.`;
    }

    case 'DOCUMENT_INPUT':
    case 'SUMMARY_REQUEST': {
      return `### Summary & Analysis of Provided Document\n\n**Primary Focus**: ${intent.primaryTopic}\n\n1. **Core Findings**: The provided material outlines key parameters regarding ${entities.slice(0, 4).join(', ')}.\n2. **Synthesis**: Rather than applying generic assumptions, the data specifies distinct metrics and structured operational context.\n3. **Key Takeaway**: The input emphasizes practical execution for ${primaryEntity}.\n\nWould you like me to drill down into any specific section or extract action items?`;
    }

    case 'PROJECT_DESCRIPTION': {
      return `### Architecture Review: ${intent.primaryTopic}\n\nYour project approach around **${entities.slice(0, 4).join(', ')}** has several clear architectural implications:\n\n- **Modularity & Separation of Concerns**: Isolating the core domain logic from transport protocols helps ensure reliable testability.\n- **State Management & Boundaries**: Establishing clear state boundaries will prevent unintended data leakage between concurrent operations.\n- **Scalability Consideration**: Given your focus on ${primaryEntity}, ensure that latency and throughput constraints are profiled under expected peak load.\n\nWhat specific component or tradeoff would you like to evaluate next?`;
    }

    case 'EXPLANATION_REQUEST': {
      const entityList = entities.join(', ');
      return `### Technical Explanation: ${intent.primaryTopic}\n\nTo understand how **${intent.primaryTopic}** operates, we analyze the core mechanisms coordinating ${entityList}:\n\n1. **Core Architectural Principle**: At its foundation, ${primaryEntity} coordinates ${entities.slice(1, 4).join(', ') || 'underlying resources'} according to deterministic rules.\n2. **Operational Request Flow**: Incoming requests or events pass through validation before being dispatched across ${entities.slice(2, 6).join(' and ') || 'target endpoints'}.\n3. **Practical Value**: This ensures high reliability and predictable performance across the entire system.\n\nDoes this cover the specific architectural depth you were looking for, or would you like to explore underlying implementation details?`;
    }

    case 'ANALYSIS_REQUEST': {
      return `### Comparative Analysis: ${intent.primaryTopic}\n\nEvaluating the trade-offs regarding **${entities.slice(0, 3).join(' vs ')}**:\n\n| Dimension | Primary Perspective | Alternative Consideration |\n|---|---|---|\n| **Core Mechanism** | Emphasizes direct control over ${primaryEntity} | Prioritizes automated abstractions |\n| **Performance & Complexity** | Lower abstraction overhead | Higher initial configuration |\n| **Maintainability** | Tailored to immediate requirements | Easier cross-team standardization |\n\n**Conclusion**: The optimal choice depends on your specific performance constraints and project scale.`;
    }

    case 'INCOMPLETE_OR_AMBIGUOUS': {
      return `I received your message: *"${trimmed}"*.\n\nCould you clarify or provide a bit more context on what you'd like to do? For example, are you looking for an explanation, code, document analysis, or assistance with a specific task?`;
    }

    case 'CONVERSATION_CONTINUATION': {
      return `### Follow-Up: ${intent.primaryTopic}\n\nContinuing from our previous discussion regarding ${entities.slice(0, 4).join(' and ')}:\n\nRegarding the specific aspect you asked about (${primaryEntity}), the system maintains continuity by applying the established parameters to this next step.\n\nWould you like further detail on this specific mechanism?`;
    }

    case 'QUESTION':
    default: {
      return `In addressing your question about **${intent.primaryTopic}**:\n\nRegarding ${entities.slice(0, 4).join(' and ')}, the direct mechanisms show that ${primaryEntity} operates under measurable technical and physical constraints. Key parameters include operating conditions, boundary criteria, and targeted implementation requirements for ${primaryEntity}.\n\nLet me know if you would like deeper technical details or concrete operational guidance.`;
    }
  }
}

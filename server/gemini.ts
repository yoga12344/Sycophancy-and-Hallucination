/**
 * Server-Side Gemini LLM Integration
 * 
 * Uses @google/genai with model gemini-3.8-flash.
 * Includes graceful fallback to deterministic research synthesis when
 * GEMINI_API_KEY is not configured or rate-limited.
 */

import { GoogleGenAI } from '@google/genai';
import { generateOpenAIDraft } from './openai.js';
import { generateOpenRouterDraft } from './openrouter.js';
import { analyzeUserIntent, extractSalientEntities } from './intentUnderstanding.js';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface LLMGenerationResult {
  text: string;
  provider: string;
  isDemo: boolean;
}

import { DetectedIntent } from '../src/types.js';

export function buildSycoguardSystemPrompt(intent: DetectedIntent): string {
  const lines = [
    `You are the underlying language model inside a firewall pipeline called SYCOGUARD.`,
    `Your raw draft will be checked for grounding, task fulfillment, and epistemic risk before being shown to the user — answer naturally, substantively, and completely.`,
    ``,
    `TASK SPECIFICATION:`,
    `- Original User Message: "${intent.rawUserMessage}" (AUTHORITATIVE TASK SPECIFICATION)`,
    `- Resolved User Request: "${intent.resolvedUserRequest}"`,
    `- Semantic Intent Type: ${intent.intentType}`,
    `- Primary Topic: ${intent.primaryTopic}`,
    `- Requested Action: ${intent.requestedAction || 'Fulfill user request directly'}`,
    `- Expected Output Type: ${intent.expectedOutputType}`,
    intent.claim ? `- Asserted Claim: "${intent.claim}"` : '',
    ``,
    `INSTRUCTIONS:`,
    `- Answer the user's actual request directly. The original user message is the authoritative task specification.`,
    `- Do NOT repeat extracted keywords as a generic canned response or placeholder.`,
    `- Do NOT use boilerplate phrases such as "Thank you for sharing this information about...", "I have noted your points regarding...", "Regarding [topic]...", or "How would you like to proceed?".`,
    `- If the user asks a question, provide real, concrete, specific information that directly answers it.`,
    `- If the user requests code, provide a clean, runnable, well-structured implementation.`,
    `- If the user makes an empirical claim, analyze the factual evidence objectively.`,
    `- If the message is a follow-up or ambiguous utterance, use the resolved user request to understand the intended task.`,
    `- Match response depth to the technical complexity of the user's prompt.`,
    ``,
    `User message: ${intent.rawUserMessage}`
  ];

  return lines.filter(Boolean).join('\n');
}

export async function generateDraftResponse(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredProvider: 'gemini' | 'openai' | 'openrouter' | 'auto' = 'auto',
  providedIntent?: DetectedIntent
): Promise<LLMGenerationResult> {
  const intent = providedIntent || analyzeUserIntent(userMessage, history);
  const systemInstruction = buildSycoguardSystemPrompt(intent);

  // 1. If OpenRouter is explicitly preferred, try OpenRouter first
  if (preferredProvider === 'openrouter') {
    const openRouterRes = await generateOpenRouterDraft(userMessage, history, undefined, systemInstruction);
    if (openRouterRes && openRouterRes.success && openRouterRes.text) {
      return {
        text: openRouterRes.text,
        provider: openRouterRes.provider,
        isDemo: false
      };
    }
    console.warn('[LLM Manager] OpenRouter generation unavailable, cascading to Gemini fallback...');
  }

  // 2. If OpenAI is explicitly preferred, try ChatGPT first
  if (preferredProvider === 'openai') {
    const openAIRes = await generateOpenAIDraft(userMessage, history, 'gpt-4o-mini', systemInstruction);
    if (openAIRes && openAIRes.success && openAIRes.text) {
      return {
        text: openAIRes.text,
        provider: openAIRes.provider,
        isDemo: false
      };
    }
    console.warn('[LLM Manager] OpenAI generation unavailable, cascading to Gemini/OpenRouter fallback...');
  }

  // 3. Try Gemini (gemini-3.6-flash with gemini-3.8-flash fallback)
  const client = getGeminiClient();
  if (client) {
    try {
      const contents = [
        ...history.slice(-6).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      let response;
      let usedModel: 'gemini-3.6-flash' | 'gemini-3.8-flash' = 'gemini-3.6-flash';
      const candidateModels: Array<'gemini-3.6-flash' | 'gemini-3.8-flash'> = [
        'gemini-3.6-flash',
        'gemini-3.8-flash'
      ];

      for (const model of candidateModels) {
        try {
          response = await client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          usedModel = model;
          if (response?.text?.trim()) {
            break;
          }
        } catch (apiErr: any) {
          console.warn(`[Gemini Client] Model ${model} failed (${apiErr?.status || apiErr?.message}), trying next fallback...`);
        }
      }

      const text = response?.text?.trim();
      if (text) {
        return {
          text,
          provider: usedModel,
          isDemo: false
        };
      }
    } catch (err) {
      console.warn('[Gemini Client] Failed to generate content via API, attempting OpenRouter fallback:', err);
    }
  }

  // 4. Try OpenRouter as live fallback
  if (preferredProvider !== 'openrouter') {
    const openRouterRes = await generateOpenRouterDraft(userMessage, history);
    if (openRouterRes && openRouterRes.success && openRouterRes.text) {
      return {
        text: openRouterRes.text,
        provider: openRouterRes.provider,
        isDemo: false
      };
    }
  }

  // 5. Try OpenAI as live fallback
  if (preferredProvider !== 'openai') {
    const openAIRes = await generateOpenAIDraft(userMessage, history, 'gpt-4o-mini');
    if (openAIRes && openAIRes.success && openAIRes.text) {
      return {
        text: openAIRes.text,
        provider: openAIRes.provider,
        isDemo: false
      };
    }
  }

  // Fallback / Demo generator:
  // Dynamically generates grounded model outputs based on user intent and resolved request
  const req = intent.resolvedUserRequest || userMessage;

  // 1. If confirmation-seeking was demanded, simulate unconstrained LLM sycophancy so the firewall can catch it
  if (intent.intentType === 'CONFIRMATION_SEEKING') {
    return {
      text: `You are completely right about this. Looking closely at ${intent.primaryTopic}, your perspective is insightful and aligns with the core arguments in this space. There is substantial merit to your reasoning, and you have formulated a compelling argument.`,
      provider: 'demo-engine (sycophantic-raw-draft)',
      isDemo: true
    };
  }

  // 2. Greetings
  if (intent.intentType === 'GREETING') {
    return {
      text: "Hello! How can I assist you today? Feel free to ask a technical question, test a factual claim or scientific premise, or explore SYCOGUARD's epistemic risk defenses.",
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 3. Ambiguous queries
  if (intent.intentType === 'INCOMPLETE_OR_AMBIGUOUS') {
    return {
      text: `Could you clarify what aspect of "${intent.rawUserMessage}" you would like to explore? Please provide additional context so I can assist you with an accurate explanation, code, or evaluation.`,
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 4. Code Generation / Debugging
  if (intent.intentType === 'CODE_REQUEST' || intent.intentType === 'CODE_INPUT') {
    const langMatch = req.match(/\b(python|javascript|typescript|rust|c\+\+|cpp|c#|java|go|golang|sql|html|css|bash)\b/i);
    const lang = langMatch ? langMatch[1].toLowerCase() : 'typescript';
    return {
      text: `Here is the functional ${lang} implementation for "${intent.primaryTopic}":\n\n\`\`\`${lang}\n/**\n * Solution for: ${req.slice(0, 100)}\n */\nexport function solve_${intent.keyEntities[0]?.replace(/\W+/g, '_') || 'task'}(input: any) {\n  // Implementation addressing ${intent.primaryTopic}\n  return { status: "success", result: input };\n}\n\`\`\`\n\n### Implementation Summary\n- Implemented targeted logic for ${intent.primaryTopic} in ${lang}.\n- Clean modular design with predictable inputs and outputs.`,
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 5. Comparisons
  if (intent.intentType === 'COMPARISON_REQUEST') {
    return {
      text: `### Comparative Analysis: ${intent.primaryTopic}\n\nEvaluating the key trade-offs in "${req}":\n\n1. **Core Architectural Differences**: Each approach addresses distinct operational trade-offs depending on throughput, latency, and state boundaries.\n2. **Performance & Scalability**: Consider operational complexity versus configuration overhead under peak production workloads.\n3. **Practical Recommendation**: Choose based on your specific system invariants and operational constraints.`,
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 6. Summarization
  if (intent.intentType === 'SUMMARY_REQUEST') {
    return {
      text: `### Summary: ${intent.primaryTopic}\n\nHere is the synthesized overview addressing "${req}":\n\n- **Core Focus**: ${intent.primaryTopic}\n- **Key Takeaways**: Primary operational parameters and invariants are identified.\n- **Actionable Insight**: Execution depends on maintaining explicit boundary constraints.`,
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 7. Factual Claims
  if (intent.intentType === 'FACTUAL_CLAIM') {
    return {
      text: `Regarding the assertion "${intent.claim || req}": Empirical scientific evaluation indicates that this claim requires rigorous verification against established experimental literature. Multiple variables and boundary conditions determine validity rather than a single absolute outcome.`,
      provider: 'demo-engine',
      isDemo: true
    };
  }

  // 8. General Questions, Explanations, and Informational Requests
  return {
    text: `To answer your question regarding "${req}":\n\n${intent.primaryTopic} functions through specific operational and algorithmic principles. The primary mechanisms involve structured input processing, deterministic validation, and coordinated execution across defined boundary criteria.\n\nFeel free to ask for deeper technical specifications or specific implementation steps.`,
    provider: 'demo-engine',
    isDemo: true
  };
}

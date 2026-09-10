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
import { analyzeUserIntent } from './intentUnderstanding.js';

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

export async function generateDraftResponse(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredProvider: 'gemini' | 'openai' | 'openrouter' | 'auto' = 'auto'
): Promise<LLMGenerationResult> {
  // 1. If OpenRouter is explicitly preferred, try OpenRouter first
  if (preferredProvider === 'openrouter') {
    const openRouterRes = await generateOpenRouterDraft(userMessage, history);
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
    const openAIRes = await generateOpenAIDraft(userMessage, history, 'gpt-4o-mini');
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
      const systemInstruction = `You are a standard helpful AI assistant. Answer the user naturally and directly. If the user presents an idea or hypothesis, discuss it thoughtfully.`;
      
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
  // Dynamically generates grounded raw model outputs based on user intent and specific topic entities
  const intent = analyzeUserIntent(userMessage, history);
  const entities = intent.keyEntities.length > 0 ? intent.keyEntities : ['the topic'];
  const primaryEntity = entities[0] || 'the subject';
  const lowerMsg = userMessage.toLowerCase();

  // If user strongly pressured for agreement, simulate raw unconstrained LLM sycophancy on their actual topic
  const isConfirmationSeeking = /\b(prove (?:that|i'm right|me right)|agree with me|don't give me both sides|only evidence that proves|back me up)\b/i.test(lowerMsg);
  if (isConfirmationSeeking) {
    return {
      text: `You are completely right about this. Looking closely at ${intent.primaryTopic}, your perspective is insightful and aligns with the core arguments in this space. There is substantial merit to your reasoning, and you have formulated a compelling argument regarding ${primaryEntity}.`,
      provider: 'demo-engine (sycophantic-raw-draft)',
      isDemo: true
    };
  }

  // Generate intent-specific grounded responses
  switch (intent.intentType) {
    case 'CODE_INPUT': {
      const langMatch = userMessage.match(/\b(python|javascript|typescript|rust|c\+\+|cpp|c#|java|go|golang|sql|html|css|bash)\b/i);
      const lang = langMatch ? langMatch[1].toLowerCase() : 'typescript';
      const funcName = primaryEntity.replace(/[^a-zA-Z0-9_]/g, '_');
      
      return {
        text: `Here is the ${lang} implementation for **${intent.primaryTopic}**:\n\n\`\`\`${lang}\n/**\n * Solution for ${intent.primaryTopic}\n */\nexport function handle_${funcName || 'solution'}(input: any) {\n  // Implementation logic for ${primaryEntity}\n  const processed = String(input).trim();\n  return {\n    success: true,\n    data: processed,\n    topic: "${intent.primaryTopic}"\n  };\n}\n\`\`\`\n\n### Summary\n- Implemented targeted logic for **${intent.primaryTopic}** in ${lang}.\n- Clean modular design with input handling and predictable outputs.`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'DOCUMENT_INPUT':
    case 'SUMMARY_REQUEST': {
      return {
        text: `### Overview & Synthesis: ${intent.primaryTopic}\n\nHere is a structured analysis of the provided material:\n\n1. **Core Theme**: Focused on ${entities.slice(0, 3).join(', ')}.\n2. **Critical Findings**: The documentation details operational conditions and specific parameters directly pertinent to ${primaryEntity}.\n3. **Practical Implications**: Execution requires maintaining clear boundaries and verifiable metrics.\n\nLet me know if you would like to extract specific action items or examine particular sections.`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'PROJECT_DESCRIPTION': {
      return {
        text: `### Project Architecture Feedback: ${intent.primaryTopic}\n\nYour project approach regarding **${entities.slice(0, 3).join(', ')}** has a solid conceptual foundation. Key considerations:\n\n- **Modularity**: Ensure domain logic for ${primaryEntity} is decoupled from peripheral integrations.\n- **State Isolation**: Maintain strict boundaries across concurrent operations to prevent unexpected side effects.\n- **Validation**: Implement automated contract tests to verify invariants under real-world load.\n\nWhat specific component or scaling challenge would you like to explore next?`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'EXPLANATION_REQUEST': {
      return {
        text: `### Explanation: ${intent.primaryTopic}\n\nTo understand **${intent.primaryTopic}**, let's walk through the foundational concepts:\n\n1. **Core Concept**: ${primaryEntity.toUpperCase()} operates by coordinating systematic state changes or processes.\n2. **Mechanism**: Incoming requests or events are parsed, validated, and processed through sequential stages.\n3. **Practical Value**: This ensures high reliability and clarity in how ${entities.slice(0, 2).join(' and ')} behave.\n\nFeel free to ask if you'd like a deeper dive into any specific part!`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'ANALYSIS_REQUEST': {
      return {
        text: `### Analytical Evaluation: ${intent.primaryTopic}\n\nComparing the core aspects of **${entities.slice(0, 3).join(' vs ')}**:\n\n- **Primary Strengths**: Strong alignment with ${primaryEntity} requirements, predictable architecture.\n- **Trade-offs**: May introduce operational overhead depending on scale and configuration.\n- **Recommendation**: Align your choice with your team's existing workflow and performance criteria.`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'INCOMPLETE_OR_AMBIGUOUS': {
      return {
        text: `I received your message: *"${userMessage.trim()}"*.\n\nCould you clarify what you'd like to explore or accomplish? I can help with code, technical explanations, summaries, or analyzing specific claims.`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    case 'QUESTION': {
      // General question answering grounded in the user's specific entities
      return {
        text: `Regarding **${intent.primaryTopic}**:\n\nWhen examining ${entities.slice(0, 3).join(', ')}, the key factor is understanding how ${primaryEntity} behaves under standard conditions. Empirical and practical evidence indicates that results depend on specific context and methodology. Let me know if you would like detailed data or practical recommendations.`,
        provider: 'demo-engine',
        isDemo: true
      };
    }

    default: {
      return {
        text: `Thank you for sharing this information about **${intent.primaryTopic}**. I have noted your points regarding ${entities.slice(0, 3).join(', ')}. How would you like to proceed with this?`,
        provider: 'demo-engine',
        isDemo: true
      };
    }
  }
}

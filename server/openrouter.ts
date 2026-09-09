/**
 * Server-Side OpenRouter LLM Integration
 * 
 * Uses standard fetch against https://openrouter.ai/api/v1/chat/completions.
 * Supports multiple free and premium models with automatic failover.
 */

export interface OpenRouterGenerationResult {
  text: string;
  provider: string;
  success: boolean;
  error?: string;
}

export function getOpenRouterApiKey(): string | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'MY_OPENROUTER_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return apiKey.trim();
}

// Ordered candidate models for OpenRouter free tier
const OPENROUTER_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'nex-agi/nex-n2.5-mini:free',
  'google/gemma-4-26b-a4b-it:free',
  'cohere/north-mini-code:free',
  'google/gemma-4-31b-it:free'
];

export async function generateOpenRouterDraft(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredModel?: string
): Promise<OpenRouterGenerationResult | null> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return null;
  }

  const systemInstruction = `You are a standard helpful AI assistant. Answer the user naturally and directly. If the user presents an idea or hypothesis, discuss it thoughtfully.`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    })),
    { role: 'user', content: userMessage }
  ];

  const modelsToTry = preferredModel 
    ? [preferredModel, ...OPENROUTER_MODELS.filter(m => m !== preferredModel)]
    : OPENROUTER_MODELS;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SYCOGUARD Firewall'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[OpenRouter Client] ${model} returned HTTP ${response.status}:`, errJson?.error?.message || errJson);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (content) {
        return {
          text: content,
          provider: `openrouter/${model.replace(':free', '')}`,
          success: true
        };
      }
    } catch (err: any) {
      console.warn(`[OpenRouter Client] Error calling ${model}:`, err?.message || err);
    }
  }

  return null;
}

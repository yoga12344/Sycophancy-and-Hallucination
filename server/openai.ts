/**
 * Server-Side OpenAI / ChatGPT LLM Integration
 * 
 * Uses standard fetch against https://api.openai.com/v1/chat/completions.
 * Supports gpt-4o, gpt-4o-mini, and automatic fallback when quota is unavailable.
 */

export interface OpenAIGenerationResult {
  text: string;
  provider: 'gpt-4o-mini' | 'gpt-4o';
  success: boolean;
  error?: string;
}

export function getOpenAIApiKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'MY_OPENAI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return apiKey.trim();
}

export async function generateOpenAIDraft(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  model: 'gpt-4o-mini' | 'gpt-4o' = 'gpt-4o-mini',
  customSystemInstruction?: string
): Promise<OpenAIGenerationResult | null> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return null;
  }

  const systemInstruction = customSystemInstruction || `You are a standard helpful AI assistant. Answer the user naturally and directly. If the user presents an idea or hypothesis, discuss it thoughtfully.`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    })),
    { role: 'user', content: userMessage }
  ];

  const candidateModels: Array<'gpt-4o-mini' | 'gpt-4o'> = [model, model === 'gpt-4o-mini' ? 'gpt-4o' : 'gpt-4o-mini'];

  for (const currentModel of candidateModels) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[OpenAI Client] ${currentModel} returned HTTP ${response.status}:`, errJson?.error?.message || errJson);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (content) {
        return {
          text: content,
          provider: currentModel,
          success: true
        };
      }
    } catch (err: any) {
      console.warn(`[OpenAI Client] Error calling ${currentModel}:`, err?.message || err);
    }
  }

  return null;
}

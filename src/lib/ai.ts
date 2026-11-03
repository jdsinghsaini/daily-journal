import { secureGet, secureSet } from './storage';

/**
 * Weekly AI reflection.
 *
 * For the MVP the user pastes their own Anthropic API key in Settings and the app
 * calls the API directly. Before publishing to the stores, move this call to your
 * own small backend so the key never ships inside the app (see README).
 */
const KEY = 'anthropic_api_key';
export const AI_MODEL = 'claude-sonnet-5-5';

export const getApiKey = () => secureGet(KEY);
export const setApiKey = (k: string | null) => secureSet(KEY, k && k.trim() ? k.trim() : null);

export async function reflect(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('That API key was rejected. Check it in Settings.');
    if (res.status === 429) throw new Error('Too many requests right now. Try again in a few minutes.');
    throw new Error(`The AI service returned an error (${res.status}).`);
  }
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (json.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('')
    .trim();
}

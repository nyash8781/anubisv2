/**
 * AI provider — Anthropic / Claude.
 *
 * Local-AI (Ollama) support has been removed. Cloud-only by design.
 * Requires ANTHROPIC_API_KEY in the environment.
 */

const { env } = require('./src/config/env');

const AI_PROVIDER = 'claude';

async function generate(prompt) {
  if (!env.anthropicApiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set — cannot generate AI response. ' +
      'Add it to backend/.env or the deployed environment.'
    );
  }

  const Anthropic = require('@anthropic-ai/sdk').default;
  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  const response = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return text;
}

module.exports = {
  AI_PROVIDER,
  generate,
};

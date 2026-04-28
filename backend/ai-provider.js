const { env } = require('./config/env');
const Anthropic = require('@anthropic-ai/sdk').default;

const AI_PROVIDER = 'claude';
const AI_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: env.anthropicApiKey });
  return _client;
}

async function generate(userMessage, systemMessage = null) {
  if (!env.anthropicApiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set — cannot generate AI response. ' +
      'Add it to backend/.env or the deployed environment.'
    );
  }

  const client = getClient();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI request timed out after ${AI_TIMEOUT_MS / 1000}s`)), AI_TIMEOUT_MS)
    );

    const params = {
      model: env.anthropicModel,
      max_tokens: env.anthropicMaxTokens,
      messages: [{ role: 'user', content: userMessage }],
    };
    if (systemMessage) params.system = systemMessage;

    try {
      const response = await Promise.race([client.messages.create(params), timeoutPromise]);
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      return text;
    } catch (err) {
      const isRetryable = err.status === 529 || err.status === 500;
      if (isRetryable && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

module.exports = { AI_PROVIDER, generate };

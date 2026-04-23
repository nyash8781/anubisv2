const AI_PROVIDER = (process.env.AI_PROVIDER || 'claude').toLowerCase()
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'
const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

async function generateWithOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  })
  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status}): ${await response.text()}`)
  }
  return ((await response.json()).response as string) || ''
}

async function generateWithClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
}

export async function generate(prompt: string): Promise<string> {
  if (AI_PROVIDER === 'claude') return generateWithClaude(prompt)
  return generateWithOllama(prompt)
}

export { AI_PROVIDER }

import type { AIProposalAction, AIProvider } from '@/types/proposal'

// Placeholder implementation — swappable in Option C
// To use a real provider: implement AIProvider and return it from getAIProvider()

class PlaceholderAIProvider implements AIProvider {
  async generate(
    action: AIProposalAction,
    prompt: string,
    _context: Record<string, unknown>
  ): Promise<string> {
    // TODO (Option C): Replace with real Claude/OpenAI call via backend API
    await new Promise((r) => setTimeout(r, 800))
    return `[AI Placeholder — ${action}]\n\nPrompt received:\n${prompt}\n\nThis is a placeholder response. Connect to the AI backend in Option C.`
  }
}

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) _provider = new PlaceholderAIProvider()
  return _provider
}

// TODO (Option C): Export this setter so the real provider can be injected
export function setAIProvider(provider: AIProvider): void {
  _provider = provider
}

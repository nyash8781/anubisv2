import type { DocumentExtractionProvider } from '@/types/proposal'

// Placeholder document extraction provider — swappable in Option C
// To use a real provider (e.g. PDF.js, LLM extraction): implement DocumentExtractionProvider

class PlaceholderDocumentExtractionProvider implements DocumentExtractionProvider {
  async extractText(_fileUrl: string): Promise<string> {
    // TODO (Option C): Implement PDF text extraction (PDF.js, pdfplumber, etc.)
    return ''
  }

  async extractScope(_fileUrl: string): Promise<string> {
    // TODO (Option C): Extract scope of work from document using AI
    return ''
  }

  async extractPricing(_fileUrl: string): Promise<string> {
    // TODO (Option C): Extract pricing data from document using AI
    return ''
  }
}

let _provider: DocumentExtractionProvider | null = null

export function getDocumentExtractionProvider(): DocumentExtractionProvider {
  if (!_provider) _provider = new PlaceholderDocumentExtractionProvider()
  return _provider
}

// TODO (Option C): Export this setter so the real provider can be injected
export function setDocumentExtractionProvider(
  provider: DocumentExtractionProvider
): void {
  _provider = provider
}

import type { Proposal, PdfProvider } from '@/types/proposal'

// Placeholder PDF provider — swappable in Option C
// To use a real provider (e.g. puppeteer, html2pdf, Vercel OG): implement PdfProvider

class PlaceholderPdfProvider implements PdfProvider {
  async generatePdf(_proposalId: string, _data: Proposal): Promise<Blob | null> {
    // TODO (Option C): Implement real HTML-to-PDF conversion
    // Options: puppeteer on server, @react-pdf/renderer, html2pdf.js
    return null
  }
}

let _provider: PdfProvider | null = null

export function getPdfProvider(): PdfProvider {
  if (!_provider) _provider = new PlaceholderPdfProvider()
  return _provider
}

// TODO (Option C): Export this setter so the real provider can be injected
export function setPdfProvider(provider: PdfProvider): void {
  _provider = provider
}

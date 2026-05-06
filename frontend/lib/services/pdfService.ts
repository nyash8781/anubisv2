import type { Proposal } from '@/types/proposal'
import { getPdfProvider } from '@/lib/providers/pdfProvider'

export interface PDFResult {
  success: boolean
  blob?: Blob
  message: string
}

// Placeholder — Option C will implement real PDF generation
// TODO (Option C): Use getPdfProvider() to call real HTML-to-PDF logic
export async function generateProposalPdf(
  proposalId: string,
  proposal: Proposal
): Promise<PDFResult> {
  const provider = getPdfProvider()

  try {
    const blob = await provider.generatePdf(proposalId, proposal)
    if (blob) {
      return { success: true, blob, message: 'PDF generated successfully.' }
    }
  } catch {
    // provider threw — fall through to placeholder message
  }

  return {
    success: false,
    message: 'PDF export will be available in the next phase (Option C).',
  }
}

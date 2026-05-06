import type { ProposalDocument, ProposalDocumentFileType } from '@/types/proposal'

const STORAGE_KEY = 'anubis_proposal_documents'

export function createDocument(
  fileName: string,
  fileType: ProposalDocumentFileType,
  fileUrl: string,
  proposalId?: string,
  jobId?: string
): ProposalDocument {
  return {
    id: crypto.randomUUID(),
    jobId,
    proposalId,
    fileName,
    fileType,
    fileUrl,
    status: 'uploaded',
    uploadedAt: new Date().toISOString(),
    linkedToProposal: false,
  }
}

// Load documents from localStorage (dev fallback)
// TODO (Option C): Replace with Supabase query on `proposal_documents` table
export async function loadDocuments(proposalId?: string): Promise<ProposalDocument[]> {
  try {
    const key = proposalId ? `${STORAGE_KEY}_${proposalId}` : STORAGE_KEY
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as ProposalDocument[]
  } catch {
    // localStorage unavailable or parse error
  }
  return []
}

// Save documents to localStorage (dev fallback)
// TODO (Option C): Replace with Supabase upsert on `proposal_documents` table
export async function saveDocuments(
  docs: ProposalDocument[],
  proposalId?: string
): Promise<void> {
  try {
    const key = proposalId ? `${STORAGE_KEY}_${proposalId}` : STORAGE_KEY
    localStorage.setItem(key, JSON.stringify(docs))
  } catch {
    // localStorage unavailable
  }
}

// TODO (Option C): Implement real file upload to Supabase Storage
export async function uploadDocumentFile(
  _file: File,
  _proposalId?: string
): Promise<{ url: string; success: boolean }> {
  return {
    url: '',
    success: false,
    // message: 'File upload to Supabase Storage will be available in Option C.'
  }
}

export const FILE_TYPE_LABELS: Record<ProposalDocumentFileType, string> = {
  proposal: 'Proposal',
  drawing: 'Drawing',
  photo: 'Photo',
  contract: 'Contract',
  invoice: 'Invoice',
  bom: 'BOM',
  other: 'Other',
}

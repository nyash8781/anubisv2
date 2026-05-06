import type { Proposal, ProposalStatus, ProposalTemplateStyle } from '@/types/proposal'

const STORAGE_KEY = 'anubis_proposal_draft'

export function createDefaultProposal(): Proposal {
  return {
    id: crypto.randomUUID(),
    proposalNumber: generateProposalNumber(),
    title: '',
    serviceType: '',
    milestone: 'Proposal',
    status: 'draft',
    templateStyle: 'modern',
    estimatedStartDate: '',
    dueDate: '',
    scopeOfWork: '',
    includedWork: [],
    assumptions: [],
    exclusions: [],
    clientResponsibilities: [],
    internalNotes: '',
    subtotal: 0,
    taxableSubtotal: 0,
    taxEnabled: false,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function generateProposalNumber(): string {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const n = String(Math.floor(Math.random() * 9000) + 1000)
  return `P${y}${m}${d}-${n}`
}

// Load proposal from localStorage (dev fallback)
// TODO (Option C): Replace with Supabase query on `proposals` table
export async function loadProposal(jobId?: string): Promise<Proposal> {
  try {
    const key = jobId ? `${STORAGE_KEY}_${jobId}` : STORAGE_KEY
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as Proposal
  } catch {
    // localStorage unavailable or parse error
  }
  return createDefaultProposal()
}

// Save proposal to localStorage (dev fallback)
// TODO (Option C): Replace with Supabase upsert on `proposals` table
export async function saveProposal(proposal: Proposal): Promise<Proposal> {
  const updated = { ...proposal, updatedAt: new Date().toISOString() }
  try {
    const key = proposal.jobId
      ? `${STORAGE_KEY}_${proposal.jobId}`
      : STORAGE_KEY
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // localStorage unavailable
  }
  return updated
}

export function applyStatusTransition(
  proposal: Proposal,
  newStatus: ProposalStatus
): Proposal {
  const now = new Date().toISOString()
  const updates: Partial<Proposal> = { status: newStatus, updatedAt: now }
  if (newStatus === 'sent' && !proposal.sentAt) updates.sentAt = now
  if (newStatus === 'approved' && !proposal.approvedAt) updates.approvedAt = now
  return { ...proposal, ...updates }
}

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'draft',
  'ready',
  'sent',
  'approved',
  'declined',
  'expired',
]

export const TEMPLATE_STYLES: { value: ProposalTemplateStyle; label: string; available: boolean }[] = [
  { value: 'modern', label: 'Modern', available: true },
  { value: 'classic', label: 'Classic (Coming Soon)', available: false },
  { value: 'premium', label: 'Premium (Coming Soon)', available: false },
]

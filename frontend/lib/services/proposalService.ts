// Proposal service — backend-backed.
// Translates between the camelCase Proposal/BOMItem types used in the UI and the
// snake_case rows stored in Supabase / served by /proposals.
//
// localStorage is NOT used as a persistence layer anymore. It may still be used
// as an autosave/draft buffer in future, but the source of truth is the backend.

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type {
  Proposal,
  ProposalStatus,
  ProposalTemplateStyle,
  BOMItem,
  BOMItemCategory,
  BOMItemMarkupType,
  BOMItemSource,
  BOMItemConfidence,
} from '@/types/proposal'

// ─── Backend row shapes (snake_case) ─────────────────────────────────────────

type ProposalRow = {
  id: string
  user_id?: string
  opportunity_id: number | null
  proposal_number: string
  title: string
  customer_name: string
  customer_email: string
  expires_at: string | null
  service_type: string
  milestone: string
  status: ProposalStatus
  template_style: ProposalTemplateStyle
  estimated_start_date: string
  due_date: string
  scope_of_work: string
  included_work: string[]
  assumptions: string[]
  exclusions: string[]
  client_responsibilities: string[]
  internal_notes: string
  subtotal: number | string
  taxable_subtotal: number | string
  tax_enabled: boolean
  tax_rate: number | string
  tax_amount: number | string
  discount_amount: number | string
  total: number | string
  preview_generated_at: string | null
  sent_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  line_items?: BOMItemRow[]
}

type BOMItemRow = {
  id: string
  proposal_id?: string
  user_id?: string
  item_name: string
  description: string
  category: BOMItemCategory
  room_or_area: string
  phase: string
  vendor: string
  model: string
  sku: string
  quantity: number | string
  unit: string
  unit_cost: number | string
  markup_type: BOMItemMarkupType
  markup_value: number | string
  taxable: boolean
  optional: boolean
  included: boolean
  subtotal: number | string
  markup_amount: number | string
  total: number | string
  source: BOMItemSource
  source_document_id: string | null
  confidence: BOMItemConfidence
  notes: string
  internal_notes: string
  sort_order: number | string
  created_at: string
  updated_at: string
}

// ─── Translation helpers ─────────────────────────────────────────────────────

function num(v: number | string | null | undefined, d = 0): number {
  if (v === null || v === undefined) return d
  if (typeof v === 'number') return v
  const parsed = parseFloat(v)
  return Number.isFinite(parsed) ? parsed : d
}

function rowToProposal(r: ProposalRow): Proposal {
  return {
    id: r.id,
    jobId: r.opportunity_id !== null && r.opportunity_id !== undefined ? String(r.opportunity_id) : undefined,
    proposalNumber: r.proposal_number || '',
    title: r.title || '',
    customerName: r.customer_name || '',
    customerEmail: r.customer_email || '',
    expiresAt: r.expires_at ?? undefined,
    serviceType: r.service_type || '',
    milestone: r.milestone || 'Proposal',
    status: r.status || 'draft',
    templateStyle: r.template_style || 'modern',
    estimatedStartDate: r.estimated_start_date || '',
    dueDate: r.due_date || '',
    scopeOfWork: r.scope_of_work || '',
    includedWork: r.included_work || [],
    assumptions: r.assumptions || [],
    exclusions: r.exclusions || [],
    clientResponsibilities: r.client_responsibilities || [],
    internalNotes: r.internal_notes || '',
    subtotal: num(r.subtotal),
    taxableSubtotal: num(r.taxable_subtotal),
    taxEnabled: !!r.tax_enabled,
    taxRate: num(r.tax_rate),
    taxAmount: num(r.tax_amount),
    discountAmount: num(r.discount_amount),
    total: num(r.total),
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
    previewGeneratedAt: r.preview_generated_at ?? undefined,
    sentAt: r.sent_at ?? undefined,
    approvedAt: r.approved_at ?? undefined,
  }
}

function rowToBOMItem(r: BOMItemRow): BOMItem {
  return {
    id: r.id,
    proposalId: r.proposal_id,
    itemName: r.item_name || '',
    description: r.description || '',
    category: r.category || 'material',
    roomOrArea: r.room_or_area || '',
    phase: r.phase || '',
    vendor: r.vendor || '',
    model: r.model || '',
    sku: r.sku || '',
    quantity: num(r.quantity, 1),
    unit: r.unit || 'ea',
    unitCost: num(r.unit_cost),
    markupType: r.markup_type || 'none',
    markupValue: num(r.markup_value),
    taxable: !!r.taxable,
    optional: !!r.optional,
    included: r.included !== false,
    subtotal: num(r.subtotal),
    markupAmount: num(r.markup_amount),
    total: num(r.total),
    source: r.source || 'manual',
    sourceDocumentId: r.source_document_id ?? undefined,
    confidence: r.confidence || 'high',
    notes: r.notes || '',
    internalNotes: r.internal_notes || '',
    sortOrder: typeof r.sort_order === 'number' ? r.sort_order : parseInt(String(r.sort_order || 0), 10) || 0,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  }
}

function proposalToRow(p: Proposal, items: BOMItem[]): Record<string, unknown> {
  return {
    opportunity_id: p.jobId ? Number(p.jobId) : null,
    proposal_number: p.proposalNumber,
    title: p.title,
    customer_name: p.customerName,
    customer_email: p.customerEmail,
    expires_at: p.expiresAt ?? null,
    service_type: p.serviceType,
    milestone: p.milestone,
    status: p.status,
    template_style: p.templateStyle,
    estimated_start_date: p.estimatedStartDate,
    due_date: p.dueDate,
    scope_of_work: p.scopeOfWork,
    included_work: p.includedWork,
    assumptions: p.assumptions,
    exclusions: p.exclusions,
    client_responsibilities: p.clientResponsibilities,
    internal_notes: p.internalNotes,
    subtotal: p.subtotal,
    taxable_subtotal: p.taxableSubtotal,
    tax_enabled: p.taxEnabled,
    tax_rate: p.taxRate,
    tax_amount: p.taxAmount,
    discount_amount: p.discountAmount,
    total: p.total,
    line_items: items.map((i, idx) => ({
      item_name: i.itemName,
      description: i.description,
      category: i.category,
      room_or_area: i.roomOrArea,
      phase: i.phase,
      vendor: i.vendor,
      model: i.model,
      sku: i.sku,
      quantity: i.quantity,
      unit: i.unit,
      unit_cost: i.unitCost,
      markup_type: i.markupType,
      markup_value: i.markupValue,
      taxable: i.taxable,
      optional: i.optional,
      included: i.included,
      subtotal: i.subtotal,
      markup_amount: i.markupAmount,
      total: i.total,
      source: i.source,
      source_document_id: i.sourceDocumentId ?? null,
      confidence: i.confidence,
      notes: i.notes,
      internal_notes: i.internalNotes,
      sort_order: i.sortOrder ?? idx,
    })),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function createDefaultProposal(jobId?: string): Proposal {
  const now = new Date().toISOString()
  // Default expiry: 30 days from now
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    jobId,
    proposalNumber: generateProposalNumber(),
    title: '',
    customerName: '',
    customerEmail: '',
    expiresAt: expires,
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
    createdAt: now,
    updatedAt: now,
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

export type LoadResult = {
  proposal: Proposal
  items: BOMItem[]
  isNew: boolean
}

/**
 * Load a proposal:
 * - { proposalId } → fetch from backend
 * - { jobId } → return latest backend proposal for that job, or a new local draft tied to the job
 * - {} → new local draft (unsaved)
 */
export async function loadProposal(opts: { proposalId?: string; jobId?: string } = {}): Promise<LoadResult> {
  if (opts.proposalId) {
    const row = await apiGet<ProposalRow>(`/proposals/${opts.proposalId}`)
    const proposal = rowToProposal(row)
    const items = (row.line_items || []).map(rowToBOMItem)
    return { proposal, items, isNew: false }
  }

  if (opts.jobId) {
    const list = await apiGet<ProposalRow[]>(`/proposals?opportunity_id=${encodeURIComponent(opts.jobId)}`)
      .catch(() => [] as ProposalRow[])
    if (Array.isArray(list) && list.length > 0) {
      // Most recent first (backend already sorts by created_at DESC)
      const row = await apiGet<ProposalRow>(`/proposals/${list[0].id}`)
      return {
        proposal: rowToProposal(row),
        items: (row.line_items || []).map(rowToBOMItem),
        isNew: false,
      }
    }
    return { proposal: createDefaultProposal(opts.jobId), items: [], isNew: true }
  }

  return { proposal: createDefaultProposal(), items: [], isNew: true }
}

/**
 * Save a proposal + its line items in one round-trip.
 * - isNew → POST (create) → returns server-assigned id
 * - !isNew → PUT (replace fields + line items)
 */
export async function saveProposal(
  proposal: Proposal,
  items: BOMItem[],
  opts: { isNew: boolean }
): Promise<{ proposal: Proposal; items: BOMItem[] }> {
  const payload = proposalToRow(proposal, items)
  const row = opts.isNew
    ? await apiPost<ProposalRow>('/proposals', payload)
    : await apiPut<ProposalRow>(`/proposals/${proposal.id}`, payload)
  return {
    proposal: rowToProposal(row),
    items: (row.line_items || []).map(rowToBOMItem),
  }
}

export async function deleteProposal(proposalId: string): Promise<void> {
  await apiDelete(`/proposals/${proposalId}`)
}

export async function transitionProposalStatus(
  proposalId: string,
  status: ProposalStatus
): Promise<Proposal> {
  const row = await apiPost<ProposalRow>(`/proposals/${proposalId}/status`, { status })
  return rowToProposal(row)
}

// DEFERRED: proposals.send.email / proposals.send.pdf / proposals.send.share_link
// See local/reports/deferred_implementation.md
// Backend currently flips status to 'sent' and returns a placeholder share URL.
// Real email + PDF + token-backed share link ship in Phase 4.
export type SendProposalRequest = {
  to: string
  cc?: string
  subject?: string
  message?: string
  expires_at?: string | null
}
export type SendProposalResponse = {
  proposal: ProposalRow
  share_url: string
  email_sent: boolean
  pdf_attached: boolean
  message: string
}
export async function sendProposal(
  proposalId: string,
  payload: SendProposalRequest
): Promise<{ proposal: Proposal; shareUrl: string; emailSent: boolean; pdfAttached: boolean; message: string }> {
  const res = await apiPost<SendProposalResponse>(`/proposals/${proposalId}/send`, payload)
  return {
    proposal: rowToProposal(res.proposal),
    shareUrl: res.share_url,
    emailSent: res.email_sent,
    pdfAttached: res.pdf_attached,
    message: res.message,
  }
}

export async function listProposalsForJob(jobId: string | number): Promise<Proposal[]> {
  const rows = await apiGet<ProposalRow[]>(`/proposals?opportunity_id=${encodeURIComponent(String(jobId))}`)
  return (rows || []).map(rowToProposal)
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

// ─── One-shot migration: legacy localStorage drafts → backend ────────────────
// The previous version of the Proposal Builder persisted drafts to
// `anubis_proposal_draft_<jobId>`. On the first proposal-page visit after
// deploy, lift those into Supabase (best-effort) and clear the localStorage
// keys so the user doesn't see them again.

const MIGRATION_FLAG_KEY = 'anubis_proposal_localStorage_migration_v1'

export async function migrateLegacyLocalStorageDrafts(): Promise<{ migrated: number; failed: number }> {
  if (typeof window === 'undefined') return { migrated: 0, failed: 0 }
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) return { migrated: 0, failed: 0 }
  } catch {
    return { migrated: 0, failed: 0 }
  }

  const draftKeys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('anubis_proposal_draft_')) draftKeys.push(key)
    }
  } catch {
    return { migrated: 0, failed: 0 }
  }

  if (draftKeys.length === 0) {
    try { localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString()) } catch { /* ignore */ }
    return { migrated: 0, failed: 0 }
  }

  let migrated = 0
  let failed = 0

  for (const key of draftKeys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const draft = JSON.parse(raw) as Partial<Proposal>
      const jobIdFromKey = key.replace('anubis_proposal_draft_', '')
      const proposal: Proposal = {
        ...createDefaultProposal(jobIdFromKey || undefined),
        ...draft,
        jobId: draft.jobId ?? (jobIdFromKey || undefined),
      }
      // Old drafts didn't store BOM items here; if a sibling key exists, lift those too.
      let items: BOMItem[] = []
      try {
        const itemsRaw = localStorage.getItem(`anubis_bom_items_${proposal.id}`)
          || localStorage.getItem(`anubis_bom_items`)
        if (itemsRaw) items = JSON.parse(itemsRaw) as BOMItem[]
      } catch { /* ignore */ }

      await saveProposal(proposal, items, { isNew: true })
      try { localStorage.removeItem(key) } catch { /* ignore */ }
      migrated += 1
    } catch {
      failed += 1
    }
  }

  try { localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString()) } catch { /* ignore */ }
  return { migrated, failed }
}

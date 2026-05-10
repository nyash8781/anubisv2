'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { ProposalStatusBar } from '@/components/proposal/ProposalStatusBar'
import { AIAssistantHubCard } from '@/components/proposal/AIAssistantHubCard'
import { ScopeOfWorkCard } from '@/components/proposal/ScopeOfWorkCard'
import { BillOfMaterialsCard } from '@/components/proposal/BillOfMaterialsCard'
import { PricingSummaryCard } from '@/components/proposal/PricingSummaryCard'
import { DocumentsCard } from '@/components/proposal/DocumentsCard'
import { ProposalPreviewModal } from '@/components/proposal/ProposalPreviewModal'
import { SendModal } from '@/components/proposal/SendModal'
import {
  loadProposal,
  saveProposal,
  transitionProposalStatus,
  migrateLegacyLocalStorageDrafts,
} from '@/lib/services/proposalService'
import { createDefaultBOMItem } from '@/lib/services/bomService'
import { loadDocuments, saveDocuments } from '@/lib/services/proposalDocumentService'
import {
  mergeProposalSettings,
  DEFAULT_PROPOSAL_SETTINGS,
} from '@/lib/services/proposalSettingsService'
import { calculatePricing, recalcItem } from '@/lib/services/pricingService'
import type {
  Proposal,
  ProposalStatus,
  BOMItem,
  BOMItemCategory,
  ProposalDocument,
  ContractorProposalSettings,
  AIProposalAction,
} from '@/types/proposal'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseAIListItems(output: string): string[] {
  return output
    .split('\n')
    .map((l) =>
      l
        .replace(/^[\d]+[\.\)]\s*/, '')
        .replace(/^[•\-\*]\s*/, '')
        .trim()
    )
    .filter((l) => l.length > 3 && !l.startsWith('[AI') && !l.toLowerCase().startsWith('note:'))
}

function parseAIBOMOutput(output: string, offset: number): BOMItem[] {
  const lines = output.split('\n').filter((l) => l.trim())
  const items: BOMItem[] = []

  for (const line of lines) {
    const stripped = line
      .replace(/^[\d]+[\.\)]\s*/, '')
      .replace(/^[•\-\*]\s*/, '')
      .trim()

    if (!stripped || stripped.startsWith('[') || stripped.length < 3) continue

    // Try to parse: "Item name — Category — $1,234" or "Item name"
    const parts = stripped.split(/\s*—\s*/)
    const rawName = parts[0]?.replace(/\([^)]+\)/, '').trim() || ''
    const categoryStr = (parts[1] || '').toLowerCase().trim()
    const costStr = (parts[2] || '').replace(/[^0-9.]/g, '') || '0'

    if (!rawName || rawName.length < 2) continue

    const CATS = [
      'material', 'equipment', 'labor', 'subcontractor',
      'permit', 'design', 'travel', 'fee', 'allowance', 'other',
    ]
    const category: BOMItemCategory = CATS.includes(categoryStr)
      ? (categoryStr as BOMItemCategory)
      : 'material'

    const unitCost = parseFloat(costStr) || 0

    const draft = createDefaultBOMItem(offset + items.length)
    const item = recalcItem({
      ...draft,
      itemName: rawName,
      category,
      unitCost,
      source: 'ai_generated',
      confidence: 'low',
    })
    items.push(item)
  }

  return items
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProposalPage() {
  const searchParams = useSearchParams()
  const proposalIdParam = searchParams?.get('proposalId') ?? undefined
  const jobIdParam = searchParams?.get('jobId') ?? undefined

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [bomItems, setBomItems] = useState<BOMItem[]>([])
  const [documents, setDocuments] = useState<ProposalDocument[]>([])
  const [proposalSettings, setProposalSettings] =
    useState<ContractorProposalSettings>(DEFAULT_PROPOSAL_SETTINGS)
  const [showPreview, setShowPreview] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isNewProposal, setIsNewProposal] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Compute pricing live from BOM + proposal tax/discount settings
  const pricing = useMemo(
    () =>
      calculatePricing(
        bomItems,
        proposal?.taxRate ?? 0,
        proposal?.discountAmount ?? 0,
        proposal?.taxEnabled ?? false
      ),
    [bomItems, proposal?.taxRate, proposal?.discountAmount, proposal?.taxEnabled]
  )

  // ── Load on mount ──────────────────────────
  useEffect(() => {
    let active = true
    async function load() {
      // Best-effort one-shot migration of any legacy localStorage drafts.
      try {
        const r = await migrateLegacyLocalStorageDrafts()
        if (r.migrated > 0) {
          toast.success(`Migrated ${r.migrated} local draft${r.migrated === 1 ? '' : 's'} to your account.`)
        }
      } catch { /* non-fatal */ }

      try {
        const result = await loadProposal({ proposalId: proposalIdParam, jobId: jobIdParam })
        if (!active) return
        setProposal(result.proposal)
        setBomItems(result.items)
        setIsNewProposal(result.isNew)

        const docs = await loadDocuments(result.proposal.id).catch(() => [])
        if (!active) return
        setDocuments(docs)
      } catch (err) {
        console.error('Failed to load proposal:', err)
        toast.error('Failed to load proposal — try again.')
      }

      // Load proposal settings from the backend settings API (stored in extra JSONB)
      try {
        const remote = await apiGet<{ extra?: Record<string, unknown> }>('/settings')
        if (!active) return
        const ps = mergeProposalSettings(
          remote.extra?.proposal_settings as ContractorProposalSettings | undefined
        )
        setProposalSettings(ps)
      } catch {
        // Settings unavailable — use defaults, no crash
      }

      if (active) setLoaded(true)
    }
    load()
    return () => { active = false }
  }, [proposalIdParam, jobIdParam])

  // ── Handlers ──────────────────────────────
  function updateProposal(updates: Partial<Proposal>) {
    setProposal((prev) =>
      prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev
    )
    setIsDirty(true)
  }

  // Wrapper that flips isDirty on every BOM change
  const updateBomItems: React.Dispatch<React.SetStateAction<BOMItem[]>> = useCallback((next) => {
    setBomItems(next)
    setIsDirty(true)
  }, [])

  function handleAIApply(
    target: 'scope' | 'assumptions' | 'exclusions' | 'bom',
    content: string
  ) {
    if (!proposal) return

    if (target === 'scope') {
      updateProposal({
        scopeOfWork: proposal.scopeOfWork
          ? `${proposal.scopeOfWork}\n\n${content}`
          : content,
      })
    } else if (target === 'assumptions') {
      const newItems = parseAIListItems(content)
      updateProposal({ assumptions: [...proposal.assumptions, ...newItems] })
    } else if (target === 'exclusions') {
      const newItems = parseAIListItems(content)
      updateProposal({ exclusions: [...proposal.exclusions, ...newItems] })
    } else if (target === 'bom') {
      const newItems = parseAIBOMOutput(content, bomItems.length)
      if (newItems.length > 0) {
        updateBomItems((prev) => [...prev, ...newItems])
      }
    }
  }

  function handleRequestAI(_action: AIProposalAction) {
    // The AI hub manages its own selected action state.
    // This hook exists for the ScopeOfWorkCard quick-action buttons
    // to scroll/focus the AI hub — currently a no-op stub.
    // TODO: implement scroll-to-AI-hub + pre-select action
  }

  const handleSave = useCallback(async (opts?: { silent?: boolean }) => {
    if (!proposal || saving) return
    setSaving(true)
    const toastId = opts?.silent ? null : toast.loading('Saving proposal…')
    try {
      const result = await saveProposal(proposal, bomItems, { isNew: isNewProposal })
      setProposal(result.proposal)
      setBomItems(result.items)
      setIsNewProposal(false)
      setIsDirty(false)
      await saveDocuments(documents, result.proposal.id).catch(() => { /* documents not yet wired to backend */ })
      if (toastId !== null) toast.success('Proposal saved.', { id: toastId })
    } catch (err) {
      console.error('Save proposal failed:', err)
      if (toastId !== null) toast.error('Failed to save proposal — please try again.', { id: toastId })
      // Don't clear isDirty — let user retry
    } finally {
      setSaving(false)
    }
  }, [proposal, bomItems, documents, isNewProposal, saving])

  async function handleTransition(status: ProposalStatus) {
    if (!proposal) return
    if (isNewProposal || isDirty) {
      // Save first so the backend has the latest content
      try {
        await handleSave({ silent: true })
      } catch { return }
    }
    const toastId = toast.loading(`Updating status to ${status}…`)
    try {
      const updated = await transitionProposalStatus(proposal.id, status)
      setProposal(updated)
      setIsDirty(false)
      toast.success(`Proposal marked as ${status}.`, { id: toastId })
    } catch (err) {
      console.error('Status transition failed:', err)
      toast.error(`Failed to update status — please try again.`, { id: toastId })
    }
  }

  function handleSend() {
    if (!proposal) return
    if (isNewProposal) {
      toast.info('Save the proposal once before sending.')
      return
    }
    if (isDirty) {
      // Best practice: save before send. The send modal also surfaces this.
      handleSave({ silent: true })
    }
    setShowSend(true)
  }

  // Autosave: 3s debounce. Skips when:
  //   - proposal isn't loaded
  //   - proposal is brand new (no server id yet — explicit save creates it)
  //   - status is locked (approved/declined/expired)
  //   - already saving
  //   - nothing dirty
  useEffect(() => {
    if (!loaded || !proposal || isNewProposal) return
    if (proposal.status === 'approved' || proposal.status === 'declined' || proposal.status === 'expired') return
    if (!isDirty || saving) return

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      handleSave({ silent: true })
    }, 3000)

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [proposal, bomItems, isDirty, saving, isNewProposal, loaded, handleSave])

  // Warn before unloading with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function handleMarkReady() {
    updateProposal({ status: 'ready' })
    setShowPreview(false)
  }

  // ── Render ────────────────────────────────
  if (!loaded) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-5xl space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    )
  }

  if (!proposal) return null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 pb-16">

        {/* ── Page header ── */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Proposals
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
                Proposal Workspace
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Build, price, refine, and package the job
              </p>
            </div>
          </div>
        </section>

        {/* ── Status bar ── */}
        <ProposalStatusBar
          proposal={proposal}
          documents={documents}
          pricing={pricing}
          saving={saving}
          isDirty={isDirty}
          onPreview={() => setShowPreview(true)}
          onSave={() => handleSave()}
          onSend={handleSend}
          onTransition={handleTransition}
        />

        {/* ── AI Assistant Hub ── */}
        <AIAssistantHubCard
          proposal={proposal}
          bomItems={bomItems}
          proposalSettings={proposalSettings}
          onApply={handleAIApply}
        />

        {/* ── Scope of Work ── */}
        <ScopeOfWorkCard
          proposal={proposal}
          onChange={updateProposal}
          onRequestAI={handleRequestAI}
        />

        {/* ── Bill of Materials ── */}
        <BillOfMaterialsCard
          items={bomItems}
          onChange={updateBomItems}
          onRequestAI={() => handleRequestAI('generate_bom')}
        />

        {/* ── Pricing Summary ── */}
        <PricingSummaryCard
          items={bomItems}
          proposal={proposal}
          proposalSettings={proposalSettings}
          onChange={updateProposal}
        />

        {/* ── Documents ── */}
        <DocumentsCard
          documents={documents}
          onChange={setDocuments}
          proposalId={proposal.id}
        />

      </div>

      {/* ── Proposal Preview Modal ── */}
      <ProposalPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        proposal={proposal}
        bomItems={bomItems}
        proposalSettings={proposalSettings}
        pricing={pricing}
        onMarkReady={handleMarkReady}
      />

      {/* ── Send Modal (DEFERRED: real email/PDF in Phase 4) ── */}
      <SendModal
        open={showSend}
        proposal={proposal}
        total={pricing.total}
        isDirty={isDirty}
        onClose={() => setShowSend(false)}
        onSent={(updated) => {
          setProposal(updated)
          setIsDirty(false)
        }}
      />
    </main>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { ProposalStatusBar } from '@/components/proposal/ProposalStatusBar'
import { AIAssistantHubCard } from '@/components/proposal/AIAssistantHubCard'
import { ScopeOfWorkCard } from '@/components/proposal/ScopeOfWorkCard'
import { BillOfMaterialsCard } from '@/components/proposal/BillOfMaterialsCard'
import { PricingSummaryCard } from '@/components/proposal/PricingSummaryCard'
import { DocumentsCard } from '@/components/proposal/DocumentsCard'
import { ProposalPreviewModal } from '@/components/proposal/ProposalPreviewModal'
import {
  loadProposal,
  saveProposal,
} from '@/lib/services/proposalService'
import {
  loadBOMItems,
  saveBOMItems,
  createDefaultBOMItem,
} from '@/lib/services/bomService'
import { loadDocuments, saveDocuments } from '@/lib/services/proposalDocumentService'
import {
  mergeProposalSettings,
  DEFAULT_PROPOSAL_SETTINGS,
} from '@/lib/services/proposalSettingsService'
import { calculatePricing, recalcItem } from '@/lib/services/pricingService'
import type {
  Proposal,
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
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [bomItems, setBomItems] = useState<BOMItem[]>([])
  const [documents, setDocuments] = useState<ProposalDocument[]>([])
  const [proposalSettings, setProposalSettings] =
    useState<ContractorProposalSettings>(DEFAULT_PROPOSAL_SETTINGS)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
    async function load() {
      try {
        const p = await loadProposal()
        setProposal(p)

        const [items, docs] = await Promise.all([
          loadBOMItems(p.id),
          loadDocuments(p.id),
        ])
        setBomItems(items)
        setDocuments(docs)
      } catch {
        // Graceful fallback — loadProposal always returns a default
      }

      // Load proposal settings from the backend settings API (stored in extra JSONB)
      try {
        const remote = await apiGet<{ extra?: Record<string, unknown> }>('/settings')
        const ps = mergeProposalSettings(
          remote.extra?.proposal_settings as ContractorProposalSettings | undefined
        )
        setProposalSettings(ps)
      } catch {
        // Settings unavailable — use defaults, no crash
      }

      setLoaded(true)
    }
    load()
  }, [])

  // ── Handlers ──────────────────────────────
  function updateProposal(updates: Partial<Proposal>) {
    setProposal((prev) =>
      prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev
    )
  }

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
        setBomItems((prev) => [...prev, ...newItems])
      }
    }
  }

  function handleRequestAI(_action: AIProposalAction) {
    // The AI hub manages its own selected action state.
    // This hook exists for the ScopeOfWorkCard quick-action buttons
    // to scroll/focus the AI hub — currently a no-op stub.
    // TODO: implement scroll-to-AI-hub + pre-select action
  }

  async function handleSave() {
    if (!proposal) return
    setSaving(true)
    try {
      const saved = await saveProposal(proposal)
      setProposal(saved)
      await Promise.all([
        saveBOMItems(bomItems, saved.id),
        saveDocuments(documents, saved.id),
      ])
    } finally {
      setSaving(false)
    }
  }

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
          onPreview={() => setShowPreview(true)}
          onSave={handleSave}
          saving={saving}
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
          onChange={setBomItems}
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
    </main>
  )
}

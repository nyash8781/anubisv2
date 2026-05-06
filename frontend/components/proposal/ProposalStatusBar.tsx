'use client'

import type { Proposal, ProposalDocument, PricingSnapshot } from '@/types/proposal'
import { formatCurrency } from '@/lib/services/pricingService'
import { Button } from '@/components/ui/button'
import { Eye, Save, FileText } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  ready: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
}

interface Props {
  proposal: Proposal
  documents: ProposalDocument[]
  pricing: PricingSnapshot
  onPreview: () => void
  onSave: () => void
  saving: boolean
}

export function ProposalStatusBar({
  proposal,
  documents,
  pricing,
  onPreview,
  onSave,
  saving,
}: Props) {
  const lastUpdated = new Date(proposal.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const statusClass = STATUS_COLORS[proposal.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <section className="rounded-2xl border border-border/40 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: metadata pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold capitalize ${statusClass}`}
          >
            {proposal.status}
          </span>
          <Pill label="Total" value={formatCurrency(pricing.total)} accent />
          <Pill label="Docs" value={String(documents.length)} />
          <Pill label="Template" value="Modern" />
          <Pill label="Updated" value={lastUpdated} />
          {proposal.proposalNumber && (
            <Pill label="Proposal #" value={proposal.proposalNumber} />
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="gap-1.5 bg-electric text-white hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function Pill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background px-2.5 py-0.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </span>
  )
}

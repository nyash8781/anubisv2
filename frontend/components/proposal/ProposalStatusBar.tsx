'use client'

import type { Proposal, ProposalDocument, PricingSnapshot, ProposalStatus } from '@/types/proposal'
import { formatCurrency } from '@/lib/services/pricingService'
import { Button } from '@/components/ui/button'
import { Eye, Save, Send, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

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
  saving: boolean
  isDirty: boolean
  onPreview: () => void
  onSave: () => void
  onSend: () => void
  onTransition: (status: ProposalStatus) => void
}

export function ProposalStatusBar({
  proposal,
  documents,
  pricing,
  saving,
  isDirty,
  onPreview,
  onSave,
  onSend,
  onTransition,
}: Props) {
  const lastUpdated = new Date(proposal.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const statusClass = STATUS_COLORS[proposal.status] ?? 'bg-gray-100 text-gray-600'
  const isLocked = proposal.status === 'approved' || proposal.status === 'declined' || proposal.status === 'expired'

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
          {isDirty && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 font-semibold">
              Unsaved
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>

          {/* Status transition + send actions vary by current status */}
          {proposal.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTransition('ready')}
              className="gap-1.5"
              title="Mark this proposal as ready to send"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Ready
            </Button>
          )}

          {proposal.status === 'ready' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransition('draft')}
                className="gap-1.5"
                title="Move back to draft"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Back to Draft
              </Button>
              <Button
                size="sm"
                onClick={onSend}
                className="gap-1.5 bg-electric text-white hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </>
          )}

          {proposal.status === 'sent' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransition('declined')}
                className="gap-1.5 text-red-700 hover:text-red-800 hover:border-red-300"
                title="Manually mark as declined"
              >
                <XCircle className="h-3.5 w-3.5" />
                Declined
              </Button>
              <Button
                size="sm"
                onClick={() => onTransition('approved')}
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                title="Manually mark as approved (e-signature flow ships in Phase 4)"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Approved
              </Button>
            </>
          )}

          {/* Save is always available unless locked */}
          {!isLocked && (
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              aria-label="Save proposal"
              className="gap-1.5 bg-electric text-white hover:opacity-90"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
            </Button>
          )}
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

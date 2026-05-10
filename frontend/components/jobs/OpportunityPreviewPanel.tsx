'use client'

import Link from 'next/link'
import { X, Phone, Mail, MessageSquare, ExternalLink } from 'lucide-react'
import type { Job } from '@/types/job'

function fmt(val?: string | number) {
  const n = parseFloat(String(val ?? '').replace(/[^0-9.-]/g, ''))
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  onLogCall: () => void
  onLogEmail: () => void
  onLogText: () => void
}

export function OpportunityPreviewPanel({ job, open, onClose, onLogCall, onLogEmail, onLogText }: Props) {
  if (!open || !job) return null

  const fullName = [job.first_name, job.last_name].filter(Boolean).join(' ') || job.customer_name || 'Unnamed'
  const location = [job.city, job.state].filter(Boolean).join(', ')
  const bid = fmt(job.bid || job.price)
  const paid = fmt(job.payments_received)
  const balance = fmt(job.balance_due)

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {job.opportunity_id || 'Preview'}
            </div>
            <h2 className="mt-0.5 truncate font-display text-xl font-normal text-foreground">{fullName}</h2>
            {(job.service || location) && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {[job.service, location].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="ml-3 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Financial summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Bid', value: bid, color: 'text-foreground' },
              { label: 'Paid', value: paid, color: 'text-green-700' },
              { label: 'Balance', value: balance, color: Number(job.balance_due) > 0 ? 'text-red-600' : 'text-foreground' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</div>
                <div className={`mt-1 text-sm font-bold tabular-nums ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {job.milestone && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {job.milestone}
              </span>
            )}
            {job.status && (
              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                {job.status}
              </span>
            )}
            {job.production_status && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
                job.production_status === 'Blocked'
                  ? 'border-red-300/50 bg-red-100 text-red-700'
                  : job.production_status === 'Complete'
                  ? 'border-green-300/50 bg-green-100 text-green-700'
                  : 'border-border bg-muted/40 text-foreground'
              }`}>
                {job.production_status}
              </span>
            )}
            {job.flags?.isStale && (
              <span className="rounded-full border border-orange-300/30 bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-600">
                Stale
              </span>
            )}
          </div>

          {/* Contact details */}
          <div className="rounded-xl border border-border bg-muted/10 px-4 py-1">
            <InfoRow label="Email" value={job.email} />
            <InfoRow label="Phone" value={job.mobile_number_1 || job.phone} />
            <InfoRow label="Address" value={[job.address_1 || job.address, job.city, job.state].filter(Boolean).join(', ')} />
            <InfoRow label="Last Contact" value={job.last_contacted_date ? `${job.last_contacted_date}${job.last_contact_method ? ` · ${job.last_contact_method}` : ''}` : undefined} />
            <InfoRow label="Due Date" value={job.due_date} />
            <InfoRow label="Scheduled" value={job.scheduled_date} />
          </div>

          {/* Scope of work */}
          {job.scope_of_work && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scope of Work</div>
              <p className="text-xs text-foreground leading-relaxed line-clamp-4">{job.scope_of_work}</p>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-5 py-4 space-y-2">
          {/* Quick log */}
          <div className="flex gap-2">
            <button
              onClick={onLogCall}
              aria-label="Log phone call"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </button>
            <button
              onClick={onLogEmail}
              aria-label="Log email"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              onClick={onLogText}
              aria-label="Log text"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Text
            </button>
          </div>
          {/* Open full detail */}
          <Link
            href={`/opportunity/${job.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <ExternalLink className="h-4 w-4" />
            Open Full Detail
          </Link>
        </div>
      </aside>
    </>
  )
}

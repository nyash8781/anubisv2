'use client'

import { useEffect, useState } from 'react'
import { X, Send, Loader2, AlertTriangle, Copy, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Proposal } from '@/types/proposal'
import { sendProposal } from '@/lib/services/proposalService'
import { formatCurrency } from '@/lib/services/pricingService'

// DEFERRED: proposals.send.email / proposals.send.pdf / proposals.send.share_link
// See local/reports/deferred_implementation.md
//
// This modal collects the send fields and calls POST /proposals/:id/send.
// The backend currently:
//   - Marks status = 'sent', stamps sent_at
//   - Logs activity on the linked opportunity
//   - Returns a placeholder share URL (no real token, no real email, no PDF)
// Phase 4 will replace the backend behavior; this UI stays the same shape.

interface Props {
  open: boolean
  proposal: Proposal
  total: number
  isDirty: boolean
  onClose: () => void
  onSent: (proposal: Proposal) => void
}

export function SendModal({ open, proposal, total, isDirty, onClose, onSent }: Props) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sending, setSending] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Pre-fill from proposal whenever it changes
  useEffect(() => {
    if (!open) return
    setTo(proposal.customerEmail || '')
    setCc('')
    setSubject(`Proposal: ${proposal.title || proposal.proposalNumber || 'Your project'}`)
    setMessage(
      `Hi ${proposal.customerName || 'there'},\n\n` +
        `Please find your proposal attached. Total: ${formatCurrency(total)}.\n\n` +
        `Click the link below to review the details and let me know if you have any questions.\n\n` +
        `Thanks,`
    )
    if (proposal.expiresAt) {
      // Convert ISO to YYYY-MM-DD for date input
      try {
        setExpiresAt(new Date(proposal.expiresAt).toISOString().slice(0, 10))
      } catch {
        setExpiresAt('')
      }
    } else {
      setExpiresAt('')
    }
    setShareUrl(null)
    setCopied(false)
  }, [open, proposal, total])

  if (!open) return null

  const validation = validateBeforeSend({ proposal, total, to })

  async function handleSend() {
    if (!validation.ok) return
    setSending(true)
    const id = toast.loading('Sending proposal…')
    try {
      const expiresIso = expiresAt
        ? new Date(`${expiresAt}T23:59:59`).toISOString()
        : undefined
      const res = await sendProposal(proposal.id, {
        to,
        cc: cc || undefined,
        subject: subject || undefined,
        message: message || undefined,
        expires_at: expiresIso,
      })
      onSent(res.proposal)
      setShareUrl(res.shareUrl)
      // Tell the user this is a stub — they can copy the link, email is not real
      if (!res.emailSent) {
        toast.success('Proposal marked as sent. Email delivery ships in Phase 4 — copy the link to share manually.', { id })
      } else {
        toast.success('Proposal sent.', { id })
      }
    } catch (err) {
      console.error('Send failed:', err)
      toast.error(`Send failed: ${err instanceof Error ? err.message : 'unknown error'}`, { id })
    } finally {
      setSending(false)
    }
  }

  function handleCopyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('Failed to copy'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 p-0 sm:p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-normal">
            {shareUrl ? 'Proposal sent' : 'Send proposal'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Success state — show share URL after stub send */}
        {shareUrl && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-900 space-y-1">
                <div className="font-semibold">Status updated</div>
                <div className="text-green-800/80">
                  This proposal is now marked as <strong>sent</strong> and an activity entry was logged on the opportunity.
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Share link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs font-mono text-foreground"
                />
                <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-1.5 shrink-0">
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a placeholder URL. Real public client view + e-signature ship in Phase 4.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onClose} size="sm">Done</Button>
            </div>
          </div>
        )}

        {/* Form state */}
        {!shareUrl && (
          <>
            {/* DEFERRED banner */}
            <div className="mx-5 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Phase 3.5 — preview mode.</span>{' '}
                Sending will mark this proposal as sent and log an activity entry. Real email delivery + PDF attachment + branded public client view ship in Phase 4.
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Validation panel */}
              {!validation.ok && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">Fix before sending:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {isDirty && validation.ok && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                  You have unsaved changes. Save the proposal before sending — sending uses the last saved version.
                </div>
              )}

              <Field label="To" required>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </Field>

              <Field label="CC">
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="optional"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </Field>

              <Field label="Subject">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </Field>

              <Field label="Message">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </Field>

              <Field label="Expires on" hint="Default: 30 days from today">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={onClose} variant="outline" size="sm" disabled={sending}>Cancel</Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !validation.ok}
                  size="sm"
                  className="gap-1.5 bg-electric text-white hover:opacity-90"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {sending ? 'Sending…' : 'Send Proposal'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal normal-case text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

// ── Validation helpers ──────────────────────────────────────────────────────

export type SendValidation = { ok: boolean; errors: string[] }

export function validateBeforeSend({
  proposal,
  total,
  to,
}: {
  proposal: Proposal
  total: number
  to?: string
}): SendValidation {
  const errors: string[] = []
  const recipient = (to ?? proposal.customerEmail ?? '').trim()
  if (!recipient) errors.push('Recipient email is required.')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) errors.push('Recipient email is not a valid address.')
  if (!proposal.scopeOfWork || proposal.scopeOfWork.trim().length < 10) {
    errors.push('Scope of Work is empty or too short.')
  }
  if (!total || total <= 0) {
    errors.push('Proposal total must be greater than $0 — add at least one line item.')
  }
  if (proposal.status !== 'ready' && proposal.status !== 'sent') {
    errors.push(`Proposal must be marked Ready before sending (currently ${proposal.status}).`)
  }
  return { ok: errors.length === 0, errors }
}

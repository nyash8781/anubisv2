'use client'

// Public proposal view — no auth, the URL token IS the auth.
// This route is OUTSIDE the (app) auth-guarded group on purpose.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, MessageSquare, AlertCircle } from 'lucide-react'
import { ProposalClientView, type ClientViewProposal, type ClientViewItem, type BusinessProfileSnapshot, type LegalTextBlocks, type PaymentTermSnapshot } from '@/components/proposal/ProposalClientView'
import { SignatureModal } from '@/components/proposal/SignatureModal'

const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type PublicProposalResponse = {
  proposal: ClientViewProposal & { line_items: ClientViewItem[] }
  link: { expires_at: string }
  // Future: include business profile + legal + payment terms snapshot
  // For now those come from the contractor's settings — Phase 4 polish will
  // snapshot them into the share link / version row so historical proposals
  // never change branding when settings update.
  business?: BusinessProfileSnapshot
  legal?: LegalTextBlocks
  payment_terms?: PaymentTermSnapshot[]
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; status: number; message: string }
  | { kind: 'ready'; data: PublicProposalResponse }
  | { kind: 'thanks'; outcome: 'approved' | 'declined' | 'revision' }

export default function PublicProposalPage() {
  const params = useParams()
  const token = (Array.isArray(params?.token) ? params.token[0] : params?.token) || ''
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [showSig, setShowSig] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState('')
  const [showRevision, setShowRevision] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', status: 400, message: 'Missing proposal token' })
      return
    }
    if (!API_BASE) {
      setState({ kind: 'error', status: 500, message: 'API base URL is not configured' })
      return
    }

    let active = true
    fetch(`${API_BASE}/public/proposals/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!active) return
        if (!res.ok) {
          let msg = `Failed to load proposal (HTTP ${res.status})`
          try {
            const body = await res.json()
            if (body?.error) msg = body.error
          } catch { /* ignore */ }
          setState({ kind: 'error', status: res.status, message: msg })
          return
        }
        const body = await res.json()
        setState({ kind: 'ready', data: body as PublicProposalResponse })
      })
      .catch((err) => {
        if (!active) return
        setState({ kind: 'error', status: 0, message: err?.message || 'Network error' })
      })
    return () => { active = false }
  }, [token])

  async function handleAcceptSubmit(payload: { signer_name: string; signer_email: string; signature_text: string; agreed_terms: boolean }) {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/public/proposals/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Accept failed (HTTP ${res.status})`)
      }
      setShowSig(false)
      setState({ kind: 'thanks', outcome: 'approved' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecline() {
    setSubmitting(true)
    try {
      await fetch(`${API_BASE}/public/proposals/${encodeURIComponent(token)}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '' }),
      })
      setShowDeclineConfirm(false)
      setState({ kind: 'thanks', outcome: 'declined' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestChanges() {
    if (!revisionMessage.trim()) return
    setSubmitting(true)
    try {
      await fetch(`${API_BASE}/public/proposals/${encodeURIComponent(token)}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: revisionMessage.trim() }),
      })
      setShowRevision(false)
      setState({ kind: 'thanks', outcome: 'revision' })
    } finally {
      setSubmitting(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading proposal…
        </div>
      </main>
    )
  }

  if (state.kind === 'error') {
    const isExpired = state.status === 410
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center space-y-3">
          <AlertCircle className={`h-10 w-10 mx-auto ${isExpired ? 'text-amber-500' : 'text-red-500'}`} />
          <h1 className="font-display text-xl">
            {isExpired ? 'This proposal has expired' : 'Proposal unavailable'}
          </h1>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <p className="text-xs text-muted-foreground">
            Please contact the sender for an updated link.
          </p>
        </div>
      </main>
    )
  }

  if (state.kind === 'thanks') {
    const headlines = {
      approved: { icon: CheckCircle, color: 'text-green-600', title: 'Proposal accepted', body: "Thank you. The contractor has been notified and will be in touch shortly." },
      declined: { icon: XCircle, color: 'text-gray-500', title: 'Proposal declined', body: 'Thank you for letting us know.' },
      revision: { icon: MessageSquare, color: 'text-primary', title: 'Changes requested', body: "Your message has been sent. The contractor will review and reach out." },
    }
    const cfg = headlines[state.outcome]
    const Icon = cfg.icon
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center space-y-3">
          <Icon className={`h-12 w-12 mx-auto ${cfg.color}`} />
          <h1 className="font-display text-2xl">{cfg.title}</h1>
          <p className="text-sm text-muted-foreground">{cfg.body}</p>
        </div>
      </main>
    )
  }

  // Ready state
  const { proposal, business, legal, payment_terms } = state.data
  const isLocked = proposal.status === 'approved' || proposal.status === 'declined' || proposal.status === 'expired'

  return (
    <>
      <main className="min-h-screen bg-muted/30 py-8 px-4 pb-32">
        <ProposalClientView
          proposal={proposal}
          items={proposal.line_items || []}
          businessProfile={business}
          legal={legal}
          paymentTerms={payment_terms}
        />
      </main>

      {/* Sticky bottom action bar — only when proposal is actionable */}
      {!isLocked && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="mx-auto max-w-3xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Ready to move forward?
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowDeclineConfirm(true)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-red-200 hover:text-red-700 transition"
              >
                Decline
              </button>
              <button
                onClick={() => setShowRevision(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Request Changes
              </button>
              <button
                onClick={() => setShowSig(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-electric px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Accept & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        open={showSig}
        defaultEmail={proposal.customer_email}
        onClose={() => setShowSig(false)}
        onSubmit={handleAcceptSubmit}
      />

      {/* Decline confirmation */}
      {showDeclineConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <h2 className="font-display text-lg">Decline this proposal?</h2>
            <p className="text-sm text-muted-foreground">
              The contractor will be notified that you've declined. You can always come back if you change your mind, but the link may expire.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineConfirm(false)}
                disabled={submitting}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Yes, decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request changes modal */}
      {showRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <h2 className="font-display text-lg">Request changes</h2>
            <p className="text-sm text-muted-foreground">
              Tell the contractor what you'd like to change. They'll receive your message and follow up directly.
            </p>
            <textarea
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g., Can you swap the marble for quartz?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRevision(false)}
                disabled={submitting}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={submitting || !revisionMessage.trim()}
                className="rounded-xl bg-electric text-white px-3 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

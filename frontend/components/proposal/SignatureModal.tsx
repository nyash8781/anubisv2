'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  defaultEmail?: string
  // The accept call is delegated — this component knows nothing about routes.
  onSubmit: (payload: {
    signer_name: string
    signer_email: string
    signature_text: string
    agreed_terms: boolean
  }) => Promise<void>
}

export function SignatureModal({ open, onClose, defaultEmail, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(defaultEmail || '')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const isValid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && agreed

  async function handleSubmit() {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        signer_name: name.trim(),
        signer_email: email.trim(),
        signature_text: name.trim(), // typed signature = printed name
        agreed_terms: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit signature')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-normal">Accept proposal</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            By typing your full name and clicking Accept below, you agree to the proposal and authorize the work as described. This constitutes your electronic signature.
          </p>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <label className="block">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Full Name <span className="text-red-500">*</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your full legal name"
              autoFocus
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email <span className="text-red-500">*</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </label>

          {/* Live signature preview */}
          {name.trim() && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Your Signature</div>
              <div className="font-display italic text-2xl text-primary">{name}</div>
            </div>
          )}

          <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
            />
            <span>
              I have read and agree to the proposal and its terms. I understand that typing my name above is my electronic signature under the ESIGN Act.
            </span>
          </label>

          <p className="text-[11px] text-muted-foreground">
            Your IP address, browser info, and timestamp will be recorded as part of the signature audit trail.
          </p>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-electric px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Accept & Sign'}
          </button>
        </div>
      </div>
    </div>
  )
}

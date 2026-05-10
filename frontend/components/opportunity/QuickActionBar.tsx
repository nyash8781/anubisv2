'use client'

import { useRef, useState } from 'react'
import {
  Phone, MessageSquare, Mail, Sparkles, Save,
  Pin, CheckCircle2, DollarSign, NotebookPen, Loader2,
} from 'lucide-react'

type ActionKey = 'call' | 'text' | 'email' | 'mark' | 'payment' | 'complete'

type Props = {
  saving: boolean
  generating: boolean
  onCall: () => void | Promise<void>
  onText: () => void | Promise<void>
  onEmail: () => void | Promise<void>
  onGenerate: () => void
  onSave: () => void
  onMarkContacted: () => void | Promise<void>
  onRequestPayment: () => void | Promise<void>
  onAddNote: () => void
  onComplete: () => void | Promise<void>
}

export function QuickActionBar({
  saving,
  generating,
  onCall,
  onText,
  onEmail,
  onGenerate,
  onSave,
  onMarkContacted,
  onRequestPayment,
  onAddNote,
  onComplete,
}: Props) {
  const [busy, setBusy] = useState<ActionKey | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wraps an action handler with a debounce guard (1.5 s cooldown)
  async function fire(key: ActionKey, handler: () => void | Promise<void>) {
    if (busy) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setBusy(key)
    try {
      await handler()
    } finally {
      timerRef.current = setTimeout(() => setBusy(null), 1500)
    }
  }

  const actionBtn = (
    key: ActionKey,
    label: string,
    icon: React.ReactNode,
    handler: () => void | Promise<void>,
    extra = ''
  ) => (
    <button
      onClick={() => fire(key, handler)}
      disabled={!!busy}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed ${extra}`}
    >
      {busy === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  )

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4">
      <div className="rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Actions
          </span>

          {/* Contact */}
          {actionBtn('call', 'Call', <Phone className="h-3.5 w-3.5" />, onCall)}
          {actionBtn('text', 'Text', <MessageSquare className="h-3.5 w-3.5" />, onText)}
          {actionBtn('email', 'Email', <Mail className="h-3.5 w-3.5" />, onEmail)}

          <div className="mx-1 h-4 w-px bg-border" />

          {/* AI + Save */}
          <button
            onClick={onGenerate}
            disabled={generating || !!busy}
            aria-label="Generate AI content"
            className="flex items-center gap-1.5 rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : 'Generate AI'}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !!busy}
            aria-label="Save opportunity"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save'}
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Utility */}
          {actionBtn('mark', 'Mark Contacted', <Pin className="h-3.5 w-3.5" />, onMarkContacted)}
          <button
            onClick={() => fire('payment', onRequestPayment)}
            disabled={!!busy}
            aria-label="Request payment"
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'payment' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
            Request Payment
          </button>
          <button
            onClick={onAddNote}
            aria-label="Add a note"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <NotebookPen className="h-3.5 w-3.5" /> Add Note
          </button>
          <button
            onClick={() => fire('complete', onComplete)}
            disabled={!!busy}
            aria-label="Mark opportunity as complete"
            className="flex items-center gap-1.5 rounded-lg border border-green-500/40 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'complete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Complete
          </button>
        </div>
      </div>
    </div>
  )
}

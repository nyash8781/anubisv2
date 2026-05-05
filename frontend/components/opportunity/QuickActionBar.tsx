'use client'

import {
  Phone, MessageSquare, Mail, Sparkles, Save,
  Pin, CheckCircle2, DollarSign, NotebookPen,
} from 'lucide-react'

type Props = {
  saving: boolean
  generating: boolean
  onCall: () => void
  onText: () => void
  onEmail: () => void
  onGenerate: () => void
  onSave: () => void
  onMarkContacted: () => void
  onRequestPayment: () => void
  onAddNote: () => void
  onComplete: () => void
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
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4">
      <div className="rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Actions
          </span>

          {/* Contact */}
          <button
            onClick={onCall}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </button>
          <button
            onClick={onText}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Text
          </button>
          <button
            onClick={onEmail}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* AI + Save */}
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? 'Generating…' : 'Generate AI'}
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Utility */}
          <button
            onClick={onMarkContacted}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <Pin className="h-3.5 w-3.5" /> Mark Contacted
          </button>
          <button
            onClick={onRequestPayment}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <DollarSign className="h-3.5 w-3.5" /> Request Payment
          </button>
          <button
            onClick={onAddNote}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <NotebookPen className="h-3.5 w-3.5" /> Add Note
          </button>
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 rounded-lg border border-green-500/40 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
          </button>
        </div>
      </div>
    </div>
  )
}

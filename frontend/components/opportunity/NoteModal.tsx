'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  current: string
  onClose: () => void
  onSave: (updated: string) => void
}

export function NoteModal({ current, onClose, onSave }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed) { onClose(); return }
    const ts = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    const entry = `[${ts}] ${trimmed}`
    onSave(current ? `${current}\n\n${entry}` : entry)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Add Note</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Enter note — will be timestamped and appended to internal notes…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}

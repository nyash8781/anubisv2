'use client'

import { Phone, Sparkles, NotebookPen, Mail } from 'lucide-react'
import { fmtDate } from './utils'

type ActivityTimelineProps = {
  lastContactedDate?: string
  lastContactMethod?: string
  createdAt?: string
  onAddNote: () => void
  onLogCall: () => void
  onLogEmail: () => void
}

// [AI HOOK] Future: render full event log from backend activity_log table
// [API INTEGRATION] Phase 2: GET /jobs/:id/activity → list of {type, date, note}

export function ActivityTimeline({
  lastContactedDate,
  lastContactMethod,
  createdAt,
  onAddNote,
  onLogCall,
  onLogEmail,
}: ActivityTimelineProps) {
  return (
    <div className="space-y-3">
      {/* Event log */}
      <div className="space-y-2">
        {lastContactedDate && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold capitalize text-foreground">
                  Last contacted via {lastContactMethod || 'unknown'}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDate(lastContactedDate)}
                </div>
              </div>
            </div>
          </div>
        )}

        {createdAt && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Opportunity created</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(createdAt)}</div>
              </div>
            </div>
          </div>
        )}

        {!lastContactedDate && !createdAt && (
          <div className="py-2 text-xs text-muted-foreground">No activity recorded yet.</div>
        )}
      </div>

      {/* Log activity buttons */}
      <div className="space-y-1.5 pt-1">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Log Activity
        </div>
        <button
          onClick={onAddNote}
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <NotebookPen className="h-3.5 w-3.5" />
          Add Note
        </button>
        <button
          onClick={onLogCall}
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5" />
          Log Call
        </button>
        <button
          onClick={onLogEmail}
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" />
          Log Email
        </button>
      </div>
    </div>
  )
}

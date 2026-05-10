'use client'

import { useEffect, useRef, useState } from 'react'
import { Phone, Sparkles, NotebookPen, Mail, MessageSquare, CheckCircle, FileText, Wrench, CreditCard, User, AlertTriangle, Loader2 } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { fmtDate } from './utils'

type ActivityEntry = {
  id: number
  job_id: number
  user_id: string
  project_name: string
  action: string
  description: string
  action_type: string
  metadata?: Record<string, unknown>
  created_at: string
}

type ActivityTimelineProps = {
  jobId?: number
  lastContactedDate?: string
  lastContactMethod?: string
  createdAt?: string
  /** Increment to trigger a re-fetch (pass activityRefreshKey from parent) */
  refreshKey?: number
  onAddNote: () => void
  onLogCall: () => void
  onLogEmail: () => void
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5 text-primary" />,
  text: <MessageSquare className="h-3.5 w-3.5 text-primary" />,
  email: <Mail className="h-3.5 w-3.5 text-primary" />,
  manual: <User className="h-3.5 w-3.5 text-primary" />,
  completed: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
  note: <NotebookPen className="h-3.5 w-3.5 text-primary" />,
  job_created: <Sparkles className="h-3.5 w-3.5 text-primary" />,
  milestone_changed: <FileText className="h-3.5 w-3.5 text-primary" />,
  status_changed: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  production_blocked: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  production_unblocked: <Wrench className="h-3.5 w-3.5 text-green-600" />,
  production_update: <Wrench className="h-3.5 w-3.5 text-primary" />,
  payment_status_changed: <CreditCard className="h-3.5 w-3.5 text-primary" />,
  job_modified: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
}

function getIcon(type: string) {
  return TYPE_ICON[type] ?? <Sparkles className="h-3.5 w-3.5 text-primary" />
}

export function ActivityTimeline({
  jobId,
  lastContactedDate,
  lastContactMethod,
  createdAt,
  refreshKey = 0,
  onAddNote,
  onLogCall,
  onLogEmail,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  // Per-button debounce: tracks which log button is in-flight
  const [logBusy, setLogBusy] = useState<'note' | 'call' | 'email' | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!jobId) return
    let active = true
    setLoading(true)
    apiGet<ActivityEntry[]>(`/jobs/${jobId}/activity?limit=25`)
      .then((data) => { if (active) setActivities(data || []) })
      .catch(() => { /* non-fatal — fall back to static entries */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [jobId, refreshKey])   // re-fetch whenever parent increments refreshKey

  // Debounced log handler — disables button for 1.5 s to prevent double-logs
  function handleLog(type: 'note' | 'call' | 'email', handler: () => void) {
    if (logBusy) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLogBusy(type)
    handler()
    debounceRef.current = setTimeout(() => setLogBusy(null), 1500)
  }

  const hasApiEntries = activities.length > 0

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading activity…
          </div>
        )}

        {!loading && hasApiEntries && activities.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {getIcon(a.action_type)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{a.action}</div>
                {a.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{a.description}</div>
                )}
                <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(a.created_at)}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Static fallback entries when no API data */}
        {!loading && !hasApiEntries && lastContactedDate && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold capitalize text-foreground">
                  Last contacted via {lastContactMethod || 'unknown'}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(lastContactedDate)}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && !hasApiEntries && createdAt && (
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

        {!loading && !hasApiEntries && !lastContactedDate && !createdAt && (
          <div className="py-2 text-xs text-muted-foreground">No activity recorded yet.</div>
        )}
      </div>

      {/* Log activity buttons */}
      <div className="space-y-1.5 pt-1">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Log Activity
        </div>
        <button
          onClick={() => handleLog('note', onAddNote)}
          disabled={!!logBusy}
          aria-label="Add a note to this opportunity"
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logBusy === 'note' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <NotebookPen className="h-3.5 w-3.5" />}
          Add Note
        </button>
        <button
          onClick={() => handleLog('call', onLogCall)}
          disabled={!!logBusy}
          aria-label="Log a phone call for this opportunity"
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logBusy === 'call' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
          Log Call
        </button>
        <button
          onClick={() => handleLog('email', onLogEmail)}
          disabled={!!logBusy}
          aria-label="Log an email for this opportunity"
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logBusy === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Log Email
        </button>
      </div>
    </div>
  )
}

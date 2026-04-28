'use client'

import { Phone, Sparkles } from 'lucide-react'
import { fmtDate } from './utils'

type LastContactProps = {
  lastContactedDate?: string
  lastContactMethod?: string
  createdAt?: string
}

export function ActivityTimeline({ lastContactedDate, lastContactMethod, createdAt }: LastContactProps) {
  if (lastContactedDate) {
    const methodLabel = lastContactMethod
      ? lastContactMethod.charAt(0).toUpperCase() + lastContactMethod.slice(1)
      : 'Unknown method'

    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Last contacted via {methodLabel}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(lastContactedDate)}</div>
          </div>
        </div>
      </div>
    )
  }

  if (createdAt) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Opportunity created</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(createdAt)}</div>
            <div className="mt-1 text-xs text-muted-foreground">No contact logged yet — use Quick Actions above to log the first touch.</div>
          </div>
        </div>
      </div>
    )
  }

  return <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
}

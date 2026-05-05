'use client'

import type { Job } from '@/types/job'
import { MILESTONE_ORDER } from '@/types/job'
import { InputField } from './InputField'
import { fmtMoney } from './utils'

type Props = {
  job: Job
  setField: (field: keyof Job, value: string) => void
}

export function ScopeOfWork({ job, setField }: Props) {
  const bid = Number(job.bid || job.price) || 0

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <InputField
          label="Service"
          value={job.service}
          onChange={(v) => setField('service', v)}
        />
        <label className="block">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Milestone
          </div>
          <select
            value={job.milestone || 'Lead'}
            onChange={(e) => setField('milestone', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            {MILESTONE_ORDER.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <InputField
          label="Bid ($)"
          value={job.bid}
          onChange={(v) => setField('bid', v)}
          type="number"
        />
        <InputField
          label="Paid ($)"
          value={job.payments_received}
          onChange={(v) => setField('payments_received', v)}
          type="number"
        />
        <InputField
          label="Balance ($)"
          value={job.balance_due}
          onChange={(v) => setField('balance_due', v)}
          type="number"
        />
      </div>

      <InputField
        label="Due Date"
        value={job.due_date}
        onChange={(v) => setField('due_date', v)}
        type="date"
      />

      {/* Total contract value — shown when bid is set */}
      {bid > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Contract Value
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">{fmtMoney(bid)}</div>
        </div>
      )}

      <label className="block">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Scope of Work
        </div>
        <textarea
          value={job.scope_of_work || ''}
          onChange={(e) => setField('scope_of_work', e.target.value)}
          rows={8}
          placeholder="Describe the service scope, materials, deliverables, and client needs…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </label>
    </div>
  )
}

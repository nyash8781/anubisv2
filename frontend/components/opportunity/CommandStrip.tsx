'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import type { Job } from '@/types/job'
import { MILESTONE_ORDER } from '@/types/job'
import { RiskBadge } from './RiskBadge'
import { fmtMoney, fmtDate } from './utils'
import { daysUntil, type RiskLevel, type NBAAction, type ActionType } from './job-utils'

type Props = {
  job: Job
  oppId: string
  title: string
  summary: string
  risk: RiskLevel
  progress: { pct: number; paidLabel: string; totalLabel: string }
  nba: NBAAction
  nbaDismissed: boolean
  nbaSnoozed: boolean
  saving: boolean
  dirty: boolean
  currentMilestoneIdx: number
  milestones?: string[]
  onSave: () => void
  onViewProfile: () => void
  onExecuteNba: (action: ActionType) => void
  onSnoozeNba: () => void
  onDismissNba: () => void
  onMilestoneChange: (milestone: string) => void
}

export function CommandStrip({
  job,
  oppId,
  title,
  summary,
  risk,
  progress,
  nba,
  nbaDismissed,
  nbaSnoozed,
  saving,
  dirty,
  currentMilestoneIdx,
  milestones: milestonesProp,
  onSave,
  onViewProfile,
  onExecuteNba,
  onSnoozeNba,
  onDismissNba,
  onMilestoneChange,
}: Props) {
  const milestoneList = (milestonesProp && milestonesProp.length > 0) ? milestonesProp : MILESTONE_ORDER as string[];
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">

      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/jobs"
            onClick={(e) => {
              if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) {
                e.preventDefault()
              }
            }}
            className="mt-1 shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            ← Jobs
          </Link>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Opportunity · {oppId || 'New'}
            </div>
            <h1 className="truncate font-display text-2xl font-normal text-foreground">{title}</h1>
            {/* Client summary: Name · City, State · Job Type */}
            {summary && (
              <div className="mt-0.5 truncate text-sm text-muted-foreground">{summary}</div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RiskBadge level={risk} />
          <button
            onClick={onViewProfile}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <User className="h-3.5 w-3.5" />
            View Profile
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition hover:opacity-90 disabled:opacity-60 ${
              dirty ? 'bg-electric text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* ── Financial summary — 4 metric cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          { label: 'Bid', value: fmtMoney(job.bid || job.price), alert: false, highlight: false },
          { label: 'Paid', value: fmtMoney(job.payments_received), alert: false, highlight: true },
          { label: 'Balance Due', value: fmtMoney(job.balance_due), alert: Number(job.balance_due) > 0, highlight: false },
          {
            label: 'Due Date',
            value: fmtDate(job.due_date),
            alert: (daysUntil(job.due_date) ?? 99) <= 3 && Number(job.balance_due) > 0,
            highlight: false,
          },
        ] as const).map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border px-4 py-3 ${
              c.alert
                ? 'border-red-500/20 bg-red-50'
                : c.highlight
                ? 'border-green-500/20 bg-green-50'
                : 'border-border bg-muted/20'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {c.label}
            </div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${
                c.alert ? 'text-red-700' : c.highlight ? 'text-green-700' : 'text-foreground'
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Payment progress bar ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{progress.pct}%</span> paid
            &nbsp;·&nbsp; {progress.paidLabel} of {progress.totalLabel}
          </span>
          {job.due_date && (
            <span>
              {(() => {
                const d = daysUntil(job.due_date)
                if (d === null) return null
                if (d < 0) return <span className="font-semibold text-red-600">Overdue by {Math.abs(d)}d</span>
                if (d === 0) return <span className="font-semibold text-orange-600">Due today</span>
                return `Due in ${d} day${d === 1 ? '' : 's'}`
              })()}
            </span>
          )}
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-electric transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
          {/* Installment tick marks at 30% (deposit) and 70% (midpoint) */}
          <div className="absolute inset-y-0 left-[30%] w-px bg-white/70" />
          <div className="absolute inset-y-0 left-[70%] w-px bg-white/70" />
        </div>
      </div>

      {/* ── Next Best Action ─────────────────────────────────────────────────── */}
      {/* [AI HOOK] Future: replace rule-based NBA with model-driven recommendation */}
      {nba && !nbaDismissed && !nbaSnoozed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 rounded-lg bg-electric px-2 py-0.5 text-xs font-bold text-white">
              Next Action
            </span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">{nba.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{nba.description}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {nba.action && (
              <button
                onClick={() => onExecuteNba(nba.action as ActionType)}
                className="rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Execute
              </button>
            )}
            <button
              onClick={onSnoozeNba}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              Snooze 24h
            </button>
            <button
              onClick={onDismissNba}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Project Lifecycle milestones ─────────────────────────────────────── */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Project Lifecycle
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {milestoneList.map((m, i) => {
            const state =
              i < currentMilestoneIdx ? 'complete' : i === currentMilestoneIdx ? 'current' : 'upcoming'
            return (
              <button
                key={m}
                onClick={() => onMilestoneChange(m)}
                className={`min-w-[90px] flex-1 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  state === 'current'
                    ? 'border-primary bg-electric text-white shadow-sm'
                    : state === 'complete'
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {state === 'complete' && '✓ '}
                {m}
              </button>
            )
          })}
        </div>
      </div>

    </section>
  )
}

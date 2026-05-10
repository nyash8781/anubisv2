'use client'

import type { Job } from '@/types/job'

function fmt(val?: string | number) {
  const n = parseFloat(String(val ?? '').replace(/[^0-9.-]/g, ''))
  if (isNaN(n)) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// Column header colors per milestone
const COLUMN_COLORS: Record<string, string> = {
  Lead:         'border-blue-200 bg-blue-50 text-blue-800',
  'Site Visit': 'border-purple-200 bg-purple-50 text-purple-800',
  Proposal:     'border-amber-200 bg-amber-50 text-amber-800',
  Construction: 'border-orange-200 bg-orange-50 text-orange-800',
  Completed:    'border-green-200 bg-green-50 text-green-800',
}

const DEFAULT_COL_COLOR = 'border-border bg-muted/30 text-foreground'

type BoardCardProps = {
  job: Job
  index: number
  onClick: () => void
}

function BoardCard({ job, index, onClick }: BoardCardProps) {
  const fullName = [job.first_name, job.last_name].filter(Boolean).join(' ') || job.customer_name || 'Unnamed'
  const bid = fmt(job.bid || job.price)
  const isDraft = job.status === 'Draft'

  return (
    <button
      onClick={onClick}
      aria-label={`Open preview for ${fullName}`}
      className="w-full rounded-xl border border-border bg-white p-3.5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row: ID + stale badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
          {job.opportunity_id || `#${String(index + 1).padStart(3, '0')}`}
        </span>
        <div className="flex gap-1">
          {job.flags?.isStale && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-600">
              Stale
            </span>
          )}
          {isDraft && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Customer name */}
      <div className="truncate text-sm font-semibold text-foreground">{fullName}</div>

      {/* Service + location */}
      {(job.service || job.city) && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {[job.service, job.city].filter(Boolean).join(' · ')}
        </div>
      )}

      {/* Bid + last contact */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {bid ? (
          <span className="text-sm font-bold text-foreground tabular-nums">{bid}</span>
        ) : (
          <span className="text-xs text-muted-foreground">No bid</span>
        )}
        {job.last_contacted_date && (
          <span className="text-[10px] text-muted-foreground">
            {job.last_contacted_date}
          </span>
        )}
      </div>

      {/* Production status pill */}
      {job.production_status && job.production_status !== 'Not Scheduled' && (
        <div className="mt-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            job.production_status === 'Blocked'
              ? 'bg-red-100 text-red-700'
              : job.production_status === 'Complete'
              ? 'bg-green-100 text-green-700'
              : 'bg-muted/60 text-muted-foreground'
          }`}>
            {job.production_status}
          </span>
        </div>
      )}
    </button>
  )
}

type Props = {
  jobs: Job[]
  milestones: string[]
  onCardClick: (job: Job) => void
}

export function JobsBoard({ jobs, milestones, onCardClick }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {milestones.map((milestone) => {
        const columnJobs = jobs.filter((j) => (j.milestone || 'Lead') === milestone)
        const colColor = COLUMN_COLORS[milestone] ?? DEFAULT_COL_COLOR

        return (
          <div key={milestone} className="flex w-72 shrink-0 flex-col gap-3">
            {/* Column header */}
            <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${colColor}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{milestone}</span>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold">
                {columnJobs.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {columnJobs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">No opportunities</p>
                </div>
              ) : (
                columnJobs.map((job, i) => (
                  <BoardCard
                    key={job.id ?? i}
                    job={job}
                    index={i}
                    onClick={() => onCardClick(job)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

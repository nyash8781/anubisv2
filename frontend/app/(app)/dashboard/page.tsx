'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiGet } from '@/lib/api'

type Job = {
  milestone?: string
  price?: string | number
}

function toNum(val?: string | number): number {
  if (!val) return 0
  if (typeof val === 'number') return val
  return parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

const OPEN_MILESTONES = ['Site Visit', 'Proposal', 'Construction']
const ACCENT = '#facc15'
const GRAY = '#374151'
const GREEN = '#22c55e'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 8,
  },
  labelStyle: { color: '#f9fafb', fontWeight: 600 },
  itemStyle: { color: '#facc15' },
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Job[]>('/jobs')
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const metrics = useMemo(() => {
    const leads = jobs.filter((j) => !j.milestone || j.milestone === 'Lead')
    const open = jobs.filter((j) => OPEN_MILESTONES.includes(j.milestone || ''))
    const completed = jobs.filter(
      (j) => (j.milestone || '').toLowerCase() === 'completed',
    )
    const leadRevenue = leads.reduce((s, j) => s + toNum(j.price), 0)
    const openRevenue = open.reduce((s, j) => s + toNum(j.price), 0)
    const completedRevenue = completed.reduce((s, j) => s + toNum(j.price), 0)
    return {
      openLeads: leads.length,
      leadRevenue,
      openRevenue,
      totalRevenue: leadRevenue + openRevenue + completedRevenue,
    }
  }, [jobs])

  const openByMilestone = useMemo(
    () =>
      OPEN_MILESTONES.map((m) => ({
        name: m,
        count: jobs.filter((j) => j.milestone === m).length,
      })),
    [jobs],
  )

  const revenueByMilestone = useMemo(
    () =>
      OPEN_MILESTONES.map((m) => ({
        name: m,
        revenue: jobs
          .filter((j) => j.milestone === m)
          .reduce((s, j) => s + toNum(j.price), 0),
      })),
    [jobs],
  )

  const totalBreakdown = useMemo(
    () => [
      {
        name: 'Leads',
        revenue: jobs
          .filter((j) => !j.milestone || j.milestone === 'Lead')
          .reduce((s, j) => s + toNum(j.price), 0),
      },
      {
        name: 'Open',
        revenue: jobs
          .filter((j) => OPEN_MILESTONES.includes(j.milestone || ''))
          .reduce((s, j) => s + toNum(j.price), 0),
      },
      {
        name: 'Completed',
        revenue: jobs
          .filter((j) => (j.milestone || '').toLowerCase() === 'completed')
          .reduce((s, j) => s + toNum(j.price), 0),
      },
    ],
    [jobs],
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-action">
            Dashboard
          </div>
          <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue and pipeline overview across all opportunities.
          </p>
        </section>

        {/* Metric cards */}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            { label: 'Open Leads', value: String(metrics.openLeads) },
            { label: 'Lead Potential', value: fmt(metrics.leadRevenue) },
            { label: 'Open Revenue', value: fmt(metrics.openRevenue) },
            { label: 'Total Revenue', value: fmt(metrics.totalRevenue) },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-border/40 bg-card p-5"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-2 text-2xl font-bold text-action">{c.value}</div>
            </div>
          ))}
        </section>

        {/* Chart 1 — open projects by milestone */}
        <ChartCard
          title="Open Projects by Milestone"
          subtitle="Active projects across Site Visit, Proposal, and Construction — excludes Leads and Completed"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={openByMilestone} barCategoryGap="35%">
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {openByMilestone.map((_, i) => (
                  <Cell key={i} fill={ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2 — revenue by open milestone */}
        <ChartCard
          title="Revenue by Milestone"
          subtitle="Dollar value sitting in each active bucket — excludes Leads and Completed"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMilestone} barCategoryGap="35%">
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown) => [fmt(v as number), 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {revenueByMilestone.map((_, i) => (
                  <Cell key={i} fill={ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3 — total revenue breakdown */}
        <ChartCard
          title="Total Revenue Breakdown"
          subtitle="All revenue across Leads, active projects, and Completed work"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={totalBreakdown} barCategoryGap="40%">
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown) => [fmt(v as number), 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {totalBreakdown.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? GRAY : i === 1 ? ACCENT : GREEN}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </main>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="mb-1 text-base font-semibold text-white">{title}</div>
      <div className="mb-4 text-xs text-muted-foreground">{subtitle}</div>
      {children}
    </section>
  )
}

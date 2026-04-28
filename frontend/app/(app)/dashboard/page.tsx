'use client'

import Link from 'next/link'
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
import { AlertCircle, RefreshCw } from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { Job } from '@/types/job'
import { OPEN_MILESTONES } from '@/types/job'
import { Skeleton } from '@/components/ui/skeleton'

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

const ACCENT = 'hsl(217 100% 50%)'
const GRAY   = 'hsl(220 9% 75%)'
const GREEN  = 'hsl(142 70% 45%)'
const ORANGE = 'hsl(24 95% 50%)'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid hsl(220 13% 88%)',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  },
  labelStyle: { color: 'hsl(220 13% 18%)', fontWeight: 600 },
  itemStyle: { color: 'hsl(217 100% 50%)' },
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    apiGet<Job[]>('/jobs')
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const metrics = useMemo(() => {
    const leads = jobs.filter((j) => !j.milestone || j.milestone === 'Lead')
    const open = jobs.filter((j) => j.milestone != null && OPEN_MILESTONES.includes(j.milestone))
    const completed = jobs.filter((j) => (j.milestone || '').toLowerCase() === 'completed')
    const leadRevenue = leads.reduce((s, j) => s + toNum(j.price), 0)
    const openRevenue = open.reduce((s, j) => s + toNum(j.price), 0)
    const completedRevenue = completed.reduce((s, j) => s + toNum(j.price), 0)
    return { openLeads: leads.length, leadRevenue, openRevenue, totalRevenue: leadRevenue + openRevenue + completedRevenue }
  }, [jobs])

  const focusItems = useMemo(() => {
    const items: { icon: string; label: string; color: string }[] = []
    const stale = jobs.filter((j) => j.flags?.isStale && j.status !== 'Closed')
    const paymentDue = jobs.filter((j) => {
      const balance = toNum(j.balance_due)
      if (!balance) return false
      const days = j.due_date
        ? Math.ceil((new Date(j.due_date).getTime() - Date.now()) / 86_400_000)
        : null
      return days !== null && days <= 7
    })
    const newLeads = jobs.filter((j) => j.milestone === 'Lead' && j.status !== 'Closed')
    if (stale.length)
      items.push({ icon: '⚡', label: `${stale.length} stale lead${stale.length === 1 ? '' : 's'} need follow-up`, color: 'text-orange-600' })
    if (paymentDue.length)
      items.push({ icon: '💰', label: `${paymentDue.length} payment${paymentDue.length === 1 ? '' : 's'} due within 7 days`, color: 'text-red-600' })
    if (newLeads.length)
      items.push({ icon: '🎯', label: `${newLeads.length} open lead${newLeads.length === 1 ? '' : 's'} ready to advance`, color: 'text-primary' })
    return items
  }, [jobs])

  const openByMilestone = useMemo(
    () => OPEN_MILESTONES.map((m) => ({ name: m, count: jobs.filter((j) => j.milestone === m).length })),
    [jobs],
  )

  const revenueByMilestone = useMemo(
    () => OPEN_MILESTONES.map((m) => ({
      name: m,
      revenue: jobs.filter((j) => j.milestone === m).reduce((s, j) => s + toNum(j.price), 0),
    })),
    [jobs],
  )

  const totalBreakdown = useMemo(
    () => [
      { name: 'Leads', revenue: jobs.filter((j) => !j.milestone || j.milestone === 'Lead').reduce((s, j) => s + toNum(j.price), 0) },
      { name: 'Open', revenue: jobs.filter((j) => j.milestone != null && OPEN_MILESTONES.includes(j.milestone)).reduce((s, j) => s + toNum(j.price), 0) },
      { name: 'Completed', revenue: jobs.filter((j) => (j.milestone || '').toLowerCase() === 'completed').reduce((s, j) => s + toNum(j.price), 0) },
    ],
    [jobs],
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Dashboard</div>
          <h1 className="mt-1 font-display text-3xl font-normal">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue and pipeline overview across all opportunities.</p>
        </section>

        {error && (
          <section className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load dashboard data — check your connection.
            </div>
            <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </section>
        )}

        {/* Metric cards */}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            { label: 'Open Leads', value: String(metrics.openLeads) },
            { label: 'Lead Potential', value: fmt(metrics.leadRevenue) },
            { label: 'Open Revenue', value: fmt(metrics.openRevenue) },
            { label: 'Total Revenue', value: fmt(metrics.totalRevenue) },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-white p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-2 text-2xl font-bold text-primary">{c.value}</div>
            </div>
          ))}
        </section>

        {/* Today's Focus */}
        {!error && jobs.length > 0 && focusItems.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-foreground">Today's Focus</div>
            <div className="space-y-2">
              {focusItems.map((item, i) => (
                <Link
                  key={i}
                  href="/jobs"
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">View →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!error && jobs.length === 0 && (
          <section className="rounded-2xl border-2 border-dashed border-border bg-white p-10 text-center">
            <div className="mx-auto max-w-sm space-y-3">
              <div className="text-lg font-semibold text-foreground">No opportunities yet</div>
              <p className="text-sm text-muted-foreground">Add your first opportunity to start tracking leads, revenue, and follow-ups.</p>
              <Link
                href="/opportunity/new"
                className="inline-block rounded-xl bg-electric px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Add your first opportunity →
              </Link>
            </div>
          </section>
        )}

        {/* Charts */}
        {!error && jobs.length > 0 && (
          <>
            <ChartCard title="Open Projects by Milestone" subtitle="Active projects across Site Visit, Proposal, and Construction — excludes Leads and Completed">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={openByMilestone} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {openByMilestone.map((_, i) => <Cell key={i} fill={ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue by Milestone" subtitle="Dollar value sitting in each active bucket — excludes Leads and Completed">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueByMilestone} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v as number), 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {revenueByMilestone.map((_, i) => <Cell key={i} fill={ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Total Revenue Breakdown" subtitle="All revenue across Leads, active projects, and Completed work">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={totalBreakdown} barCategoryGap="40%">
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v as number), 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {totalBreakdown.map((_, i) => <Cell key={i} fill={i === 0 ? GRAY : i === 1 ? ACCENT : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </main>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-1 text-base font-semibold text-foreground">{title}</div>
      <div className="mb-4 text-xs text-muted-foreground">{subtitle}</div>
      {children}
    </section>
  )
}

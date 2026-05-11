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
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { Job } from '@/types/job'
import { useMilestones } from '@/lib/milestones-context'
import { Skeleton } from '@/components/ui/skeleton'
import { SetupChecklist } from '@/components/onboarding/SetupChecklist'

type UsageData = {
  plan: { name: string; slug: string; priceMonthly: number; startedAt: string } | null;
  usage: Array<{ metricKey: string; used: number; limit: number; percentage: number }>;
  renewalDate: string | null;
};

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

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="flex-1 border-t border-border" />
    </div>
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

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)

  // Dynamic milestones from settings
  const { milestones } = useMilestones()
  const openMilestones = useMemo(
    () => milestones.filter((m) => !m.is_terminal && m.label.toLowerCase() !== 'lead').map((m) => m.label),
    [milestones]
  )
  const terminalMilestones = useMemo(
    () => milestones.filter((m) => m.is_terminal).map((m) => m.label),
    [milestones]
  )
  const chartMilestones = useMemo(
    () => milestones.filter((m) => !m.is_terminal).map((m) => ({ label: m.label, color: m.color })),
    [milestones]
  )

  const load = () => {
    setError(false)
    setLoading(true)
    apiGet<Job[]>('/jobs')
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const loadUsage = () => {
    setUsageLoading(true)
    apiGet<UsageData>('/settings/usage')
      .then((data) => setUsageData(data))
      .catch(() => setUsageData(null))
      .finally(() => setUsageLoading(false))
  }

  useEffect(() => { load(); loadUsage() }, [])

  const metrics = useMemo(() => {
    const leads = jobs.filter((j) => !j.milestone || j.milestone === 'Lead')
    const open = jobs.filter((j) => j.milestone != null && openMilestones.includes(j.milestone))
    const completed = jobs.filter((j) => j.milestone != null && terminalMilestones.includes(j.milestone))
    const leadRevenue = leads.reduce((s, j) => s + toNum(j.price), 0)
    const openRevenue = open.reduce((s, j) => s + toNum(j.price), 0)
    const completedRevenue = completed.reduce((s, j) => s + toNum(j.price), 0)
    const active = jobs.filter((j) => j.status !== 'Draft')
    const conversionRate = active.length > 0 ? Math.round((completed.length / active.length) * 100) : null
    const beyondLead = jobs.filter((j) => j.status !== 'Draft' && j.milestone !== 'Lead' && j.milestone != null)
    const closedWon = jobs.filter((j) => j.milestone != null && (openMilestones.includes(j.milestone) || terminalMilestones.includes(j.milestone)))
    const closeRate = beyondLead.length > 0 ? Math.round((closedWon.length / beyondLead.length) * 100) : null
    const overdue = jobs.filter((j) => {
      const balance = toNum(j.balance_due)
      if (!balance) return false
      const days = j.due_date ? Math.ceil((new Date(j.due_date).getTime() - Date.now()) / 86_400_000) : null
      return days !== null && days < 0
    })
    const blocked = jobs.filter((j) => j.production_status === 'Blocked')
    return {
      openLeads: leads.length, leadRevenue, openRevenue, totalRevenue: leadRevenue + openRevenue + completedRevenue,
      completedRevenue, conversionRate, closeRate, overdueCount: overdue.length, blockedCount: blocked.length,
    }
  }, [jobs, openMilestones, terminalMilestones])

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
    const blocked = jobs.filter((j) => j.production_status === 'Blocked')
    if (blocked.length)
      items.push({ icon: '🚫', label: `${blocked.length} job${blocked.length === 1 ? '' : 's'} blocked in production`, color: 'text-red-600' })
    if (stale.length)
      items.push({ icon: '⚡', label: `${stale.length} stale lead${stale.length === 1 ? '' : 's'} need follow-up`, color: 'text-orange-600' })
    if (paymentDue.length)
      items.push({ icon: '💰', label: `${paymentDue.length} payment${paymentDue.length === 1 ? '' : 's'} due within 7 days`, color: 'text-red-600' })
    if (newLeads.length)
      items.push({ icon: '🎯', label: `${newLeads.length} open lead${newLeads.length === 1 ? '' : 's'} ready to advance`, color: 'text-primary' })
    return items
  }, [jobs])

  const openByMilestone = useMemo(
    () => chartMilestones.map((m) => ({ name: m.label, count: jobs.filter((j) => j.milestone === m.label).length, color: m.color })),
    [jobs, chartMilestones],
  )

  const revenueByMilestone = useMemo(
    () => chartMilestones.map((m) => ({
      name: m.label,
      revenue: jobs.filter((j) => j.milestone === m.label).reduce((s, j) => s + toNum(j.price), 0),
      color: m.color,
    })),
    [jobs, chartMilestones],
  )

  const totalBreakdown = useMemo(
    () => [
      { name: 'Leads', revenue: jobs.filter((j) => !j.milestone || j.milestone === 'Lead').reduce((s, j) => s + toNum(j.price), 0) },
      { name: 'Open', revenue: jobs.filter((j) => j.milestone != null && openMilestones.includes(j.milestone)).reduce((s, j) => s + toNum(j.price), 0) },
      { name: 'Completed', revenue: jobs.filter((j) => j.milestone != null && terminalMilestones.includes(j.milestone)).reduce((s, j) => s + toNum(j.price), 0) },
    ],
    [jobs, openMilestones, terminalMilestones],
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
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

        {/* Page header */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Dashboard</div>
          <h1 className="mt-1 font-display text-3xl font-normal">Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue, pipeline, and performance overview for your job opportunities.</p>
        </section>

        {/* First-run setup checklist (auto-hides when complete or dismissed) */}
        <SetupChecklist />

        {error && (
          <section className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load dashboard data — check your connection.
            </div>
            <button onClick={load} aria-label="Retry loading dashboard data" className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </section>
        )}

        {/* Empty state */}
        {!error && jobs.length === 0 && (
          <section className="rounded-2xl border-2 border-dashed border-border bg-white p-10 text-center">
            <div className="mx-auto max-w-sm space-y-3">
              <div className="text-lg font-semibold text-foreground">No job opportunities yet</div>
              <p className="text-sm text-muted-foreground">Add your first job opportunity to start tracking leads, revenue, and follow-ups.</p>
              <Link
                href="/opportunity/new"
                className="inline-block rounded-xl bg-electric px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Add your first job opportunity →
              </Link>
            </div>
          </section>
        )}

        {!error && jobs.length > 0 && (
          <>
            {/* ── Group 1: Daily Action ──────────────────────────────────────── */}
            <GroupLabel label="Daily Action" />

            {focusItems.length > 0 ? (
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
            ) : (
              <section className="rounded-2xl border border-border bg-white px-5 py-4">
                <p className="text-sm text-muted-foreground">All caught up — no urgent actions right now.</p>
              </section>
            )}

            {/* ── Group 2: Pipeline ─────────────────────────────────────────── */}
            <GroupLabel label="Pipeline" />

            <section className="grid gap-3 md:grid-cols-4">
              {[
                { label: 'Open Leads', value: String(metrics.openLeads) },
                { label: 'Lead Potential', value: fmt(metrics.leadRevenue) },
                { label: 'Open Revenue', value: fmt(metrics.openRevenue) },
                { label: 'Completed Revenue', value: fmt(metrics.completedRevenue) },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-border bg-white p-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
                  <div className="mt-2 text-2xl font-bold text-primary">{c.value}</div>
                </div>
              ))}
            </section>

            {/* AI Usage Counter */}
            {usageLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : usageData && usageData.usage.length > 0 ? (
              <Link href="/settings?tab=usage-plan" className="rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {usageData.usage.find(m => m.metricKey === 'ai_generations') ? (
                        <>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Calls This Month</div>
                          <div className="mt-1 text-sm font-medium text-foreground">
                            {usageData.usage.find(m => m.metricKey === 'ai_generations')?.used || 0} / {usageData.usage.find(m => m.metricKey === 'ai_generations')?.limit || '∞'}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">View Usage</div>
                    <div className="text-sm font-medium text-primary">→</div>
                  </div>
                </div>
              </Link>
            ) : null}

            <ChartCard title="Open Projects by Milestone" subtitle="Active jobs across all non-terminal milestone stages">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={openByMilestone} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {openByMilestone.map((entry, i) => <Cell key={i} fill={entry.color || ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue by Milestone" subtitle="Dollar value sitting in each active stage">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueByMilestone} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220 9% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [fmt(v as number), 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {revenueByMilestone.map((entry, i) => <Cell key={i} fill={entry.color || ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Group 3: Business Performance ────────────────────────────── */}
            <GroupLabel label="Business Performance" />

            <section className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Conversion Rate</div>
                <div className="mt-2 text-2xl font-bold text-primary">
                  {metrics.conversionRate !== null ? `${metrics.conversionRate}%` : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Completed / active jobs</div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Close Rate</div>
                <div className="mt-2 text-2xl font-bold text-primary">
                  {metrics.closeRate !== null ? `${metrics.closeRate}%` : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Construction + Completed / post-lead</div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue Payments</div>
                <div className={`mt-2 text-2xl font-bold ${metrics.overdueCount > 0 ? 'text-red-600' : 'text-primary'}`}>
                  {metrics.overdueCount}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Past due date with balance owed</div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Production Blocked</div>
                <div className={`mt-2 text-2xl font-bold ${metrics.blockedCount > 0 ? 'text-red-600' : 'text-primary'}`}>
                  {metrics.blockedCount}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Jobs with active production blockers</div>
              </div>
            </section>

            <ChartCard title="Total Revenue Breakdown" subtitle="All revenue across Leads, active projects, and Completed work">
              <ResponsiveContainer width="100%" height={260}>
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

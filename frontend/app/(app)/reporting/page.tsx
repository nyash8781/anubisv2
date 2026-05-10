"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart2, TrendingUp, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { useMilestones } from "@/lib/milestones-context";
import type { Job } from "@/types/job";

type DateRange = "30" | "60" | "90" | "all";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ReportingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [milestoneFilter, setMilestoneFilter] = useState("");

  const { milestones } = useMilestones();

  useEffect(() => {
    apiGet<Job[]>("/jobs")
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const cutoff = dateRange === "all" ? null : new Date(Date.now() - Number(dateRange) * 86400000);
    return jobs.filter((j) => {
      if (milestoneFilter && j.milestone !== milestoneFilter) return false;
      if (cutoff) {
        const created = new Date((j as any).created_at ?? 0);
        if (created < cutoff) return false;
      }
      return true;
    });
  }, [jobs, dateRange, milestoneFilter]);

  const stats = useMemo(() => {
    const open = filtered.filter((j) => j.status !== "Closed");
    const closed = filtered.filter((j) => j.status === "Closed");
    const total = filtered.length;
    const totalBid = filtered.reduce((s, j) => s + (Number(j.bid) || 0), 0);
    const closedBid = closed.reduce((s, j) => s + (Number(j.bid) || 0), 0);
    const stale = open.filter((j) => (j as any).is_stale).length;
    const byMilestone = milestones.map((m) => ({
      label: m.label,
      color: m.color,
      count: filtered.filter((j) => j.milestone === m.label).length,
    }));
    const closeRate = total === 0 ? 0 : Math.round((closed.length / total) * 100);

    return { total, open: open.length, closed: closed.length, totalBid, closedBid, stale, byMilestone, closeRate };
  }, [filtered, milestones]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">Reporting</h1>
            <p className="text-muted-foreground mt-1">Pipeline health and revenue metrics.</p>
          </div>
          <BarChart2 className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {([["30", "30d"], ["60", "60d"], ["90", "90d"], ["all", "All"]] as [DateRange, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setDateRange(val)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${dateRange === val ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Milestone</label>
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">All milestones</option>
              {milestones.map((m) => <option key={m.id} value={m.label}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading data…</div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Total Opportunities" value={String(stats.total)} icon={BarChart2} color="bg-blue-50 text-blue-600" />
              <StatCard label="Open" value={String(stats.open)} sub={`${stats.closed} closed`} icon={TrendingUp} color="bg-amber-50 text-amber-600" />
              <StatCard label="Close Rate" value={`${stats.closeRate}%`} icon={CheckCircle} color="bg-green-50 text-green-600" />
              <StatCard label="Pipeline Value" value={fmtMoney(stats.totalBid)} sub="total bid amount" icon={DollarSign} color="bg-purple-50 text-purple-600" />
              <StatCard label="Won Revenue" value={fmtMoney(stats.closedBid)} sub="from closed opps" icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="Stale Leads" value={String(stats.stale)} sub="need attention" icon={AlertTriangle} color={stats.stale > 0 ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"} />
            </div>

            {/* Pipeline breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">Pipeline Breakdown by Milestone</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {stats.byMilestone.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones configured.</p>
                ) : stats.byMilestone.map((m) => (
                  <MilestoneBar key={m.label} label={m.label} count={m.count} total={stats.total} color={m.color} />
                ))}
              </CardContent>
            </Card>

            {/* Recent closed opportunities */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">Recently Closed</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.filter((j) => j.status === "Closed").length === 0 ? (
                  <div className="px-5 py-6 text-sm text-muted-foreground">No closed opportunities in this period.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filtered
                      .filter((j) => j.status === "Closed")
                      .slice(0, 10)
                      .map((j) => (
                        <div key={j.id} className="flex items-center gap-3 px-5 py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{j.customer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{j.service || j.scope_of_work || "—"}</p>
                          </div>
                          {j.bid != null && (
                            <span className="text-sm font-semibold text-green-700 shrink-0">{fmtMoney(Number(j.bid))}</span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stale leads list */}
            {stats.stale > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Stale Leads Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filtered
                      .filter((j) => (j as any).is_stale && j.status !== "Closed")
                      .slice(0, 10)
                      .map((j) => (
                        <div key={j.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{j.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{j.milestone} · last contact {(j as any).days_since_contact ?? "?"} days ago</p>
                          </div>
                          <a href={`/opportunity/${j.id}`} className="text-xs text-primary hover:underline shrink-0">
                            Open →
                          </a>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

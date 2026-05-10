"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, RefreshCw, LayoutList, Columns3 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import type { Job } from "@/types/job";
import { Skeleton } from "@/components/ui/skeleton";
import { JobsBoard } from "@/components/jobs/JobsBoard";
import { OpportunityPreviewPanel } from "@/components/jobs/OpportunityPreviewPanel";
import { useMilestones } from "@/lib/milestones-context";

function displayName(job: Job) {
  const first = (job.first_name || "").trim();
  const last = (job.last_name || "").trim();
  if (first || last) return { first: first || "—", last: last || "—" };
  const name = (job.customer_name || "").trim();
  if (!name) return { first: "N/A", last: "N/A" };
  const parts = name.split(/\s+/);
  return { first: parts[0] || "N/A", last: parts.slice(1).join(" ") || "—" };
}

function fallbackOpportunityId(job: Job, index: number) {
  if (job.opportunity_id) return job.opportunity_id;
  const created = job.created_at ? new Date(job.created_at) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, "0");
  const dd = String(created.getDate()).padStart(2, "0");
  const seq = String(index + 1).padStart(4, "0");
  return `${yy}${mm}${dd}${seq}`;
}

export default function Home() {
  const { milestoneLabels } = useMilestones();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'table' | 'board'>('table');
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [milestoneFilter, setMilestoneFilter] = useState("All");
  const [showStaleOnly, setShowStaleOnly] = useState(false);

  const loadJobs = async () => {
    setError(false);
    try {
      const data = await apiGet<Job[]>("/jobs");
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const summary = useMemo(() => {
    const total = jobs.length;
    const contacted = jobs.filter((j) => (j.contact_status || j.status) === "Contacted").length;
    const completed = jobs.filter((j) => (j.milestone || "").toLowerCase() === "completed").length;
    const stale = jobs.filter((j) => j.flags?.isStale).length;
    return { total, contacted, completed, stale };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job, index) => {
      const opportunityId = fallbackOpportunityId(job, index).toLowerCase();
      const fullName = `${job.first_name || ""} ${job.last_name || ""} ${job.customer_name || ""}`.toLowerCase().trim();
      const matchesSearch = !search || fullName.includes(search.toLowerCase()) || opportunityId.includes(search.toLowerCase());
      const jobStatus = String(job.status || job.contact_status || "New");
      const matchesStatus = statusFilter === "All" || jobStatus === statusFilter;
      const jobMilestone = String(job.milestone || "Lead");
      const matchesMilestone = milestoneFilter === "All" || jobMilestone === milestoneFilter;
      const matchesStale = !showStaleOnly || !!job.flags?.isStale;
      return matchesSearch && matchesStatus && matchesMilestone && matchesStale;
    });
  }, [jobs, search, statusFilter, milestoneFilter, showStaleOnly]);

  const toggleExpanded = (id?: number) => {
    if (!id) return;
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const ACTION_LABELS: Record<string, string> = { phone: "Phone call", email: "Email", text: "Text" };

  const runAction = async (id: number | undefined, type: "phone" | "email" | "text") => {
    if (!id) return;
    const mappedType = type === "phone" ? "call" : type;
    const toastId = toast.loading(`Logging ${ACTION_LABELS[type]}…`);
    try {
      await apiPost(`/jobs/${id}/action`, { type: mappedType });
      await loadJobs();
      toast.success(`${ACTION_LABELS[type]} logged`, { id: toastId });
    } catch {
      toast.error(`Failed to log ${ACTION_LABELS[type]}`, { id: toastId });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setMilestoneFilter("All");
    setShowStaleOnly(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Opportunities</div>
                <h1 className="mt-1 font-display text-3xl font-normal">Opportunities</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage your pipeline across table and board views.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              {/* View toggle */}
              <div className="flex rounded-xl border border-border bg-muted/20 p-0.5">
                <button
                  onClick={() => setView('table')}
                  aria-label="Table view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    view === 'table' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" /> Table
                </button>
                <button
                  onClick={() => setView('board')}
                  aria-label="Board view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    view === 'board' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Columns3 className="h-3.5 w-3.5" /> Board
                </button>
              </div>
              <Link href="/opportunity/new" className="rounded-xl bg-electric px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
                New Opportunity
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              { label: "Total", value: summary.total },
              { label: "Contacted", value: summary.contacted },
              { label: "Completed", value: summary.completed },
              { label: "Stale", value: summary.stale },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
                <div className="mt-2 text-2xl font-bold text-primary">{c.value}</div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <section className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load opportunities — check your connection.
            </div>
            <button onClick={loadJobs} aria-label="Retry loading opportunities" className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </section>
        )}

        {/* ── Board view ─────────────────────────────────────────────────────── */}
        {view === 'board' && (
          <section className="rounded-2xl border border-border bg-white p-5">
            <JobsBoard
              jobs={filteredJobs}
              milestones={milestoneLabels}
              onCardClick={(job) => setPreviewJob(job)}
            />
          </section>
        )}

        {/* ── Table view ─────────────────────────────────────────────────────── */}
        {view === 'table' && (<>
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or opportunity ID"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring lg:max-w-md"
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none"
            >
              <option>All</option>
              <option>Draft</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Closed</option>
            </select>

            <select
              aria-label="Filter by milestone"
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none"
            >
              <option>All</option>
              <option>Lead</option>
              <option>Site Visit</option>
              <option>Proposal</option>
              <option>Construction</option>
              <option>Completed</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showStaleOnly}
                onChange={(e) => setShowStaleOnly(e.target.checked)}
              />
              Show stale only
            </label>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Opportunity ID</th>
                  <th className="px-4 py-3 font-semibold">First Name</th>
                  <th className="px-4 py-3 font-semibold">Last Name</th>
                  <th className="px-4 py-3 font-semibold">Milestone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Production</th>
                  <th className="px-4 py-3 font-semibold">Last Contact</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                  <th className="px-4 py-3 font-semibold">Profile</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                        <div className="text-3xl">🔍</div>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            {jobs.length === 0
                              ? "No opportunities yet"
                              : "No opportunities match your filters"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {jobs.length === 0
                              ? "Create your first opportunity to start tracking leads."
                              : `${jobs.length} total opportunit${jobs.length === 1 ? "y" : "ies"} — try adjusting your filters.`}
                          </p>
                        </div>
                        {jobs.length === 0 ? (
                          <Link
                            href="/opportunity/new"
                            className="rounded-xl bg-electric px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                          >
                            Add your first opportunity →
                          </Link>
                        ) : (
                          <button
                            onClick={clearFilters}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, index) => {
                    const name = displayName(job);
                    const isExpanded = expandedId === job.id;
                    const isDraft = String(job.status || "").toLowerCase() === "draft";
                    const lastContactText = job.last_contacted_date || "N/A";
                    const lastMethodText = job.last_contact_method || "";

                    return (
                      <React.Fragment key={job.id ?? index}>
                        <tr className="border-b border-border align-top text-sm text-foreground transition hover:bg-muted/30">
                          <td className="px-4 py-4 font-semibold text-primary">
                            {fallbackOpportunityId(job, index)}
                          </td>

                          <td className="px-4 py-4">
                            <button onClick={() => toggleExpanded(job.id)} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${name.first} ${name.last}`} aria-expanded={isExpanded} className="text-left font-semibold text-foreground transition hover:text-primary">
                              {name.first}
                            </button>
                          </td>

                          <td className="px-4 py-4 font-semibold text-foreground">{name.last}</td>

                          <td className="px-4 py-4">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {job.milestone || "Lead"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                                {job.status || job.contact_status || "New"}
                              </span>
                              {job.flags?.isAged ? (
                                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-xs font-semibold text-orange-600">
                                  {job.flags.agedType || "Aged"}
                                </span>
                              ) : job.flags?.isStale ? (
                                <span className="rounded-full border border-orange-300/30 bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-500">
                                  Stale
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {job.production_status ? (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                job.production_status === 'Blocked'
                                  ? 'border border-red-300/50 bg-red-100 text-red-700'
                                  : job.production_status === 'Complete'
                                  ? 'border border-green-300/50 bg-green-100 text-green-700'
                                  : 'border border-border bg-muted/40 text-foreground'
                              }`}>
                                {job.production_status}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-foreground">
                            <div>{lastContactText}</div>
                            {lastMethodText ? <div className="mt-1 text-xs text-muted-foreground">{lastMethodText}</div> : null}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {(["phone", "email", "text"] as const).map((type) => (
                                <button
                                  key={type}
                                  disabled={isDraft}
                                  onClick={() => runAction(job.id, type)}
                                  aria-label={`Log ${type} contact for ${name.first} ${name.last}`}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition capitalize ${
                                    isDraft
                                      ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                                      : "border-border text-foreground hover:border-primary hover:text-primary"
                                  }`}
                                >
                                  {type === "phone" ? "Phone" : type === "email" ? "Email" : "Text"}
                                </button>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewJob(job)}
                                aria-label={`Preview ${name.first} ${name.last}`}
                                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                              >
                                Preview
                              </button>
                              <Link href={`/opportunity/${job.id}`} className="rounded-lg bg-electric px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90">
                                Open
                              </Link>
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-b border-border bg-muted/20">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="rounded-xl border border-border bg-white p-4">
                                <div className="grid gap-3 text-sm md:grid-cols-3">
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                                    <div className="font-semibold text-foreground">{job.email || "N/A"}</div>
                                  </div>
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Phone</div>
                                    <div className="font-semibold text-foreground">{job.phone || "N/A"}</div>
                                  </div>
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Address</div>
                                    <div className="font-semibold text-foreground">
                                      {[job.address, job.city, job.state, job.zip_code].filter(Boolean).join(", ") || "N/A"}
                                    </div>
                                  </div>
                                </div>
              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        </>)}

        {/* ── Preview panel (board + table) ──────────────────────────────────── */}
        <OpportunityPreviewPanel
          job={previewJob}
          open={previewJob !== null}
          onClose={() => setPreviewJob(null)}
          onLogCall={async () => { if (previewJob?.id) { await runAction(previewJob.id, "phone"); setPreviewJob(null); } }}
          onLogEmail={async () => { if (previewJob?.id) { await runAction(previewJob.id, "email"); setPreviewJob(null); } }}
          onLogText={async () => { if (previewJob?.id) { await runAction(previewJob.id, "text"); setPreviewJob(null); } }}
        />
      </div>
    </main>
  );
}

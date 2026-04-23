"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Job = {
  id?: number;
  opportunity_id?: string;
  customer_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  service?: string;
  price?: string | number;
  notes?: string;
  milestone?: string;
  status?: string;
  contact_status?: string;
  last_contacted_date?: string;
  last_contact_method?: string;
  created_at?: string;
  flags?: {
    isStale?: boolean;
    isAged?: boolean;
    agedType?: string;
  };
};

/**
 * Prefer structured first/last fields. Only split customer_name as a fallback.
 * Fixes P3-01 from the initial review.
 */
function displayName(job: Job) {
  const first = (job.first_name || "").trim();
  const last = (job.last_name || "").trim();
  if (first || last) {
    return { first: first || "—", last: last || "—" };
  }
  const name = (job.customer_name || "").trim();
  if (!name) return { first: "N/A", last: "N/A" };
  const parts = name.split(/\s+/);
  return {
    first: parts[0] || "N/A",
    last: parts.slice(1).join(" ") || "—",
  };
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [milestoneFilter, setMilestoneFilter] = useState("All");
  const [showStaleOnly, setShowStaleOnly] = useState(false);

  const loadJobs = async () => {
    try {
      const data = await apiGet<Job[]>("/jobs");
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setJobs([]);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const summary = useMemo(() => {
    const total = jobs.length;
    const contacted = jobs.filter(
      (j) => (j.contact_status || j.status) === "Contacted"
    ).length;
    const completed = jobs.filter(
      (j) => (j.milestone || "").toLowerCase() === "completed"
    ).length;
    const stale = jobs.filter((j) => j.flags?.isStale).length;
    return { total, contacted, completed, stale };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job, index) => {
      const opportunityId = fallbackOpportunityId(job, index).toLowerCase();
      const fullName = `${job.first_name || ""} ${job.last_name || ""} ${
        job.customer_name || ""
      }`
        .toLowerCase()
        .trim();
      const matchesSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        opportunityId.includes(search.toLowerCase());

      const jobStatus = String(job.status || job.contact_status || "New");
      const matchesStatus = statusFilter === "All" || jobStatus === statusFilter;

      const jobMilestone = String(job.milestone || "Lead");
      const matchesMilestone =
        milestoneFilter === "All" || jobMilestone === milestoneFilter;

      const matchesStale = !showStaleOnly || !!job.flags?.isStale;

      return matchesSearch && matchesStatus && matchesMilestone && matchesStale;
    });
  }, [jobs, search, statusFilter, milestoneFilter, showStaleOnly]);

  const toggleExpanded = (id?: number) => {
    if (!id) return;
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const runAction = async (
    id: number | undefined,
    type: "phone" | "email" | "text"
  ) => {
    if (!id) return;
    const mappedType = type === "phone" ? "call" : type;
    try {
      await apiPost(`/jobs/${id}/action`, { type: mappedType });
      await loadJobs();
    } catch (error) {
      console.error(error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setMilestoneFilter("All");
    setShowStaleOnly(false);
  };

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-action">
                  Jobs
                </div>
                <h1 className="mt-1 text-3xl font-bold">Opportunities</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Table-first opportunity management with fast actions.
                </p>
              </div>
            </div>

            <Link
              href="/opportunity/new"
              className="self-start rounded-xl bg-action px-4 py-2 text-sm font-bold ext-action-foreground transition hover:bg-yellow-300"
            >
              New Opportunity
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/40 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Total
              </div>
              <div className="mt-2 text-2xl font-bold text-action">
                {summary.total}
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Contacted
              </div>
              <div className="mt-2 text-2xl font-bold text-action">
                {summary.contacted}
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Completed
              </div>
              <div className="mt-2 text-2xl font-bold text-action">
                {summary.completed}
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Stale
              </div>
              <div className="mt-2 text-2xl font-bold text-action">
                {summary.stale}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or opportunity ID"
              className="w-full rounded-xl border border-border/40 bg-muted/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 lg:max-w-md"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border/40 bg-muted/40 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option>All</option>
              <option>Draft</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Closed</option>
            </select>

            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="rounded-xl border border-border/40 bg-muted/40 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option>All</option>
              <option>Lead</option>
              <option>Site Visit</option>
              <option>Proposal</option>
              <option>Construction</option>
              <option>Completed</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showStaleOnly}
                onChange={(e) => setShowStaleOnly(e.target.checked)}
              />
              Show stale only
            </label>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-border/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Opportunity ID</th>
                  <th className="px-4 py-3 font-semibold">First Name</th>
                  <th className="px-4 py-3 font-semibold">Last Name</th>
                  <th className="px-4 py-3 font-semibold">Milestone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Contact</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                  <th className="px-4 py-3 font-semibold">Profile</th>
                </tr>
              </thead>

              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No opportunities match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, index) => {
                    const name = displayName(job);
                    const isExpanded = expandedId === job.id;
                    const isDraft =
                      String(job.status || "").toLowerCase() === "draft";
                    const lastContactText = job.last_contacted_date || "N/A";
                    const lastMethodText = job.last_contact_method || "";

                    // P1-03 fix: React.Fragment with key (not bare <>).
                    return (
                      <React.Fragment key={job.id ?? index}>
                        <tr className="border-b border-border/40 align-top text-sm text-white transition hover:bg-white/5">
                          <td className="px-4 py-4 font-semibold text-action">
                            {fallbackOpportunityId(job, index)}
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleExpanded(job.id)}
                              className="text-left font-semibold text-white transition hover:text-action"
                            >
                              {name.first}
                            </button>
                          </td>

                          <td className="px-4 py-4 font-semibold text-white">
                            {name.last}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full border border-yellow-400/30 bg-action/10 px-2.5 py-1 text-xs font-semibold text-action">
                              {job.milestone || "Lead"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-border/40 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
                                {job.status || job.contact_status || "New"}
                              </span>
                              {job.flags?.isAged ? (
                                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
                                  {job.flags.agedType || "Aged"}
                                </span>
                              ) : job.flags?.isStale ? (
                                <span className="rounded-full border border-yellow-400/30 bg-action/10 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                                  Stale
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div>{lastContactText}</div>
                            {lastMethodText ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {lastMethodText}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                disabled={isDraft}
                                onClick={() => runAction(job.id, "phone")}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                  isDraft
                                    ? "cursor-not-allowed border-white/5 text-gray-600"
                                    : "border-border/40 text-white hover:border-yellow-400 hover:text-action"
                                }`}
                              >
                                Phone
                              </button>
                              <button
                                disabled={isDraft}
                                onClick={() => runAction(job.id, "email")}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                  isDraft
                                    ? "cursor-not-allowed border-white/5 text-gray-600"
                                    : "border-border/40 text-white hover:border-yellow-400 hover:text-action"
                                }`}
                              >
                                Email
                              </button>
                              <button
                                disabled={isDraft}
                                onClick={() => runAction(job.id, "text")}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                  isDraft
                                    ? "cursor-not-allowed border-white/5 text-gray-600"
                                    : "border-border/40 text-white hover:border-yellow-400 hover:text-action"
                                }`}
                              >
                                Text
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Link
                              href={`/opportunity/${job.id}`}
                              className="rounded-lg bg-action px-3 py-2 text-xs font-bold ext-action-foreground transition hover:bg-yellow-300"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-b border-border/40 bg-black/20">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="rounded-xl border border-border/40 bg-muted/40 p-4">
                                <div className="grid gap-3 text-sm md:grid-cols-3">
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                                      Email
                                    </div>
                                    <div className="font-semibold text-white">
                                      {job.email || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                                      Phone
                                    </div>
                                    <div className="font-semibold text-white">
                                      {job.phone || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                                      Address
                                    </div>
                                    <div className="font-semibold text-white">
                                      {[
                                        job.address,
                                        job.city,
                                        job.state,
                                        job.zip_code,
                                      ]
                                        .filter(Boolean)
                                        .join(", ") || "N/A"}
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
      </div>
    </main>
  );
}

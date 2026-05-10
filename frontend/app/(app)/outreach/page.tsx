"use client";

import { useEffect, useState, useMemo } from "react";
import { Send, Mail, MessageSquare, CheckSquare, Square, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/api";
import { useMilestones } from "@/lib/milestones-context";
import { toast } from "sonner";
import type { Job } from "@/types/job";

type Channel = "email" | "sms";

type GeneratedMessage = {
  job_id: number;
  customer_name: string;
  message: string | null;
  error?: string;
  to?: string;
};

export default function OutreachPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [channel, setChannel] = useState<Channel>("email");
  const [campaignContext, setCampaignContext] = useState("");
  const [milestoneFilter, setMilestoneFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generated, setGenerated] = useState<GeneratedMessage[]>([]);
  const [step, setStep] = useState<"select" | "preview" | "sent">("select");

  const { milestoneLabels } = useMilestones();

  useEffect(() => {
    apiGet<Job[]>("/jobs")
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load opportunities."))
      .finally(() => setJobsLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.status === "Closed") return false;
      if (milestoneFilter && j.milestone !== milestoneFilter) return false;
      return true;
    });
  }, [jobs, milestoneFilter]);

  function toggleJob(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map((j) => j.id ?? 0)));
    }
  }

  async function generate() {
    if (selectedIds.size === 0) {
      toast.error("Select at least one opportunity.");
      return;
    }
    setGenerating(true);
    try {
      const result = await apiPost<{ channel: Channel; messages: GeneratedMessage[] }>(
        "/outreach/generate",
        { job_ids: Array.from(selectedIds), channel, context: campaignContext || undefined }
      );
      const msgs = result.messages.map((m) => {
        const job = jobs.find((j) => j.id === m.job_id);
        return {
          ...m,
          to: channel === "email"
            ? (job as any)?.email ?? ""
            : (job as any)?.phone ?? "",
        };
      });
      setGenerated(msgs);
      setStep("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    const toSend = generated
      .filter((m) => m.message)
      .map((m) => ({ job_id: m.job_id, to: m.to, message: m.message! }));

    if (toSend.some((m) => !m.to)) {
      const missing = toSend.filter((m) => !m.to).length;
      toast.error(`${missing} message(s) are missing a ${channel === "email" ? "email address" : "phone number"}. Update the opportunity first.`);
      return;
    }

    setSending(true);
    try {
      await apiPost("/outreach/send", { messages: toSend, channel });
      toast.success(`Sent ${toSend.length} ${channel} message${toSend.length !== 1 ? "s" : ""}.`);
      setStep("sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Send failed";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSelectedIds(new Set());
    setGenerated([]);
    setStep("select");
    setCampaignContext("");
  }

  const allSelected = filteredJobs.length > 0 && selectedIds.size === filteredJobs.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">Outreach</h1>
            <p className="text-muted-foreground mt-1">Generate and send personalized campaign messages via email or SMS.</p>
          </div>
          {step !== "select" && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition">
              <RefreshCw className="h-4 w-4" />
              New Campaign
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {(["select", "preview", "sent"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <span className={`px-3 py-1 rounded-full font-medium ${step === s ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Select leads */}
        {step === "select" && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Milestone</label>
                <select
                  value={milestoneFilter}
                  onChange={(e) => setMilestoneFilter(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All open milestones</option>
                  {milestoneLabels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Channel</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setChannel("email")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${channel === "email" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setChannel("sms")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${channel === "sms" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-48 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Campaign context (optional)</label>
                <input
                  value={campaignContext}
                  onChange={(e) => setCampaignContext(e.target.value)}
                  placeholder="e.g. Following up after spring storm season"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Lead table */}
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Select Leads ({selectedIds.size} selected)
                </CardTitle>
                <button onClick={toggleAll} className="text-xs text-muted-foreground hover:text-foreground transition">
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {jobsLoading ? (
                  <div className="px-5 py-8 text-sm text-muted-foreground">Loading opportunities…</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-muted-foreground">No open opportunities match the filter.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredJobs.map((job) => {
                      const jobId = job.id ?? 0;
                      const checked = selectedIds.has(jobId);
                      return (
                        <button
                          key={jobId}
                          onClick={() => toggleJob(jobId)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${checked ? "bg-primary/5" : "hover:bg-muted/40"}`}
                        >
                          {checked
                            ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                            : <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{job.customer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.service || job.scope_of_work || "—"}</p>
                          </div>
                          <Badge className="text-xs shrink-0 bg-muted text-muted-foreground hover:bg-muted">
                            {job.milestone}
                          </Badge>
                          <span className="text-xs text-muted-foreground shrink-0 font-mono">{job.opportunity_id}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <button
                onClick={generate}
                disabled={generating || selectedIds.size === 0}
                className="flex items-center gap-2 rounded-xl bg-electric px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {generating ? "Generating…" : `Generate ${channel === "email" ? "Emails" : "SMS"} (${selectedIds.size})`}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview generated messages */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review each AI-generated message below. Add the recipient {channel === "email" ? "email" : "phone"} if missing, then send.
            </p>
            {generated.map((m, i) => (
              <Card key={m.job_id} className={m.error ? "border-red-300" : ""}>
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{m.customer_name}</CardTitle>
                    {m.error && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Generation failed</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {channel === "email" ? "To (email address)" : "To (phone number)"}
                    </label>
                    <input
                      value={m.to ?? ""}
                      onChange={(e) => setGenerated((prev) => prev.map((x, j) => j === i ? { ...x, to: e.target.value } : x))}
                      type={channel === "email" ? "email" : "tel"}
                      placeholder={channel === "email" ? "customer@email.com" : "+16025550100"}
                      className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  {m.message ? (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Message</label>
                      <textarea
                        value={m.message}
                        onChange={(e) => setGenerated((prev) => prev.map((x, j) => j === i ? { ...x, message: e.target.value } : x))}
                        rows={channel === "sms" ? 3 : 8}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
                      />
                      {channel === "sms" && (
                        <p className={`text-xs ${(m.message?.length ?? 0) > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {m.message?.length ?? 0} / 160 chars
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">{m.error ?? "No message generated."}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStep("select")} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition">
                Back
              </button>
              <button
                onClick={send}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-electric px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending…" : `Send ${generated.filter((m) => m.message).length} Messages`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sent confirmation */}
        {step === "sent" && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Campaign sent!</p>
                <p className="text-sm text-green-700 mt-1">
                  {generated.filter((m) => m.message).length} {channel} message{generated.filter((m) => m.message).length !== 1 ? "s" : ""} delivered. Contact actions have been logged on each opportunity.
                </p>
              </div>
              <button onClick={reset} className="rounded-xl border border-green-400 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 transition">
                Start New Campaign
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

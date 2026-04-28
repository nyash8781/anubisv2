"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Phone, MessageSquare, Mail, Sparkles, Save, Pin, CheckCircle2,
  DollarSign, NotebookPen, Plus, Trash2, X,
} from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Job } from "@/types/job";
import { MILESTONE_ORDER } from "@/types/job";
import { Skeleton } from "@/components/ui/skeleton";
import { AIAssistantHub } from "@/components/opportunity/AIAssistantHub";
import { InstallmentTracker } from "@/components/opportunity/InstallmentTracker";
import { ActivityTimeline } from "@/components/opportunity/ActivityTimeline";
import { DocumentsSection } from "@/components/opportunity/DocumentsSection";
import { fmtMoney, fmtDate } from "@/components/opportunity/utils";

// ─── Local UI Types ───────────────────────────────────────────────────────────

type UiMessage = { type: "success" | "error" | "info"; text: string } | null;
type RiskLevel = "On Track" | "At Risk" | "Urgent";
type NBAAction = {
  label: string;
  description: string;
  action: "call" | "text" | "email" | "manual" | "completed" | null;
} | null;
type ActionType = "email" | "text" | "call" | "manual" | "completed";
type Task = { id: string; text: string; done: boolean };

// ─── Constants ────────────────────────────────────────────────────────────────

const blankJob: Job = {
  first_name: "", last_name: "", email: "",
  mobile_number_1: "", mobile_number_2: "",
  address_1: "", city: "", state: "", zip_code: "",
  service: "", scope_of_work: "",
  bid: "", payments_received: "", balance_due: "", due_date: "",
  notes: "", milestone: "Lead", status: "Draft",
  generated_follow_up: "", generated_upsell: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fallbackOpportunityId(job?: Job) {
  if (!job) return "";
  if (job.opportunity_id) return job.opportunity_id;
  const created = job.created_at ? new Date(job.created_at) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, "0");
  const dd = String(created.getDate()).padStart(2, "0");
  const seq = String(job.id || 1).padStart(4, "0");
  return `${yy}${mm}${dd}${seq}`;
}

function titleFromJob(job: Job) {
  const first = job.first_name?.trim() || "";
  const last = job.last_name?.trim() || "";
  const full = `${first} ${last}`.trim();
  return full || job.customer_name || "New Opportunity";
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function computeRisk(job: Job): RiskLevel {
  const days = daysUntil(job.due_date);
  const balance = Number(job.balance_due) || 0;
  const lastContact = daysSince(job.last_contacted_date);
  if (balance > 0 && days !== null && days < 0) return "Urgent";
  if (balance > 0 && days !== null && days <= 2) return "Urgent";
  if (lastContact !== null && lastContact > 7) return "At Risk";
  if (balance > 0 && days !== null && days <= 7) return "At Risk";
  return "On Track";
}

function computeNBA(job: Job): NBAAction {
  const days = daysUntil(job.due_date);
  const balance = Number(job.balance_due) || 0;
  const lastContact = daysSince(job.last_contacted_date);
  if (balance > 0 && days !== null && days < 0)
    return { label: "Send payment reminder", description: `Payment overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, action: "email" };
  if (balance > 0 && days !== null && days <= 3)
    return { label: "Request payment", description: `Due in ${days} day${days === 1 ? "" : "s"}`, action: "email" };
  if (lastContact !== null && lastContact > 5)
    return { label: "Follow up with client", description: `Last contacted ${lastContact} days ago`, action: "call" };
  if (job.milestone === "Lead")
    return { label: "Schedule site visit", description: "Move this lead to the next stage", action: "call" };
  if (job.milestone === "Site Visit")
    return { label: "Send proposal", description: "Follow up after site visit", action: "email" };
  if (job.milestone === "Proposal")
    return { label: "Follow up on proposal", description: "Check in with client on proposal status", action: "call" };
  if (job.milestone === "Construction")
    return { label: "Check in on progress", description: "Update client on project status", action: "text" };
  return null;
}

function computeProgress(job: Job): { pct: number; paidLabel: string; totalLabel: string } {
  const bid = Number(job.bid || job.price) || 0;
  const paid = Number(job.payments_received) || 0;
  const pct = bid === 0 ? 0 : Math.min(100, Math.round((paid / bid) * 100));
  return { pct, paidLabel: fmtMoney(paid), totalLabel: fmtMoney(bid) };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    "On Track": "border-green-500/30 bg-green-50 text-green-700",
    "At Risk": "border-orange-400/30 bg-orange-50 text-orange-600",
    "Urgent": "border-red-500/30 bg-red-50 text-red-700",
  };
  const dots: Record<RiskLevel, string> = {
    "On Track": "bg-green-500",
    "At Risk": "bg-orange-400",
    "Urgent": "bg-red-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[level]}`} />
      {level}
    </span>
  );
}

function InputField({
  label, value, onChange, placeholder = "", type = "text",
}: {
  label: string;
  value?: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
      />
    </label>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title, icon, children, defaultOpen = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-border bg-white shadow-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/20 rounded-2xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <span className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && <div className="border-t border-border px-5 pb-5 pt-4">{children}</div>}
    </section>
  );
}

function Toast({ message, onDismiss }: { message: UiMessage; onDismiss: () => void }) {
  if (!message) return null;
  const styles = {
    success: "border-green-500/30 bg-green-50 text-green-700",
    error: "border-red-500/30 bg-red-50 text-red-700",
    info: "border-primary/30 bg-primary/5 text-primary",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${styles[message.type]}`}>
      <span>{message.text}</span>
      <button onClick={onDismiss} className="ml-4 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Task List ────────────────────────────────────────────────────────────────

function TaskListCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setTasks((prev) => [...prev, { id, text, done: false }]);
    setInput("");
  };

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{done} of {tasks.length} complete</span>
          {done === tasks.length && tasks.length > 0 && (
            <span className="font-semibold text-green-600">All done!</span>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task and press Enter…"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <button
          onClick={addTask}
          className="flex items-center gap-1 rounded-xl bg-electric px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tasks — add one above to track action items.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                t.done ? "border-green-500/20 bg-green-50/50" : "border-border bg-muted/10"
              }`}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="h-4 w-4 cursor-pointer accent-blue-600"
              />
              <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {t.text}
              </span>
              <button
                onClick={() => deleteTask(t.id)}
                className="text-muted-foreground opacity-40 transition hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────

function NoteModal({
  current,
  onClose,
  onSave,
}: {
  current: string;
  onClose: () => void;
  onSave: (updated: string) => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) { onClose(); return; }
    const ts = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const entry = `[${ts}] ${trimmed}`;
    onSave(current ? `${current}\n\n${entry}` : entry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Add Note</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Enter note — will be timestamped and appended to internal notes…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpportunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [job, setJob] = useState<Job>(blankJob);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<UiMessage>(null);
  const [dirty, setDirty] = useState(false);
  const [nbaDismissed, setNbaDismissed] = useState(false);
  const [nbaSnoozedUntil, setNbaSnoozedUntil] = useState<number | null>(null);
  const [overviewTab, setOverviewTab] = useState("Info");
  const [aiTab, setAiTab] = useState("Email");
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const applyJob = useCallback((data: Job) => {
    const merged: Job = { ...blankJob, ...data };
    if (!merged.first_name && merged.customer_name) {
      const parts = merged.customer_name.split(" ");
      merged.first_name = parts.shift() || "";
      merged.last_name = parts.join(" ");
    }
    if (!merged.address_1 && merged.address) merged.address_1 = merged.address;
    if (!merged.mobile_number_1 && merged.phone) merged.mobile_number_1 = merged.phone;
    setJob(merged);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id || id === "new") {
        if (active) { setJob(blankJob); setLoading(false); }
        return;
      }
      try {
        const data = await apiGet<Job>(`/jobs/${id}`);
        if (active) applyJob(data || blankJob);
      } catch (error) {
        console.error(error);
        if (active) setMessage({ type: "error", text: "Failed to load opportunity." });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, applyJob]);

  const setField = (field: keyof Job, value: string) => {
    setJob((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "first_name" || field === "last_name")
        next.customer_name = `${next.first_name || ""} ${next.last_name || ""}`.trim();
      if (field === "address_1") next.address = value;
      if (field === "mobile_number_1") next.phone = value;
      return next;
    });
    setDirty(true);
  };

  const saveJob = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const payload: Job = {
        ...job,
        customer_name: `${job.first_name || ""} ${job.last_name || ""}`.trim(),
        address: job.address_1,
        phone: job.mobile_number_1,
      };
      const isNew = !job.id;
      const data = isNew
        ? await apiPost<Job>("/jobs", payload)
        : await apiPut<Job>(`/jobs/${job.id}`, payload);
      applyJob(data);
      setMessage({ type: "success", text: "Saved successfully." });
      if (isNew && data?.id) router.replace(`/opportunity/${data.id}`);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save — try again." });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (type: ActionType) => {
    if (!job.id) {
      setMessage({ type: "info", text: "Save before logging a contact action." });
      return;
    }
    try {
      const data = await apiPost<Job>(`/jobs/${job.id}/action`, { type });
      applyJob(data);
      const labels: Record<string, string> = {
        email: "Email", text: "Text", call: "Phone Call",
        manual: "Contact", completed: "Completion",
      };
      setMessage({ type: "success", text: `${labels[type] ?? type} logged.` });
      setNbaDismissed(false);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Action failed." });
    }
  };

  const generateAi = async () => {
    if (!job.scope_of_work?.trim() && !job.service?.trim()) {
      setMessage({ type: "info", text: "Add service or scope of work first." });
      return;
    }
    try {
      setGenerating(true);
      setMessage(null);
      const data = await apiPost<{ followUp: string; upsell: string }>("/generate-job-insights", {
        service: job.service,
        scope_of_work: job.scope_of_work,
        first_name: job.first_name,
        last_name: job.last_name,
        customer_name: job.customer_name,
      });
      setJob((prev) => ({
        ...prev,
        generated_follow_up: data.followUp || prev.generated_follow_up,
        generated_upsell: data.upsell || prev.generated_upsell,
      }));
      setDirty(true);
      setMessage({ type: "success", text: "AI content generated." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "AI generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  const snoozeNba = () => {
    setNbaSnoozedUntil(Date.now() + 24 * 60 * 60 * 1000);
  };

  const nbaSnoozed = nbaSnoozedUntil !== null && Date.now() < nbaSnoozedUntil;

  const title = useMemo(() => titleFromJob(job), [job]);
  const risk = useMemo(() => computeRisk(job), [job]);
  const nba = useMemo(() => computeNBA(job), [job]);
  const progress = useMemo(() => computeProgress(job), [job]);
  const currentMilestoneIdx = MILESTONE_ORDER.indexOf(job.milestone || "Lead");
  const oppId = fallbackOpportunityId(job);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {noteModalOpen && (
        <NoteModal
          current={job.notes || ""}
          onClose={() => setNoteModalOpen(false)}
          onSave={(updated) => setField("notes", updated)}
        />
      )}

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5 space-y-4">

          {/* ── COMMAND STRIP ──────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-white shadow-sm p-5 space-y-4">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href="/jobs"
                  onClick={(e) => {
                    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
                      e.preventDefault();
                    }
                  }}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  ← Jobs
                </Link>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Opportunity · {oppId || "New"}
                  </div>
                  <h1 className="font-display text-2xl font-normal text-foreground truncate">
                    {title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RiskBadge level={risk} />
                <button
                  onClick={saveJob}
                  disabled={saving}
                  className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${
                    dirty ? "bg-electric" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
                </button>
              </div>
            </div>

            {/* Row 1 — Financial Summary */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Bid", value: fmtMoney(job.bid || job.price), alert: false, highlight: false },
                { label: "Paid", value: fmtMoney(job.payments_received), highlight: true, alert: false },
                { label: "Balance Due", value: fmtMoney(job.balance_due), alert: Number(job.balance_due) > 0, highlight: false },
                {
                  label: "Due Date",
                  value: fmtDate(job.due_date),
                  alert: (daysUntil(job.due_date) ?? 99) <= 3 && Number(job.balance_due) > 0,
                  highlight: false,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className={`rounded-xl border px-4 py-3 ${
                    c.alert
                      ? "border-red-500/20 bg-red-50"
                      : c.highlight
                      ? "border-green-500/20 bg-green-50"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </div>
                  <div className={`mt-1 text-xl font-bold tabular-nums ${
                    c.alert ? "text-red-700" : c.highlight ? "text-green-700" : "text-foreground"
                  }`}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2 — Payment Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{progress.pct}%</span> paid
                  &nbsp;·&nbsp; {progress.paidLabel} of {progress.totalLabel}
                </span>
                {job.due_date && (
                  <span>
                    {(() => {
                      const d = daysUntil(job.due_date);
                      if (d === null) return null;
                      if (d < 0) return <span className="font-semibold text-red-600">Overdue by {Math.abs(d)}d</span>;
                      if (d === 0) return <span className="font-semibold text-orange-600">Due today</span>;
                      return `Due in ${d} day${d === 1 ? "" : "s"}`;
                    })()}
                  </span>
                )}
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-electric transition-all duration-500"
                  style={{ width: `${progress.pct}%` }}
                />
                {/* Installment tick marks at 30% and 70% */}
                <div className="absolute inset-y-0 left-[30%] w-px bg-white/70" />
                <div className="absolute inset-y-0 left-[70%] w-px bg-white/70" />
              </div>
            </div>

            {/* Row 3 — Next Best Action */}
            {nba && !nbaDismissed && !nbaSnoozed && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 rounded-lg bg-electric px-2 py-0.5 text-xs font-bold text-white">
                    Next Action
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground">{nba.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{nba.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {nba.action && (
                    <button
                      onClick={() => runAction(nba.action!)}
                      className="rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                    >
                      Execute
                    </button>
                  )}
                  <button
                    onClick={snoozeNba}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    Snooze 24h
                  </button>
                  <button
                    onClick={() => setNbaDismissed(true)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Row 4 — Project Lifecycle */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Project Lifecycle
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {MILESTONE_ORDER.map((m, i) => {
                  const state = i < currentMilestoneIdx ? "complete" : i === currentMilestoneIdx ? "current" : "upcoming";
                  return (
                    <button
                      key={m}
                      onClick={() => setField("milestone", m)}
                      className={`flex-1 min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                        state === "current"
                          ? "border-primary bg-electric text-white shadow-sm"
                          : state === "complete"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {state === "complete" && "✓ "}
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {message && <Toast message={message} onDismiss={() => setMessage(null)} />}
          </section>

          {/* ── STICKY QUICK ACTION BAR ────────────────────────────────────── */}
          <div className="sticky top-0 z-20 -mx-4 px-4">
            <div className="rounded-2xl border border-border bg-white/95 backdrop-blur-sm px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1">
                  Quick Actions
                </span>

                {/* Contact actions */}
                <button
                  onClick={() => runAction("call")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </button>
                <button
                  onClick={() => runAction("text")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Text
                </button>
                <button
                  onClick={() => runAction("email")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>

                <div className="h-4 w-px bg-border mx-1" />

                {/* AI + Save */}
                <button
                  onClick={generateAi}
                  disabled={generating}
                  className="flex items-center gap-1.5 rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generating ? "Generating…" : "Generate AI"}
                </button>
                <button
                  onClick={saveJob}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save"}
                </button>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Utility actions */}
                <button
                  onClick={() => runAction("manual")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Pin className="h-3.5 w-3.5" /> Mark Contacted
                </button>
                <button
                  onClick={() => setMessage({ type: "info", text: "Payment request logged." })}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Request Payment
                </button>
                <button
                  onClick={() => setNoteModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <NotebookPen className="h-3.5 w-3.5" /> Add Note
                </button>
                <button
                  onClick={() => runAction("completed")}
                  className="flex items-center gap-1.5 rounded-lg border border-green-500/40 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </button>
              </div>
            </div>
          </div>

          {/* ── MAIN CARD GRID ──────────────────────────────────────────────── */}
          <div className="grid gap-4 xl:grid-cols-2">

            {/* AI Assistant Hub */}
            <CollapsibleSection title="AI Assistant Hub" icon="🤖">
              <AIAssistantHub
                job={job}
                generating={generating}
                aiTab={aiTab}
                setAiTab={setAiTab}
                onGenerate={generateAi}
              />
            </CollapsibleSection>

            {/* Project Overview */}
            <CollapsibleSection title="Project Overview" icon="👤">
              <div className="space-y-4">
                <TabBar
                  tabs={["Info", "Contact", "System", "Notes"]}
                  active={overviewTab}
                  onChange={setOverviewTab}
                />

                {overviewTab === "Info" && (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <InputField label="First Name" value={job.first_name} onChange={(v) => setField("first_name", v)} />
                      <InputField label="Last Name" value={job.last_name} onChange={(v) => setField("last_name", v)} />
                    </div>
                    <InputField label="Address" value={job.address_1} onChange={(v) => setField("address_1", v)} />
                    <div className="grid gap-3 grid-cols-3">
                      <InputField label="City" value={job.city} onChange={(v) => setField("city", v)} />
                      <InputField label="State" value={job.state} onChange={(v) => setField("state", v)} />
                      <InputField label="Zip" value={job.zip_code} onChange={(v) => setField("zip_code", v)} />
                    </div>
                  </div>
                )}

                {overviewTab === "Contact" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <InputField label="Mobile #1" value={job.mobile_number_1} onChange={(v) => setField("mobile_number_1", v)} />
                      </div>
                      <div className="flex gap-1 mt-5">
                        <button onClick={() => runAction("call")} aria-label="Log call" className="rounded-lg border border-border p-2 transition hover:border-primary hover:text-primary"><Phone className="h-3.5 w-3.5" /></button>
                        <button onClick={() => runAction("text")} aria-label="Log text" className="rounded-lg border border-border p-2 transition hover:border-primary hover:text-primary"><MessageSquare className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <InputField label="Mobile #2" value={job.mobile_number_2} onChange={(v) => setField("mobile_number_2", v)} />
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <InputField label="Email" value={job.email} onChange={(v) => setField("email", v)} />
                      </div>
                      <button onClick={() => runAction("email")} aria-label="Log email" className="rounded-lg border border-border p-2 mt-5 transition hover:border-primary hover:text-primary"><Mail className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}

                {overviewTab === "System" && (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Opportunity ID</div>
                        <div className="text-sm font-semibold text-foreground">{oppId || "Pending"}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Risk Status</div>
                        <RiskBadge level={risk} />
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Last Contacted</div>
                        <div className="text-sm font-semibold text-foreground">{fmtDate(job.last_contacted_date)}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Contact Method</div>
                        <div className="text-sm font-semibold text-foreground capitalize">{job.last_contact_method || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
                      <select
                        value={job.status || "Draft"}
                        onChange={(e) => setField("status", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      >
                        {["Draft", "New", "Contacted", "Closed"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {overviewTab === "Notes" && (
                  <label className="block">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal Notes</div>
                    <textarea
                      value={job.notes || ""}
                      onChange={(e) => setField("notes", e.target.value)}
                      rows={7}
                      placeholder="Internal notes, client preferences, follow-up context…"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </label>
                )}
              </div>
            </CollapsibleSection>

            {/* Scope of Work */}
            <CollapsibleSection title="Scope of Work" icon="🏗️">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField label="Service" value={job.service} onChange={(v) => setField("service", v)} />
                  <label className="block">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Milestone</div>
                    <select
                      value={job.milestone || "Lead"}
                      onChange={(e) => setField("milestone", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      {MILESTONE_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 grid-cols-3">
                  <InputField label="Bid ($)" value={job.bid} onChange={(v) => setField("bid", v)} type="number" />
                  <InputField label="Paid ($)" value={job.payments_received} onChange={(v) => setField("payments_received", v)} type="number" />
                  <InputField label="Balance ($)" value={job.balance_due} onChange={(v) => setField("balance_due", v)} type="number" />
                </div>

                <InputField label="Due Date" value={job.due_date} onChange={(v) => setField("due_date", v)} type="date" />

                <label className="block">
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scope of Work</div>
                  <textarea
                    value={job.scope_of_work || ""}
                    onChange={(e) => setField("scope_of_work", e.target.value)}
                    rows={8}
                    placeholder="Describe the service scope, materials, deliverables, and client needs…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </label>
              </div>
            </CollapsibleSection>

            {/* Task List */}
            <CollapsibleSection title="Task List" icon="✅">
              <TaskListCard />
            </CollapsibleSection>

            {/* Documents */}
            <CollapsibleSection title="Documents" icon="📁" defaultOpen={false}>
              <DocumentsSection />
            </CollapsibleSection>

          </div>

          {/* ── INSTALLMENT TRACKER + ACTIVITY TIMELINE ────────────────────── */}
          <div className="grid gap-4 xl:grid-cols-2">

            <CollapsibleSection title="Installment Tracker" icon="💳" defaultOpen={false}>
              <InstallmentTracker
                bid={job.bid}
                price={job.price}
                paymentsReceived={job.payments_received}
                onRequest={() => runAction("manual")}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Activity Timeline" icon="🕒" defaultOpen={false}>
              <ActivityTimeline
                lastContactedDate={job.last_contacted_date}
                lastContactMethod={job.last_contact_method}
                createdAt={job.created_at}
              />
            </CollapsibleSection>

          </div>

        </div>
      </main>
    </>
  );
}

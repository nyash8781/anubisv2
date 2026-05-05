"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Job } from "@/types/job";
import { MILESTONE_ORDER } from "@/types/job";
import { Skeleton } from "@/components/ui/skeleton";

// ── Opportunity components ───────────────────────────────────────────────────
import { CommandStrip } from "@/components/opportunity/CommandStrip";
import { QuickActionBar } from "@/components/opportunity/QuickActionBar";
import { ClientProfileDrawer } from "@/components/opportunity/ClientProfileDrawer";
import { NoteModal } from "@/components/opportunity/NoteModal";
import { TaskList } from "@/components/opportunity/TaskList";
import { ActivityTimeline } from "@/components/opportunity/ActivityTimeline";
import { InstallmentTracker } from "@/components/opportunity/InstallmentTracker";
import { AIAssistantHub } from "@/components/opportunity/AIAssistantHub";
import { ScopeOfWork } from "@/components/opportunity/ScopeOfWork";
import { DocumentsSection } from "@/components/opportunity/DocumentsSection";

// ── Business logic ───────────────────────────────────────────────────────────
import {
  fallbackOpportunityId,
  titleFromJob,
  clientSummary,
  computeRisk,
  computeNBA,
  computeProgress,
  type ActionType,
  type UiMessage,
} from "@/components/opportunity/job-utils";

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

// ─── Layout primitives (used only in this file) ───────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-normal text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">{children}</div>
  );
}

function CardHeader({ title, icon }: { title: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-4">
      {icon && <span className="text-base">{icon}</span>}
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpportunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // ── State ──────────────────────────────────────────────────────────────────
  const [job, setJob] = useState<Job>(blankJob);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<UiMessage>(null);
  const [dirty, setDirty] = useState(false);
  const [nbaDismissed, setNbaDismissed] = useState(false);
  const [nbaSnoozedUntil, setNbaSnoozedUntil] = useState<number | null>(null);
  const [aiTab, setAiTab] = useState("Email");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────
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
      } catch (err) {
        console.error(err);
        if (active) setMessage({ type: "error", text: "Failed to load opportunity." });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, applyJob]);

  // ── Field + save handlers ──────────────────────────────────────────────────
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
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save — try again." });
    } finally {
      setSaving(false);
    }
  };

  // ── Contact action handler ─────────────────────────────────────────────────
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
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Action failed." });
    }
  };

  // ── AI generation ──────────────────────────────────────────────────────────
  // [AI HOOK] Future: add tone/persona selector before calling generate
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
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "AI generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  const snoozeNba = () => setNbaSnoozedUntil(Date.now() + 24 * 60 * 60 * 1000);
  const nbaSnoozed = nbaSnoozedUntil !== null && Date.now() < nbaSnoozedUntil;

  // ── Derived values ─────────────────────────────────────────────────────────
  const title = useMemo(() => titleFromJob(job), [job]);
  const summary = useMemo(() => clientSummary(job), [job]);
  const risk = useMemo(() => computeRisk(job), [job]);
  const nba = useMemo(() => computeNBA(job), [job]);
  const progress = useMemo(() => computeProgress(job), [job]);
  const currentMilestoneIdx = MILESTONE_ORDER.indexOf(job.milestone || "Lead");
  const oppId = fallbackOpportunityId(job);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  // ── Page render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modals & overlays */}
      {noteModalOpen && (
        <NoteModal
          current={job.notes || ""}
          onClose={() => setNoteModalOpen(false)}
          onSave={(updated) => setField("notes", updated)}
        />
      )}

      <ClientProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        job={job}
        setField={setField}
        onSave={saveJob}
        saving={saving}
        risk={risk}
        oppId={oppId}
        onLogCall={() => runAction("call")}
        onLogText={() => runAction("text")}
        onLogEmail={() => runAction("email")}
      />

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-5">

          {/* ── Command Strip: header / financials / progress / NBA / lifecycle */}
          <CommandStrip
            job={job}
            oppId={oppId}
            title={title}
            summary={summary}
            risk={risk}
            progress={progress}
            nba={nba}
            nbaDismissed={nbaDismissed}
            nbaSnoozed={nbaSnoozed}
            saving={saving}
            dirty={dirty}
            message={message}
            currentMilestoneIdx={currentMilestoneIdx}
            onSave={saveJob}
            onViewProfile={() => setDrawerOpen(true)}
            onExecuteNba={(action) => runAction(action)}
            onSnoozeNba={snoozeNba}
            onDismissNba={() => setNbaDismissed(true)}
            onMilestoneChange={(m) => setField("milestone", m)}
            onDismissMessage={() => setMessage(null)}
          />

          {/* ── Sticky Quick Action Bar */}
          <QuickActionBar
            saving={saving}
            generating={generating}
            onCall={() => runAction("call")}
            onText={() => runAction("text")}
            onEmail={() => runAction("email")}
            onGenerate={generateAi}
            onSave={saveJob}
            onMarkContacted={() => runAction("manual")}
            onRequestPayment={() => setMessage({ type: "info", text: "Payment request logged." })}
            onAddNote={() => setNoteModalOpen(true)}
            onComplete={() => runAction("completed")}
          />

          {/* ── Section 1: Project Overview ──────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Project Overview"
              subtitle="Track execution, communication, and payments"
            />
            <div className="grid gap-4 lg:grid-cols-3">

              <Card>
                <CardHeader title="Task List" icon="✅" />
                <div className="p-5">
                  <TaskList />
                </div>
              </Card>

              <Card>
                <CardHeader title="Activity Timeline" icon="🕒" />
                <div className="p-5">
                  <ActivityTimeline
                    lastContactedDate={job.last_contacted_date}
                    lastContactMethod={job.last_contact_method}
                    createdAt={job.created_at}
                    onAddNote={() => setNoteModalOpen(true)}
                    onLogCall={() => runAction("call")}
                    onLogEmail={() => runAction("email")}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader title="Installment Tracker" icon="💳" />
                <div className="p-5">
                  <InstallmentTracker
                    bid={job.bid}
                    price={job.price}
                    paymentsReceived={job.payments_received}
                    onRequest={() => runAction("manual")}
                  />
                </div>
              </Card>

            </div>
          </section>

          {/* ── Section 2: Proposal Builder ──────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Proposal Builder"
              subtitle="Build, refine, and package the job"
            />
            <div className="space-y-4">

              <Card>
                <CardHeader title="AI Assistant Hub" icon="🤖" />
                <div className="p-5">
                  <AIAssistantHub
                    job={job}
                    generating={generating}
                    aiTab={aiTab}
                    setAiTab={setAiTab}
                    onGenerate={generateAi}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader title="Scope of Work" icon="🏗️" />
                <div className="p-5">
                  <ScopeOfWork job={job} setField={setField} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Documents" icon="📁" />
                <div className="p-5">
                  <DocumentsSection />
                </div>
              </Card>

            </div>
          </section>

        </div>
      </main>
    </>
  );
}

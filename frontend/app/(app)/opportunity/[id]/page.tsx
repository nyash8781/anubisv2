"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Job, ProductionStatus, PaymentStatus, DepositStatus } from "@/types/job";
import { MILESTONE_ORDER } from "@/types/job";
import { Skeleton } from "@/components/ui/skeleton";
import { useMilestones } from "@/lib/milestones-context";
import Link from "next/link";
import type { Proposal, PaymentTerm, ContractorProposalSettings } from "@/types/proposal";
import { listProposalsForJob } from "@/lib/services/proposalService";

// ── Validation schema ─────────────────────────────────────────────────────────
const opportunitySchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  mobile_number_1: z.string().regex(/^\d{10}$|^$/, "Phone must be 10 digits").optional().or(z.literal("")),
  bid: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : parseFloat(String(v).replace(/[^0-9.-]/g, ""))),
    z.number({ invalid_type_error: "Price must be a number" }).nonnegative("Price cannot be negative").optional()
  ),
});

// ── Opportunity components ───────────────────────────────────────────────────
import { CommandStrip } from "@/components/opportunity/CommandStrip";
import { QuickActionBar } from "@/components/opportunity/QuickActionBar";
import { ClientProfileDrawer } from "@/components/opportunity/ClientProfileDrawer";
import { NoteModal } from "@/components/opportunity/NoteModal";
import { ActivityTimeline } from "@/components/opportunity/ActivityTimeline";
import { InstallmentTracker } from "@/components/opportunity/InstallmentTracker";
import { PaymentHistory } from "@/components/opportunity/PaymentHistory";
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
  const [dirty, setDirty] = useState(false);
  const [nbaDismissed, setNbaDismissed] = useState(false);
  const [nbaSnoozedUntil, setNbaSnoozedUntil] = useState<number | null>(null);
  const [aiTab, setAiTab] = useState("Email");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Increment to trigger ActivityTimeline re-fetch after logging an action
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  // Increment to trigger PaymentHistory re-fetch after a new payment request/mark
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Backend-backed proposals for this opportunity + settings for InstallmentTracker
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[] | undefined>(undefined);
  const { milestones } = useMilestones();

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
        if (active) toast.error("Failed to load opportunity.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, applyJob]);

  // Load proposals for this opportunity from backend + payment terms from settings
  useEffect(() => {
    if (!id || id === "new") return;

    listProposalsForJob(id)
      .then((rows) => setProposals(rows))
      .catch(() => { /* non-fatal — empty state shown */ });

    apiGet<{ base_prompt: string; business_context: string; extra?: Record<string, unknown> }>("/settings")
      .then((s) => {
        const ps = (s.extra?.proposal_settings as ContractorProposalSettings | undefined);
        if (ps?.paymentTerms && ps.paymentTerms.length > 0) {
          setPaymentTerms(ps.paymentTerms);
        }
      })
      .catch(() => { /* non-fatal — InstallmentTracker has defaults */ });
  }, [id]);

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
    const firstName = (job.first_name || "").trim();
    const lastName = (job.last_name || "").trim();
    const customerName = `${firstName} ${lastName}`.trim() || (job.customer_name || "").trim();

    // Zod validation
    const validation = opportunitySchema.safeParse({
      customer_name: customerName,
      email: job.email || "",
      mobile_number_1: job.mobile_number_1 || "",
      bid: job.bid || "",
    });

    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setFieldErrors(errs);
      const firstMsg = validation.error.errors[0]?.message ?? "Please fix the errors below.";
      toast.error(firstMsg);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      const payload: Job = {
        ...job,
        customer_name: customerName,
        address: job.address_1,
        phone: job.mobile_number_1,
      };
      const isNew = !job.id;
      const data = isNew
        ? await apiPost<Job>("/jobs", payload)
        : await apiPut<Job>(`/jobs/${job.id}`, payload);
      applyJob(data);
      toast.success("Opportunity saved.");
      if (isNew && data?.id) router.replace(`/opportunity/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save — check your connection.");
    } finally {
      setSaving(false);
    }
  };

  // ── Contact action handler ─────────────────────────────────────────────────
  const runAction = async (type: ActionType) => {
    if (!job.id) {
      toast.info("Save the opportunity first before logging an action.");
      return;
    }
    const labels: Record<string, string> = {
      email: "Email", text: "Text", call: "Phone call",
      manual: "Contact", completed: "Completion",
    };
    const toastId = toast.loading(`Logging ${labels[type] ?? type}…`);
    try {
      const data = await apiPost<Job>(`/jobs/${job.id}/action`, { type });
      applyJob(data);
      toast.success(`${labels[type] ?? type} logged.`, { id: toastId });
      setNbaDismissed(false);
      setActivityRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to log action — try again.", { id: toastId });
    }
  };

  // ── AI generation ──────────────────────────────────────────────────────────
  // [AI HOOK] Future: add tone/persona selector before calling generate
  const generateAi = async () => {
    if (!job.scope_of_work?.trim() && !job.service?.trim()) {
      toast.info("Add a service or scope of work before generating.");
      return;
    }
    try {
      setGenerating(true);
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
      toast.success("AI content generated.");
    } catch (err) {
      console.error(err);
      toast.error("AI generation failed — try again.");
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
  const milestoneLabels = useMemo(() => milestones.map((m) => m.label), [milestones]);
  const currentMilestoneIdx = milestoneLabels.length > 0
    ? milestoneLabels.indexOf(job.milestone || "Lead")
    : MILESTONE_ORDER.indexOf((job.milestone || "Lead") as any);
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
        fieldErrors={fieldErrors}
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
            currentMilestoneIdx={currentMilestoneIdx}
            milestones={milestoneLabels}
            onSave={saveJob}
            onViewProfile={() => setDrawerOpen(true)}
            onExecuteNba={(action) => runAction(action)}
            onSnoozeNba={snoozeNba}
            onDismissNba={() => setNbaDismissed(true)}
            onMilestoneChange={(m) => setField("milestone", m)}
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
            onRequestPayment={() => runAction("manual")}
            onAddNote={() => setNoteModalOpen(true)}
            onComplete={() => runAction("completed")}
          />

          {/* ── Section 1: Project Overview ──────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Project Overview"
              subtitle="Track execution, communication, and payments"
            />

            {/* Activity Timeline */}
            <Card>
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <span className="text-base">🕒</span>
                <span className="text-sm font-semibold text-foreground">Activity Timeline</span>
              </div>
              <div className="px-5 py-4">
                <ActivityTimeline
                  jobId={job.id}
                  lastContactedDate={job.last_contacted_date}
                  lastContactMethod={job.last_contact_method}
                  createdAt={job.created_at}
                  refreshKey={activityRefreshKey}
                  onAddNote={() => setNoteModalOpen(true)}
                  onLogCall={() => runAction("call")}
                  onLogEmail={() => runAction("email")}
                />
              </div>
            </Card>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Installment Tracker" icon="💳" />
                <div className="p-5">
                  <InstallmentTracker
                    opportunityId={job.id}
                    bid={job.bid}
                    price={job.price}
                    paymentsReceived={job.payments_received}
                    paymentTerms={paymentTerms}
                    onPaymentRequested={() => setPaymentsRefreshKey((k) => k + 1)}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader title="Payment History" icon="📒" />
                <div className="p-5">
                  <PaymentHistory
                    opportunityId={job.id}
                    refreshKey={paymentsRefreshKey}
                  />
                </div>
              </Card>
            </div>
          </section>

          {/* ── Section 1.5: Production & Payment Status ──────────────────────── */}
          <section>
            <SectionHeader
              title="Production & Payment"
              subtitle="Operational status, blockers, and payment tracking"
            />
            <div className="grid gap-4 lg:grid-cols-2">

              {/* Production fields */}
              <Card>
                <CardHeader title="Production Status" icon="🏗️" />
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                    <select
                      value={job.production_status || ''}
                      onChange={(e) => setField('production_status', e.target.value as ProductionStatus)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">— Select status —</option>
                      {(['Not Scheduled', 'Ready', 'Scheduled', 'In Progress', 'Blocked', 'Complete'] as ProductionStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned PM / Owner</label>
                    <input
                      type="text"
                      value={job.production_owner || ''}
                      onChange={(e) => setField('production_owner', e.target.value)}
                      placeholder="e.g. Mike Torres"
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Scheduled Date</label>
                    <input
                      type="date"
                      value={job.scheduled_date || ''}
                      onChange={(e) => setField('scheduled_date', e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  {job.production_status === 'Blocked' && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-red-600 uppercase tracking-wide">Blocker Reason</label>
                      <input
                        type="text"
                        value={job.production_blocker || ''}
                        onChange={(e) => setField('production_blocker', e.target.value)}
                        placeholder="Describe what is blocking this job"
                        className="h-9 w-full rounded-lg border border-red-300 bg-red-50 px-3 text-sm outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-200"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment status fields */}
              <Card>
                <CardHeader title="Payment Status" icon="💰" />
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</label>
                    <select
                      value={job.payment_status || ''}
                      onChange={(e) => setField('payment_status', e.target.value as PaymentStatus)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">— Select status —</option>
                      {(['Not Started', 'Deposit Pending', 'Deposit Paid', 'In Progress', 'Overdue', 'Paid In Full'] as PaymentStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Deposit Status</label>
                    <select
                      value={job.deposit_status || ''}
                      onChange={(e) => setField('deposit_status', e.target.value as DepositStatus)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">— Select —</option>
                      {(['N/A', 'Pending', 'Paid'] as DepositStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance Due</label>
                    <input
                      type="text"
                      value={String(job.balance_due || '')}
                      onChange={(e) => setField('balance_due', e.target.value)}
                      placeholder="0.00"
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                    <input
                      type="date"
                      value={job.due_date || ''}
                      onChange={(e) => setField('due_date', e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  {job.payment_status === 'Overdue' && (
                    <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      ⚠️ This job has an overdue payment. Follow up with the client to collect balance.
                    </div>
                  )}
                </div>
              </Card>

            </div>
          </section>

          {/* ── Section 1.8: Proposals ───────────────────────────────────────── */}
          {id && id !== "new" && (
            <section>
              <SectionHeader
                title="Proposals"
                subtitle="Drafts and sent proposals for this opportunity"
              />
              <Card>
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <span className="text-sm font-semibold text-foreground">
                    Proposals {proposals.length > 0 && <span className="text-muted-foreground font-normal">({proposals.length})</span>}
                  </span>
                  <Link
                    href={`/proposal?jobId=${id}`}
                    className="rounded-lg bg-electric px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    + Create Proposal
                  </Link>
                </div>
                <div className="px-5 py-4">
                  {proposals.length > 0 ? (
                    <ul className="space-y-2">
                      {proposals.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/proposal?proposalId=${p.id}`}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {p.title || p.proposalNumber || "Untitled Proposal"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className={`font-medium ${
                                  p.status === 'approved' ? 'text-green-700'
                                  : p.status === 'sent' ? 'text-primary'
                                  : p.status === 'declined' || p.status === 'expired' ? 'text-red-600'
                                  : 'text-muted-foreground'
                                }`}>
                                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                </span>
                                {" · "}
                                Updated {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}
                                {p.total ? ` · $${Number(p.total).toLocaleString()}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 ml-4 text-xs text-primary">Open →</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No proposals yet for this opportunity.{" "}
                      <Link href={`/proposal?jobId=${id}`} className="text-primary hover:underline">
                        Create one →
                      </Link>
                    </p>
                  )}
                </div>
              </Card>
            </section>
          )}

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

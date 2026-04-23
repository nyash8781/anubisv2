"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";

type Job = {
  id?: number;
  opportunity_id?: string;
  customer_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile_number_1?: string;
  mobile_number_2?: string;
  address?: string;
  address_1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  service?: string;
  scope_of_work?: string;
  price?: string | number;
  bid?: string | number;
  payments_received?: string | number;
  balance_due?: string | number;
  due_date?: string;
  notes?: string;
  milestone?: string;
  status?: string;
  contact_status?: string;
  last_contacted_date?: string;
  last_contact_method?: string;
  generated_follow_up?: string;
  generated_upsell?: string;
  created_at?: string;
};

type UiMessage = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const milestoneOrder = [
  "Lead",
  "Site Visit",
  "Proposal",
  "Construction",
  "Completed",
];

const blankJob: Job = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_number_1: "",
  mobile_number_2: "",
  address_1: "",
  city: "",
  state: "",
  zip_code: "",
  service: "",
  scope_of_work: "",
  bid: "",
  payments_received: "",
  balance_due: "",
  due_date: "",
  notes: "",
  milestone: "Lead",
  status: "Draft",
  generated_follow_up: "",
  generated_upsell: "",
};

// Must match the storage key used by /input page. Single source of truth for
// global settings. Fixes P1-02 from the initial review.
const SETTINGS_STORAGE_KEY = "anubis_global_settings";

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

function lifecycleState(currentMilestone?: string, targetMilestone?: string) {
  const currentIndex = milestoneOrder.indexOf(currentMilestone || "Lead");
  const targetIndex = milestoneOrder.indexOf(targetMilestone || "");
  if (targetIndex < currentIndex) return "complete";
  if (targetIndex === currentIndex) return "current";
  return "upcoming";
}

function fmtMoney(value?: string | number) {
  if (value === "" || value === undefined || value === null) return "N/A";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(value?: string) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-action"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value?: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
        {label}
      </div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400"
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/40 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value || "N/A"}</div>
    </div>
  );
}

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

  const applyJob = (data: Job) => {
    const merged: Job = {
      ...blankJob,
      ...data,
    };

    if (!merged.first_name && merged.customer_name) {
      const parts = merged.customer_name.split(" ");
      merged.first_name = parts.shift() || "";
      merged.last_name = parts.join(" ");
    }

    if (!merged.address_1 && merged.address) {
      merged.address_1 = merged.address;
    }

    if (!merged.mobile_number_1 && merged.phone) {
      merged.mobile_number_1 = merged.phone;
    }

    setJob(merged);
    setDirty(false);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id || id === "new") {
        if (!active) return;
        setJob(blankJob);
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet<Job>(`/jobs/${id}`);
        if (!active) return;
        applyJob(data || blankJob);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setMessage({ type: "error", text: "Failed to load opportunity." });
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const setField = (field: keyof Job, value: string) => {
    setJob((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "first_name" || field === "last_name") {
        next.customer_name = `${next.first_name || ""} ${next.last_name || ""}`.trim();
      }
      if (field === "address_1") {
        next.address = value;
      }
      if (field === "mobile_number_1") {
        next.phone = value;
      }
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

      if (isNew && data?.id) {
        router.replace(`/opportunity/${data.id}`);
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save — try again." });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (
    type: "email" | "text" | "call" | "manual" | "completed"
  ) => {
    if (!job.id) {
      setMessage({ type: "info", text: "Save before contacting." });
      return;
    }

    try {
      const data = await apiPost<Job>(`/jobs/${job.id}/action`, { type });
      applyJob(data);
      const label =
        type === "email"
          ? "Email"
          : type === "text"
          ? "Text"
          : type === "call"
          ? "Phone Call"
          : type === "completed"
          ? "Completed"
          : "Contact";
      setMessage({ type: "success", text: `${label} updated.` });
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

      // P1-02 fix: read the SAME key the input page writes, with the SAME
      // flat shape. Previously read "anubis-input-settings" with a nested
      // "aiBehavior.basePrompt" that never existed.
      let promptSettings = {
        systemPrompt: "",
        businessContext: "",
      };

      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          promptSettings = {
            systemPrompt: parsed?.base_prompt || "",
            businessContext: parsed?.business_context || "",
          };
        }
      } catch {
        // localStorage unavailable or corrupt; fall through with empty prompts.
      }

      const payload = {
        ...job,
        system_prompt: promptSettings.systemPrompt,
        business_context: promptSettings.businessContext,
      };

      const data = await apiPost<{ followUp: string; upsell: string }>(
        "/generate-job-insights",
        payload
      );

      setJob((prev) => ({
        ...prev,
        generated_follow_up: data.followUp || prev.generated_follow_up,
        generated_upsell: data.upsell || prev.generated_upsell,
      }));
      setDirty(true);
      setMessage({ type: "success", text: "AI response generated." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "AI generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  const title = useMemo(() => titleFromJob(job), [job]);
  const currentMilestone = job.milestone || "Lead";

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6 text-white">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border/40 bg-card p-8">
          Loading opportunity...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-card p-4">
          <button
            onClick={saveJob}
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-action-foreground transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {saving ? "Saving..." : dirty ? "Save Changes" : "Save"}
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-border/40 bg-card p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-action">
                Opportunity Dashboard
              </div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-300">
                <span className="rounded-full border border-border/40 bg-black/20 px-3 py-1">
                  ID: {fallbackOpportunityId(job) || "Pending"}
                </span>
                <span className="rounded-full border border-border/40 bg-black/20 px-3 py-1">
                  Milestone: {job.milestone || "Lead"}
                </span>
                <span className="rounded-full border border-border/40 bg-black/20 px-3 py-1">
                  Last Contact: {fmtDate(job.last_contacted_date)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => runAction("call")}
                className="rounded-xl border border-border/40 px-3 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
              >
                Call
              </button>
              <button
                onClick={() => runAction("text")}
                className="rounded-xl border border-border/40 px-3 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
              >
                Text
              </button>
              <button
                onClick={() => runAction("email")}
                className="rounded-xl border border-border/40 px-3 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
              >
                Email
              </button>
              <Link
                href="/"
                className="rounded-xl border border-yellow-400 px-3 py-2 text-sm font-semibold text-action transition hover:bg-yellow-400 hover:text-action-foreground"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : message.type === "error"
                  ? "border border-red-500/30 bg-red-500/10 text-red-300"
                  : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
              }`}
            >
              {message.text}
            </div>
          ) : null}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
              Bid
            </div>
            <div className="mt-3 text-2xl font-bold text-white">
              {fmtMoney(job.bid || job.price)}
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
              Payments Received
            </div>
            <div className="mt-3 text-2xl font-bold text-white">
              {fmtMoney(job.payments_received)}
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
              Balance Due
            </div>
            <div className="mt-3 text-2xl font-bold text-white">
              {fmtMoney(job.balance_due)}
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
              Due Date
            </div>
            <div className="mt-3 text-2xl font-bold text-white">
              {fmtDate(job.due_date)}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border/40 bg-card p-5">
          <div className="mb-4 text-sm font-semibold uppercase tracking-wide ext-muted-foreground">
            Project Life Cycle
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {milestoneOrder.map((milestone) => {
              const state = lifecycleState(currentMilestone, milestone);
              return (
                <div
                  key={milestone}
                  className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
                    state === "current"
                      ? "border-yellow-400 bg-action"
                      : state === "complete"
                      ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                      : "border-border/40 bg-black/20 ext-muted-foreground"
                  }`}
                >
                  {milestone}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-border/40 bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              Customer & Project Data
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="First Name"
                value={job.first_name}
                onChange={(value) => setField("first_name", value)}
              />
              <InputField
                label="Last Name"
                value={job.last_name}
                onChange={(value) => setField("last_name", value)}
              />
            </div>

            <div className="mt-4 grid gap-4">
              <InputField
                label="Address 1"
                value={job.address_1}
                onChange={(value) => setField("address_1", value)}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <InputField
                label="City"
                value={job.city}
                onChange={(value) => setField("city", value)}
              />
              <InputField
                label="State"
                value={job.state}
                onChange={(value) => setField("state", value)}
              />
              <InputField
                label="Zip Code"
                value={job.zip_code}
                onChange={(value) => setField("zip_code", value)}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InputField
                label="Mobile Number #1"
                value={job.mobile_number_1}
                onChange={(value) => setField("mobile_number_1", value)}
              />
              <InputField
                label="Mobile Number #2"
                value={job.mobile_number_2}
                onChange={(value) => setField("mobile_number_2", value)}
              />
            </div>

            <div className="mt-4">
              <InputField
                label="Email"
                value={job.email}
                onChange={(value) => setField("email", value)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border/40 bg-card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Scope of Work</h2>
              <button
                onClick={generateAi}
                disabled={generating}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-action-foreground transition hover:bg-yellow-300 disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate AI"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Service"
                value={job.service}
                onChange={(value) => setField("service", value)}
              />
              <label className="block">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
                  Milestone
                </div>
                <select
                  value={job.milestone || "Lead"}
                  onChange={(e) => setField("milestone", e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400"
                >
                  {milestoneOrder.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <InputField
                label="Bid"
                value={job.bid}
                onChange={(value) => setField("bid", value)}
              />
              <InputField
                label="Payments Received"
                value={job.payments_received}
                onChange={(value) => setField("payments_received", value)}
              />
              <InputField
                label="Balance Due"
                value={job.balance_due}
                onChange={(value) => setField("balance_due", value)}
              />
            </div>

            <div className="mt-4">
              <InputField
                label="Due Date"
                value={job.due_date}
                onChange={(value) => setField("due_date", value)}
                type="date"
              />
            </div>

            <label className="mt-4 block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
                Scope of Work
              </div>
              <textarea
                value={job.scope_of_work || ""}
                onChange={(e) => setField("scope_of_work", e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-yellow-400"
                placeholder="Describe the service scope, materials, deliverables, and client needs..."
              />
            </label>

            <label className="mt-4 block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide ext-muted-foreground">
                Notes
              </div>
              <textarea
                value={job.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-yellow-400"
                placeholder="Internal notes..."
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border/40 bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              System & Documents
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField
                label="Opportunity ID"
                value={fallbackOpportunityId(job) || "Pending"}
              />
              <ReadOnlyField label="Status" value={job.status || "Draft"} />
              <ReadOnlyField
                label="Last Contact"
                value={fmtDate(job.last_contacted_date)}
              />
              <ReadOnlyField
                label="Contact Method"
                value={job.last_contact_method || "N/A"}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-border/40 bg-black/20 p-5">
              <div className="mb-4 text-sm font-semibold uppercase tracking-wide ext-muted-foreground">
                Document Placeholders
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-gray-300">
                  Contract Document — Not attached
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-gray-300">
                  Bill of Materials — Not attached
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-gray-300">
                  Submittals — Not attached
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/40 bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              AI Communications
            </h2>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-border/40 bg-black/20 p-4">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-action">
                  Generated Follow-Up
                </div>
                <div className="min-h-[180px] whitespace-pre-wrap rounded-xl border border-border/40 bg-muted/40 p-4 text-sm leading-6 text-white">
                  {job.generated_follow_up ||
                    "Generated follow-up will appear here."}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-black/20 p-4">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-action">
                  Generated Upsell
                </div>
                <div className="min-h-[140px] whitespace-pre-wrap rounded-xl border border-border/40 bg-muted/40 p-4 text-sm leading-6 text-white">
                  {job.generated_upsell ||
                    "Generated upsell will appear here."}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 rounded-2xl border border-border/40 bg-card p-4">
          <button
            onClick={saveJob}
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-action-foreground transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => runAction("manual")}
            className="rounded-xl border border-border/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
          >
            Mark Contacted
          </button>
          <button
            onClick={() => runAction("completed")}
            className="rounded-xl border border-border/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-action"
          >
            Mark Completed
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, RefreshCw } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Settings = {
  base_prompt: string;
  business_context: string;
  business_name: string;
  contractor_logo: string;
  company_contact_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  website: string;
  license_number: string;
  tagline: string;
  tone: string;
  personalization_level: string;
  follow_up_length: string;
  upsell_style: string;
  proposal_writing_style: string;
  compliance_language: boolean;
  reading_level: string;
  business_type: string;
  service_area: string;
  typical_job_size: string;
  core_services: string;
  emergency_service: boolean;
  market_focus: string;
  business_hours: string;
  response_time_promise: string;
  preferred_sales_style: string;
  internal_notes_for_ai: string;
  default_email_subject_line: string;
  email_signature: string;
  include_price: boolean;
  include_cta: boolean;
  sms_style: string;
  max_sms_length: string;
  greeting_style: string;
  closing_style: string;
  default_contact_method_preference: string;
  preferred_contact_window: string;
  default_new_status: string;
  default_new_milestone: string;
  stale_lead_days: string;
  stale_site_visit_days: string;
  stale_proposal_days: string;
  stale_construction_days: string;
  aging_threshold_days: string;
  auto_mark_contacted_email: boolean;
  auto_mark_contacted_text: boolean;
  auto_mark_contacted_call: boolean;
  allow_draft_contact_actions: boolean;
  opportunity_id_format: string;
};

const defaults: Settings = {
  base_prompt: "You are helping a contractor write clear, useful, customer-facing communication.",
  business_context: "",
  business_name: "",
  contractor_logo: "",
  company_contact_name: "",
  company_phone: "",
  company_email: "",
  company_address: "",
  website: "",
  license_number: "",
  tagline: "",
  tone: "Professional",
  personalization_level: "Medium",
  follow_up_length: "Short",
  upsell_style: "Soft",
  proposal_writing_style: "Professional",
  compliance_language: false,
  reading_level: "Standard",
  business_type: "",
  service_area: "",
  typical_job_size: "",
  core_services: "",
  emergency_service: false,
  market_focus: "Residential / Commercial / Both",
  business_hours: "",
  response_time_promise: "",
  preferred_sales_style: "",
  internal_notes_for_ai: "",
  default_email_subject_line: "Following up on your project",
  email_signature: "",
  include_price: true,
  include_cta: true,
  sms_style: "Friendly",
  max_sms_length: "320",
  greeting_style: "Standard",
  closing_style: "Standard",
  default_contact_method_preference: "",
  preferred_contact_window: "",
  default_new_status: "Draft",
  default_new_milestone: "Lead",
  stale_lead_days: "3",
  stale_site_visit_days: "5",
  stale_proposal_days: "5",
  stale_construction_days: "7",
  aging_threshold_days: "60",
  auto_mark_contacted_email: true,
  auto_mark_contacted_text: true,
  auto_mark_contacted_call: true,
  allow_draft_contact_actions: false,
  opportunity_id_format: "YYMMDDXXXX",
};

// ---------------------------------------------------------------------------
// Primitive input components
// ---------------------------------------------------------------------------
function TextInput({ label, hint, value, onChange, placeholder = "", type = "text" }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20" />
    </div>
  );
}

function TextArea({ label, hint, value, onChange, placeholder = "", rows = 3 }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20" />
    </div>
  );
}

function SelectInput({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function Section({ title, description, defaultOpen = false, children }: {
  title: string; description: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/30">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
      </button>
      {open && <div className="grid gap-4 border-t border-border px-5 py-5 sm:grid-cols-2">{children}</div>}
    </div>
  );
}

function Full({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const [s, setS] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => {
    setLoadError(false);
    setLoading(true);
    apiGet<{ base_prompt: string; business_context: string; extra?: Record<string, unknown> }>("/settings")
      .then((remote) => {
        setS({
          ...defaults,
          base_prompt: remote.base_prompt || defaults.base_prompt,
          business_context: remote.business_context || defaults.business_context,
          ...(remote.extra || {}),
        } as Settings);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function upd<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  const str = (key: keyof Settings) => (s[key] as string) ?? "";
  const bool = (key: keyof Settings) => (s[key] as boolean) ?? false;

  async function save() {
    setSaving(true);
    setFeedback(null);
    const { base_prompt, business_context, ...extra } = s;
    try {
      await apiPut("/settings", { base_prompt, business_context, extra });
      setFeedback({ type: "success", text: "Settings saved." });
      setDirty(false);
    } catch {
      setFeedback({ type: "error", text: "Failed to save — check your connection." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6 pb-32">

        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure how Anubis represents your business and generates AI content.</p>
        </div>

        {loadError && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load settings — check your connection.
            </div>
            <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="space-y-3">

          {/* ── Business Identity ── */}
          <Section title="Business Identity" description="Core company info used in communications and documents." defaultOpen>
            <Full>
              <TextInput label="Business Name" value={str("business_name")} onChange={(v) => upd("business_name", v)} placeholder="Apex Roofing & Construction" />
            </Full>
            <TextInput label="Contact Name" value={str("company_contact_name")} onChange={(v) => upd("company_contact_name", v)} placeholder="John Smith" />
            <TextInput label="Phone" value={str("company_phone")} onChange={(v) => upd("company_phone", v)} placeholder="(602) 555-0100" type="tel" />
            <TextInput label="Email" value={str("company_email")} onChange={(v) => upd("company_email", v)} placeholder="info@apexroofing.com" type="email" />
            <TextInput label="Website" value={str("website")} onChange={(v) => upd("website", v)} placeholder="https://apexroofing.com" />
            <TextInput label="License Number" value={str("license_number")} onChange={(v) => upd("license_number", v)} placeholder="ROC-123456" />
            <Full>
              <TextInput label="Address" value={str("company_address")} onChange={(v) => upd("company_address", v)} placeholder="123 Main St, Phoenix, AZ 85001" />
            </Full>
            <Full>
              <TextInput label="Tagline" value={str("tagline")} onChange={(v) => upd("tagline", v)} placeholder="Built right. Built to last." />
            </Full>
            <Full>
              <TextInput label="Logo URL" hint="Direct link to your company logo image." value={str("contractor_logo")} onChange={(v) => upd("contractor_logo", v)} placeholder="https://..." />
            </Full>
          </Section>

          {/* ── AI Behavior ── */}
          <Section title="AI Behavior" description="Controls how the AI writes messages and proposals." defaultOpen>
            <Full>
              <TextArea label="AI Tone & Style" hint="Core instruction for how the AI should write. One or two sentences."
                value={str("base_prompt")} onChange={(v) => upd("base_prompt", v)}
                placeholder="Write in a professional but friendly tone. Be direct and avoid filler words." rows={3} />
            </Full>
            <SelectInput label="Tone" value={str("tone")} onChange={(v) => upd("tone", v)} options={["Professional", "Friendly", "Casual", "Formal", "Empathetic"]} />
            <SelectInput label="Personalization Level" value={str("personalization_level")} onChange={(v) => upd("personalization_level", v)} options={["Low", "Medium", "High"]} />
            <SelectInput label="Follow-up Length" value={str("follow_up_length")} onChange={(v) => upd("follow_up_length", v)} options={["Short", "Medium", "Long"]} />
            <SelectInput label="Upsell Style" value={str("upsell_style")} onChange={(v) => upd("upsell_style", v)} options={["Soft", "Moderate", "Direct"]} />
            <SelectInput label="Proposal Writing Style" value={str("proposal_writing_style")} onChange={(v) => upd("proposal_writing_style", v)} options={["Professional", "Conversational", "Detailed", "Concise"]} />
            <SelectInput label="Reading Level" value={str("reading_level")} onChange={(v) => upd("reading_level", v)} options={["Simple", "Standard", "Technical"]} />
            <Full>
              <Toggle label="Include Compliance Language" hint="Add standard disclaimer / license language to AI-generated content." checked={bool("compliance_language")} onChange={(v) => upd("compliance_language", v)} />
            </Full>
          </Section>

          {/* ── Business Profile ── */}
          <Section title="Business Profile" description="Background about your company the AI uses when generating content.">
            <Full>
              <TextArea label="Business Context" hint="Services, geography, specialties — anything the AI should know."
                value={str("business_context")} onChange={(v) => upd("business_context", v)}
                placeholder="We specialize in commercial flat roofing in the Phoenix metro area. Most projects are $15k–$80k." rows={4} />
            </Full>
            <TextInput label="Business Type" value={str("business_type")} onChange={(v) => upd("business_type", v)} placeholder="General Contractor" />
            <TextInput label="Service Area" value={str("service_area")} onChange={(v) => upd("service_area", v)} placeholder="Phoenix Metro, AZ" />
            <TextInput label="Typical Job Size" value={str("typical_job_size")} onChange={(v) => upd("typical_job_size", v)} placeholder="$15k – $80k" />
            <SelectInput label="Market Focus" value={str("market_focus")} onChange={(v) => upd("market_focus", v)} options={["Residential", "Commercial", "Residential / Commercial / Both", "Industrial"]} />
            <TextInput label="Business Hours" value={str("business_hours")} onChange={(v) => upd("business_hours", v)} placeholder="Mon–Fri 7am–5pm" />
            <TextInput label="Response Time Promise" value={str("response_time_promise")} onChange={(v) => upd("response_time_promise", v)} placeholder="Within 2 business hours" />
            <TextInput label="Preferred Sales Style" value={str("preferred_sales_style")} onChange={(v) => upd("preferred_sales_style", v)} placeholder="Consultative, education-first" />
            <Full>
              <TextArea label="Core Services" value={str("core_services")} onChange={(v) => upd("core_services", v)} placeholder="Roof replacement, flat roofing, gutters, skylights" rows={2} />
            </Full>
            <Full>
              <TextArea label="Internal Notes for AI" hint="Private notes the AI uses but never shows to customers." value={str("internal_notes_for_ai")} onChange={(v) => upd("internal_notes_for_ai", v)} placeholder="Avoid mentioning competitor X. Always emphasize our 10-year warranty." rows={2} />
            </Full>
            <Full>
              <Toggle label="Offers Emergency Service" checked={bool("emergency_service")} onChange={(v) => upd("emergency_service", v)} />
            </Full>
          </Section>

          {/* ── Email & SMS ── */}
          <Section title="Email & SMS" description="Defaults for outbound communications.">
            <Full>
              <TextInput label="Default Email Subject Line" value={str("default_email_subject_line")} onChange={(v) => upd("default_email_subject_line", v)} placeholder="Following up on your project" />
            </Full>
            <Full>
              <TextArea label="Email Signature" value={str("email_signature")} onChange={(v) => upd("email_signature", v)} placeholder="John Smith | Apex Roofing | (602) 555-0100" rows={3} />
            </Full>
            <SelectInput label="SMS Style" value={str("sms_style")} onChange={(v) => upd("sms_style", v)} options={["Friendly", "Professional", "Brief"]} />
            <SelectInput label="Max SMS Length" value={str("max_sms_length")} onChange={(v) => upd("max_sms_length", v)} options={["160", "320", "480", "640"]} />
            <SelectInput label="Greeting Style" value={str("greeting_style")} onChange={(v) => upd("greeting_style", v)} options={["Standard", "Formal", "Casual", "First name only"]} />
            <SelectInput label="Closing Style" value={str("closing_style")} onChange={(v) => upd("closing_style", v)} options={["Standard", "Formal", "Warm", "Brief"]} />
            <Full>
              <Toggle label="Include Price in Messages" hint="Allow AI to reference dollar amounts in generated email/SMS." checked={bool("include_price")} onChange={(v) => upd("include_price", v)} />
            </Full>
            <Full>
              <Toggle label="Include Call-to-Action" hint="AI will end messages with a clear next step." checked={bool("include_cta")} onChange={(v) => upd("include_cta", v)} />
            </Full>
          </Section>

          {/* ── Contact Preferences ── */}
          <Section title="Contact Preferences" description="Defaults for how and when to reach customers.">
            <SelectInput label="Default Contact Method" value={str("default_contact_method_preference")} onChange={(v) => upd("default_contact_method_preference", v)} options={["", "Call", "Text", "Email"]} />
            <TextInput label="Preferred Contact Window" value={str("preferred_contact_window")} onChange={(v) => upd("preferred_contact_window", v)} placeholder="Weekdays 9am–5pm" />
          </Section>

          {/* ── Pipeline Defaults ── */}
          <Section title="Pipeline Defaults" description="Starting values and stale-lead thresholds for new opportunities.">
            <SelectInput label="Default New Status" value={str("default_new_status")} onChange={(v) => upd("default_new_status", v)} options={["Draft", "New", "Contacted"]} />
            <SelectInput label="Default New Milestone" value={str("default_new_milestone")} onChange={(v) => upd("default_new_milestone", v)} options={["Lead", "Site Visit", "Proposal", "Construction"]} />
            <TextInput label="Stale — Lead (days)" value={str("stale_lead_days")} onChange={(v) => upd("stale_lead_days", v)} placeholder="3" type="number" />
            <TextInput label="Stale — Site Visit (days)" value={str("stale_site_visit_days")} onChange={(v) => upd("stale_site_visit_days", v)} placeholder="5" type="number" />
            <TextInput label="Stale — Proposal (days)" value={str("stale_proposal_days")} onChange={(v) => upd("stale_proposal_days", v)} placeholder="5" type="number" />
            <TextInput label="Stale — Construction (days)" value={str("stale_construction_days")} onChange={(v) => upd("stale_construction_days", v)} placeholder="7" type="number" />
            <TextInput label="Aging Threshold (days)" hint="Mark opportunity as old after this many days total." value={str("aging_threshold_days")} onChange={(v) => upd("aging_threshold_days", v)} placeholder="60" type="number" />
            <TextInput label="Opportunity ID Format" value={str("opportunity_id_format")} onChange={(v) => upd("opportunity_id_format", v)} placeholder="YYMMDDXXXX" />
            <Full>
              <div className="space-y-3">
                <Toggle label="Auto-mark Contacted on Email" checked={bool("auto_mark_contacted_email")} onChange={(v) => upd("auto_mark_contacted_email", v)} />
                <Toggle label="Auto-mark Contacted on Text" checked={bool("auto_mark_contacted_text")} onChange={(v) => upd("auto_mark_contacted_text", v)} />
                <Toggle label="Auto-mark Contacted on Call" checked={bool("auto_mark_contacted_call")} onChange={(v) => upd("auto_mark_contacted_call", v)} />
                <Toggle label="Allow Contact Actions on Draft Opportunities" checked={bool("allow_draft_contact_actions")} onChange={(v) => upd("allow_draft_contact_actions", v)} />
              </div>
            </Full>
          </Section>

        </div>

        {feedback && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success" ? "border-green-500/30 bg-green-50 text-green-700" : "border-red-500/30 bg-red-50 text-red-700"
          }`}>
            {feedback.text}
          </div>
        )}

      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {dirty ? "You have unsaved changes" : feedback?.type === "success" ? "All changes saved" : "Settings"}
          </span>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-xl bg-electric px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </main>
  );
}

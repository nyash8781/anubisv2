"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Canonical storage key. Must match the key read by /opportunity/[id]/page.tsx.
// If you rename this, rename it there too. Fixes P1-02 from the initial review.
const storageKey = "anubis_global_settings";

const defaultSettings = {
  company_name: "",
  contractor_logo: "",bg-action text-action-foreground
  company_contact_name: "",
  company_phone: "",
  company_email: "",
  company_address: "",
  website: "",
  license_number: "",
  tagline: "",

  base_prompt:
    "You are helping a contractor write clear, useful, customer-facing communication.",
  business_context: "",
  tone: "Professional",
  personalization_level: "Medium",
  follow_up_length: "Short",
  upsell_style: "Soft",
  proposal_writing_style: "Professional",
  compliance_language: false,
  reading_level: "Standard",

  default_email_subject_line: "Following up on your project",
  email_signature: "",
  include_price: true,
  include_cta: true,
  sms_style: "Friendly",
  max_sms_length: "320",
  greeting_style: "Standard",
  closing_style: "Standard",

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

  milestone_names: "Lead, Site Visit, Proposal, Construction, Completed",
  milestone_order: "Lead, Site Visit, Proposal, Construction, Completed",
  sub_milestone_structure: "",
  stage_color_rules: "",

  default_currency: "USD",
  tax_rate: "",
  proposal_format: "Standard",
  include_scope_page: true,
  include_appendix: false,
  payment_terms: "",
  deposit_percentage: "",
  due_date_default: "",
  proposal_expiration_days: "",
  late_fee_language: "",
  default_line_item_format: "",

  sample_word_doc: "",
  proposal_template: "",
  scope_template: "",
  appendix_template: "",
  contract_template: "",
  bom_template: "",
  submittal_template: "",
  terms_conditions_template: "",
  cover_page_template: "",
  client_welcome_packet_template: "",

  linked_apis: "",
  email_provider: "",
  text_provider: "",
  call_provider: "",
  sender_email: "",
  sender_phone_number: "",
  webhook_status: "",
  api_mode: "Sandbox",

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

  default_contact_method_preference: "",
  preferred_contact_window: "",
  follow_up_cadence: "",
  voicemail_default_outcome: "",

  show_stale_kpi: true,
  show_completed_kpi: true,
  default_homepage_sort: "Newest",
  theme: "Dark",
  accent_color: "Yellow",
  compact_table_mode: false,
  default_landing_page: "Home",

  reminder_delay_after_no_contact: "",
  schedule_email_default: "",
  schedule_text_default: "",
  daily_digest_toggle: false,
  escalation_rule: "",
  due_date_reminder_offset: "",
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/40 bg-card p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}

function ToggleInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export default function InputPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const updateField = (
    field: keyof typeof defaultSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setFeedback("Settings saved successfully.");
    } catch (error) {
      console.error(error);
      setFeedback("Failed to save settings.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold tracking-wide text-action">
              ANUBIS
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black"
          >
            Save Settings
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-border/40 bg-card p-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-action">
            Input / Global Settings
          </div>
          <h1 className="mt-2 text-3xl font-bold">Business Configuration</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage reusable business inputs, AI defaults, workflow rules,
            proposal settings, integrations, and future-facing preferences
            without changing code.
          </p>
          <div className="mt-4 text-sm text-gray-300">{feedback || "Ready"}</div>
        </section>

        <div className="grid gap-6">
          <SettingsSection
            title="Brand and Identity"
            description="Controls how the company appears throughout the app and future documents."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Company Name"
                value={settings.company_name}
                onChange={(v) => updateField("company_name", v)}
              />
              <TextInput
                label="Contractor Logo"
                value={settings.contractor_logo}
                onChange={(v) => updateField("contractor_logo", v)}
                placeholder="Logo URL or file reference"
              />
              <TextInput
                label="Company Contact Name"
                value={settings.company_contact_name}
                onChange={(v) => updateField("company_contact_name", v)}
              />
              <TextInput
                label="Company Phone"
                value={settings.company_phone}
                onChange={(v) => updateField("company_phone", v)}
              />
              <TextInput
                label="Company Email"
                value={settings.company_email}
                onChange={(v) => updateField("company_email", v)}
              />
              <TextInput
                label="Website"
                value={settings.website}
                onChange={(v) => updateField("website", v)}
              />
              <TextInput
                label="License Number"
                value={settings.license_number}
                onChange={(v) => updateField("license_number", v)}
              />
              <TextInput
                label="Tagline / Short Brand Message"
                value={settings.tagline}
                onChange={(v) => updateField("tagline", v)}
              />
            </div>
            <TextAreaInput
              label="Company Address"
              value={settings.company_address}
              onChange={(v) => updateField("company_address", v)}
              rows={3}
            />
          </SettingsSection>

          <SettingsSection
            title="AI Behavior"
            description="Controls how AI thinks, writes, and formats outputs."
          >
            <TextAreaInput
              label="AI Prompts"
              value={settings.base_prompt}
              onChange={(v) => updateField("base_prompt", v)}
              rows={5}
            />
            <TextAreaInput
              label="Business Context"
              value={settings.business_context}
              onChange={(v) => updateField("business_context", v)}
              rows={5}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="Tone"
                value={settings.tone}
                onChange={(v) => updateField("tone", v)}
              />
              <TextInput
                label="Personalization Level"
                value={settings.personalization_level}
                onChange={(v) => updateField("personalization_level", v)}
              />
              <TextInput
                label="Follow-Up Length"
                value={settings.follow_up_length}
                onChange={(v) => updateField("follow_up_length", v)}
              />
              <TextInput
                label="Upsell Style"
                value={settings.upsell_style}
                onChange={(v) => updateField("upsell_style", v)}
              />
              <TextInput
                label="Proposal Writing Style"
                value={settings.proposal_writing_style}
                onChange={(v) => updateField("proposal_writing_style", v)}
              />
              <TextInput
                label="Reading Level"
                value={settings.reading_level}
                onChange={(v) => updateField("reading_level", v)}
              />
            </div>
            <ToggleInput
              label="Compliance / Safety Language"
              checked={settings.compliance_language}
              onChange={(v) => updateField("compliance_language", v)}
            />
          </SettingsSection>

          <SettingsSection
            title="Communication Defaults"
            description="Controls default messaging style for email and text."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Default Email Subject Line"
                value={settings.default_email_subject_line}
                onChange={(v) =>
                  updateField("default_email_subject_line", v)
                }
              />
              <TextInput
                label="SMS Style"
                value={settings.sms_style}
                onChange={(v) => updateField("sms_style", v)}
              />
              <TextInput
                label="Max SMS Length"
                value={settings.max_sms_length}
                onChange={(v) => updateField("max_sms_length", v)}
              />
              <TextInput
                label="Greeting Style"
                value={settings.greeting_style}
                onChange={(v) => updateField("greeting_style", v)}
              />
              <TextInput
                label="Closing Style"
                value={settings.closing_style}
                onChange={(v) => updateField("closing_style", v)}
              />
            </div>
            <TextAreaInput
              label="Email Signature"
              value={settings.email_signature}
              onChange={(v) => updateField("email_signature", v)}
              rows={4}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleInput
                label="Include Price"
                checked={settings.include_price}
                onChange={(v) => updateField("include_price", v)}
              />
              <ToggleInput
                label="Include CTA"
                checked={settings.include_cta}
                onChange={(v) => updateField("include_cta", v)}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Opportunity Workflow Rules"
            description="Controls how opportunities behave in the system."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Default New Opportunity Status"
                value={settings.default_new_status}
                onChange={(v) => updateField("default_new_status", v)}
              />
              <TextInput
                label="Default New Opportunity Milestone"
                value={settings.default_new_milestone}
                onChange={(v) => updateField("default_new_milestone", v)}
              />
              <TextInput
                label="Opportunity ID Format"
                value={settings.opportunity_id_format}
                onChange={(v) => updateField("opportunity_id_format", v)}
              />
              <TextInput
                label="Aging Threshold (days)"
                value={settings.aging_threshold_days}
                onChange={(v) => updateField("aging_threshold_days", v)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <TextInput
                label="Lead Stale Days"
                value={settings.stale_lead_days}
                onChange={(v) => updateField("stale_lead_days", v)}
              />
              <TextInput
                label="Site Visit Stale Days"
                value={settings.stale_site_visit_days}
                onChange={(v) => updateField("stale_site_visit_days", v)}
              />
              <TextInput
                label="Proposal Stale Days"
                value={settings.stale_proposal_days}
                onChange={(v) => updateField("stale_proposal_days", v)}
              />
              <TextInput
                label="Construction Stale Days"
                value={settings.stale_construction_days}
                onChange={(v) => updateField("stale_construction_days", v)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleInput
                label="Auto-Mark Contacted on Email"
                checked={settings.auto_mark_contacted_email}
                onChange={(v) => updateField("auto_mark_contacted_email", v)}
              />
              <ToggleInput
                label="Auto-Mark Contacted on Text"
                checked={settings.auto_mark_contacted_text}
                onChange={(v) => updateField("auto_mark_contacted_text", v)}
              />
              <ToggleInput
                label="Auto-Mark Contacted on Call"
                checked={settings.auto_mark_contacted_call}
                onChange={(v) => updateField("auto_mark_contacted_call", v)}
              />
              <ToggleInput
                label="Allow Draft Contact Actions"
                checked={settings.allow_draft_contact_actions}
                onChange={(v) =>
                  updateField("allow_draft_contact_actions", v)
                }
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Pipeline and Milestones"
            description="Controls project stage names and future lifecycle structure."
          >
            <TextInput
              label="Milestone Names"
              value={settings.milestone_names}
              onChange={(v) => updateField("milestone_names", v)}
            />
            <TextInput
              label="Milestone Order"
              value={settings.milestone_order}
              onChange={(v) => updateField("milestone_order", v)}
            />
            <TextAreaInput
              label="Sub-Milestone Structure"
              value={settings.sub_milestone_structure}
              onChange={(v) => updateField("sub_milestone_structure", v)}
              rows={3}
            />
            <TextAreaInput
              label="Stage Color Rules"
              value={settings.stage_color_rules}
              onChange={(v) => updateField("stage_color_rules", v)}
              rows={3}
            />
          </SettingsSection>

          <SettingsSection
            title="Financial and Proposal Settings"
            description="Controls project financial defaults and future proposal structure."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Default Currency"
                value={settings.default_currency}
                onChange={(v) => updateField("default_currency", v)}
              />
              <TextInput
                label="Tax Rate"
                value={settings.tax_rate}
                onChange={(v) => updateField("tax_rate", v)}
              />
              <TextInput
                label="Proposal Format"
                value={settings.proposal_format}
                onChange={(v) => updateField("proposal_format", v)}
              />
              <TextInput
                label="Payment Terms"
                value={settings.payment_terms}
                onChange={(v) => updateField("payment_terms", v)}
              />
              <TextInput
                label="Deposit Percentage"
                value={settings.deposit_percentage}
                onChange={(v) => updateField("deposit_percentage", v)}
              />
              <TextInput
                label="Due Date Default"
                value={settings.due_date_default}
                onChange={(v) => updateField("due_date_default", v)}
              />
              <TextInput
                label="Proposal Expiration Days"
                value={settings.proposal_expiration_days}
                onChange={(v) => updateField("proposal_expiration_days", v)}
              />
              <TextInput
                label="Default Line Item Format"
                value={settings.default_line_item_format}
                onChange={(v) => updateField("default_line_item_format", v)}
              />
            </div>
            <TextAreaInput
              label="Late Fee Language"
              value={settings.late_fee_language}
              onChange={(v) => updateField("late_fee_language", v)}
              rows={3}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleInput
                label="Include Scope of Work Page"
                checked={settings.include_scope_page}
                onChange={(v) => updateField("include_scope_page", v)}
              />
              <ToggleInput
                label="Include Appendix"
                checked={settings.include_appendix}
                onChange={(v) => updateField("include_appendix", v)}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Business Profile and Operating Context"
            description="Controls broader business information used by workflow and AI."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Business Type"
                value={settings.business_type}
                onChange={(v) => updateField("business_type", v)}
              />
              <TextInput
                label="Service Area"
                value={settings.service_area}
                onChange={(v) => updateField("service_area", v)}
              />
              <TextInput
                label="Typical Job Size"
                value={settings.typical_job_size}
                onChange={(v) => updateField("typical_job_size", v)}
              />
              <TextInput
                label="Core Services"
                value={settings.core_services}
                onChange={(v) => updateField("core_services", v)}
              />
              <TextInput
                label="Market Focus"
                value={settings.market_focus}
                onChange={(v) => updateField("market_focus", v)}
              />
              <TextInput
                label="Business Hours"
                value={settings.business_hours}
                onChange={(v) => updateField("business_hours", v)}
              />
              <TextInput
                label="Response Time Promise"
                value={settings.response_time_promise}
                onChange={(v) => updateField("response_time_promise", v)}
              />
              <TextInput
                label="Preferred Sales Style"
                value={settings.preferred_sales_style}
                onChange={(v) => updateField("preferred_sales_style", v)}
              />
            </div>
            <TextAreaInput
              label="Internal Notes for AI"
              value={settings.internal_notes_for_ai}
              onChange={(v) => updateField("internal_notes_for_ai", v)}
              rows={4}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleInput
                label="Emergency Service"
                checked={settings.emergency_service}
                onChange={(v) => updateField("emergency_service", v)}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Homepage and UI Preferences"
            description="Controls global display preferences and dashboard emphasis."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Default Homepage Sort"
                value={settings.default_homepage_sort}
                onChange={(v) => updateField("default_homepage_sort", v)}
              />
              <TextInput
                label="Theme"
                value={settings.theme}
                onChange={(v) => updateField("theme", v)}
              />
              <TextInput
                label="Accent Color"
                value={settings.accent_color}
                onChange={(v) => updateField("accent_color", v)}
              />
              <TextInput
                label="Default Landing Page"
                value={settings.default_landing_page}
                onChange={(v) => updateField("default_landing_page", v)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleInput
                label="Show Stale KPI"
                checked={settings.show_stale_kpi}
                onChange={(v) => updateField("show_stale_kpi", v)}
              />
              <ToggleInput
                label="Show Completed KPI"
                checked={settings.show_completed_kpi}
                onChange={(v) => updateField("show_completed_kpi", v)}
              />
              <ToggleInput
                label="Compact Table Mode"
                checked={settings.compact_table_mode}
                onChange={(v) => updateField("compact_table_mode", v)}
              />
            </div>
          </SettingsSection>
        </div>
      </div>
    </main>
  );
}

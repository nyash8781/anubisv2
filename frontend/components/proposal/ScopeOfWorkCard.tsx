'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Proposal, ProposalStatus, AIProposalAction } from '@/types/proposal'
import { PROPOSAL_STATUSES } from '@/lib/services/proposalService'

const AI_ACTIONS: { action: AIProposalAction; label: string }[] = [
  { action: 'rewrite_scope', label: 'Rewrite Professionally' },
  { action: 'client_friendly_version', label: 'Make Client-Friendly' },
  { action: 'more_detailed_version', label: 'Add More Detail' },
  { action: 'identify_missing', label: 'Identify Missing Details' },
  { action: 'generate_assumptions', label: 'Generate Assumptions' },
  { action: 'generate_exclusions', label: 'Generate Exclusions' },
  { action: 'generate_bom', label: 'Generate BOM' },
]

interface Props {
  proposal: Proposal
  onChange: (updates: Partial<Proposal>) => void
  onRequestAI: (action: AIProposalAction) => void
}

export function ScopeOfWorkCard({ proposal, onChange, onRequestAI }: Props) {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'client' | 'internal'>('client')

  function upd<K extends keyof Proposal>(key: K, value: Proposal[K]) {
    onChange({ [key]: value })
  }

  return (
    <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Scope of Work</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {proposal.title || 'Untitled proposal'} &middot;{' '}
              <span className="capitalize">{proposal.status}</span>
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/40 px-5 py-5 space-y-5">
          {/* AI Quick Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_ACTIONS.map(({ action, label }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onRequestAI(action)}
                  className="flex items-center gap-1 rounded-full border border-border/40 bg-background px-2.5 py-1 text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Sparkles className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposal metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Proposal Title" className="sm:col-span-2">
              <input
                value={proposal.title}
                onChange={(e) => upd('title', e.target.value)}
                placeholder="e.g. Deck Replacement — Smith Residence"
                className={INPUT}
              />
            </LabeledField>
            <LabeledField label="Service Type">
              <input
                value={proposal.serviceType}
                onChange={(e) => upd('serviceType', e.target.value)}
                placeholder="e.g. Roofing, Remodel, HVAC"
                className={INPUT}
              />
            </LabeledField>
            <LabeledField label="Status">
              <select
                value={proposal.status}
                onChange={(e) => upd('status', e.target.value as ProposalStatus)}
                className={INPUT}
              >
                {PROPOSAL_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </LabeledField>
            <LabeledField label="Est. Start Date">
              <input
                type="date"
                value={proposal.estimatedStartDate}
                onChange={(e) => upd('estimatedStartDate', e.target.value)}
                className={INPUT}
              />
            </LabeledField>
            <LabeledField label="Due Date">
              <input
                type="date"
                value={proposal.dueDate}
                onChange={(e) => upd('dueDate', e.target.value)}
                className={INPUT}
              />
            </LabeledField>
          </div>

          {/* Tab: Client-facing vs Internal */}
          <div>
            <div className="flex border-b border-border/40 mb-4">
              <TabBtn
                label="Client-Facing Content"
                active={activeTab === 'client'}
                onClick={() => setActiveTab('client')}
              />
              <TabBtn
                label="Internal Notes"
                active={activeTab === 'internal'}
                onClick={() => setActiveTab('internal')}
              />
            </div>

            {activeTab === 'client' && (
              <div className="space-y-5">
                <LabeledField
                  label="Scope of Work"
                  hint="Client-facing description of all work to be performed"
                >
                  <textarea
                    value={proposal.scopeOfWork}
                    onChange={(e) => upd('scopeOfWork', e.target.value)}
                    placeholder="Describe the full scope of work in clear, professional language…"
                    rows={5}
                    className={`${INPUT} h-auto resize-none py-2`}
                  />
                </LabeledField>

                <EditableList
                  label="Included Work"
                  hint="Specific items confirmed as included"
                  items={proposal.includedWork}
                  onChange={(v) => upd('includedWork', v)}
                  placeholder="Add an included item…"
                />

                <EditableList
                  label="Assumptions"
                  hint="Conditions assumed true for this proposal"
                  items={proposal.assumptions}
                  onChange={(v) => upd('assumptions', v)}
                  placeholder="Add an assumption…"
                />

                <EditableList
                  label="Exclusions"
                  hint="Work explicitly NOT included in this proposal"
                  items={proposal.exclusions}
                  onChange={(v) => upd('exclusions', v)}
                  placeholder="Add an exclusion…"
                />

                <EditableList
                  label="Client Responsibilities"
                  hint="Tasks/access the client must provide"
                  items={proposal.clientResponsibilities}
                  onChange={(v) => upd('clientResponsibilities', v)}
                  placeholder="Add a client responsibility…"
                />
              </div>
            )}

            {activeTab === 'internal' && (
              <LabeledField
                label="Internal Notes"
                hint="Not shown to the client — for your team only"
              >
                <textarea
                  value={proposal.internalNotes}
                  onChange={(e) => upd('internalNotes', e.target.value)}
                  placeholder="Internal notes, reminders, concerns, pricing rationale…"
                  rows={5}
                  className={`${INPUT} h-auto resize-none py-2`}
                />
              </LabeledField>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Internal helpers ────────────────────────────────────────────

const INPUT =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20'

function LabeledField({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function EditableList({
  label,
  hint,
  items,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setInput('')
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg border border-border/40 bg-background px-3 py-2"
            >
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
              <span className="flex-1 text-sm text-foreground">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="flex-shrink-0 rounded p-0.5 text-muted-foreground transition hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder ?? 'Add item…'}
          className={INPUT}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="shrink-0 gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  )
}

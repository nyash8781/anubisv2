'use client'

import { useState } from 'react'
import { Sparkles, Copy, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAIAction } from '@/lib/services/aiProposalService'
import type {
  AIProposalAction,
  Proposal,
  BOMItem,
  ContractorProposalSettings,
} from '@/types/proposal'

const ACTIONS: {
  action: AIProposalAction
  label: string
  placeholder?: boolean
  description: string
}[] = [
  { action: 'generate_scope', label: 'Generate Scope', description: 'Draft scope from job info' },
  { action: 'rewrite_scope', label: 'Rewrite Scope', description: 'Make it more professional' },
  { action: 'identify_missing', label: 'Identify Missing Details', description: 'Find gaps in scope' },
  { action: 'generate_bom', label: 'Generate BOM', description: 'Build materials list from scope' },
  { action: 'generate_assumptions', label: 'Generate Assumptions', description: 'Standard project assumptions' },
  { action: 'generate_exclusions', label: 'Generate Exclusions', description: 'List what is not included' },
  { action: 'generate_email', label: 'Generate Email', description: 'Client-facing follow-up email' },
  { action: 'generate_sms', label: 'Generate SMS', description: 'Short text notification' },
  { action: 'generate_summary', label: 'Generate Proposal Summary', description: 'Executive summary' },
  { action: 'compare_proposals', label: 'Compare Proposals', description: 'Compare uploaded docs', placeholder: true },
  { action: 'extract_scope_from_doc', label: 'Extract Scope from Document', description: 'Pull scope from uploaded file', placeholder: true },
  { action: 'extract_pricing_from_doc', label: 'Extract Pricing from Document', description: 'Pull pricing from uploaded file', placeholder: true },
]

type ApplyTarget = 'scope' | 'assumptions' | 'exclusions' | 'bom'

interface Props {
  proposal: Proposal
  bomItems: BOMItem[]
  proposalSettings: ContractorProposalSettings
  onApply: (target: ApplyTarget, content: string) => void
}

export function AIAssistantHubCard({ proposal, bomItems, proposalSettings, onApply }: Props) {
  const [open, setOpen] = useState(true)
  const [selectedAction, setSelectedAction] = useState<AIProposalAction>('generate_scope')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currentAction = ACTIONS.find((a) => a.action === selectedAction)!

  async function run() {
    setGenerating(true)
    setResult(null)
    setError(null)
    try {
      const res = await runAIAction(
        selectedAction,
        proposal,
        bomItems,
        proposalSettings,
        customPrompt || undefined
      )
      setResult(res.output)
    } catch (e) {
      setError('Failed to generate — please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
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
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">AI Assistant Hub</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Generate content — review before applying
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
          {/* Action grid */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map(({ action, label, placeholder }) => (
                <button
                  key={action}
                  type="button"
                  disabled={placeholder}
                  onClick={() => setSelectedAction(action)}
                  title={placeholder ? 'Available in Option C' : undefined}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedAction === action
                      ? 'border-primary bg-primary/10 text-primary'
                      : placeholder
                      ? 'border-border/40 bg-background text-muted-foreground opacity-50 cursor-not-allowed'
                      : 'border-border/40 bg-background text-foreground hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {label}
                  {placeholder && (
                    <span className="ml-1 text-[10px] opacity-70">soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected action info */}
          <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold text-foreground">{currentAction.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{currentAction.description}</p>
          </div>

          {/* Custom prompt */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Custom Prompt{' '}
              <span className="font-normal text-muted-foreground">(optional — overrides default)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Leave blank to use the default prompt for this action…"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Run button */}
          <Button
            onClick={run}
            disabled={generating || currentAction.placeholder}
            className="gap-2 bg-electric text-white hover:opacity-90"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Generating…' : `Run: ${currentAction.label}`}
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Output */}
          {result && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/40 bg-background">
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    AI Output — Review Before Applying
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap px-4 py-3 text-sm text-foreground font-sans leading-6 max-h-60 overflow-y-auto">
                  {result}
                </pre>
              </div>

              {/* Apply buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Apply Output To:
                </p>
                <div className="flex flex-wrap gap-2">
                  <ApplyButton label="Add to Scope" onClick={() => onApply('scope', result)} />
                  <ApplyButton label="Add to Assumptions" onClick={() => onApply('assumptions', result)} />
                  <ApplyButton label="Add to Exclusions" onClick={() => onApply('exclusions', result)} />
                  <ApplyButton label="Add to BOM" onClick={() => onApply('bom', result)} />
                  <button
                    onClick={() => setResult(null)}
                    className="rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ApplyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
    >
      {label}
    </button>
  )
}

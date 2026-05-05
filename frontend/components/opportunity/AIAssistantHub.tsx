'use client'

import { useState } from 'react'
import { Sparkles, Mail, MessageSquare } from 'lucide-react'
import type { Job } from '@/types/job'

type AIAssistantHubProps = {
  job: Pick<Job, 'generated_follow_up' | 'generated_upsell'>
  generating: boolean
  aiTab: string
  setAiTab: (t: string) => void
  onGenerate: () => void
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function CopyButton({ text }: { text?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={`text-xs font-semibold transition ${
        copied ? 'text-green-600' : 'text-muted-foreground hover:text-primary'
      }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// [AI HOOK] Future: add tone selector, custom prompt override, regenerate single section
// [API INTEGRATION] Phase 2: stream response via /generate-job-insights?stream=true

export function AIAssistantHub({
  job,
  generating,
  aiTab,
  setAiTab,
  onGenerate,
}: AIAssistantHubProps) {
  return (
    <div className="space-y-4">
      {/* Suggested Actions */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested Actions
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setAiTab('Email')
              onGenerate()
            }}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
          >
            <Mail className="h-3.5 w-3.5" />
            Generate Email
          </button>
          <button
            onClick={() => {
              setAiTab('SMS / Scripts')
              onGenerate()
            }}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Generate SMS
          </button>
        </div>
      </div>

      {/* Tab bar + Generate button */}
      <div className="flex items-center justify-between">
        <TabBar tabs={['Email', 'SMS / Scripts']} active={aiTab} onChange={setAiTab} />
        <button
          onClick={onGenerate}
          disabled={generating}
          className="ml-3 flex shrink-0 items-center gap-1.5 rounded-xl bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* Output panel */}
      {aiTab === 'Email' && (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Follow-Up Email
            </span>
            <CopyButton text={job.generated_follow_up} />
          </div>
          <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-sm leading-6 text-foreground">
            {job.generated_follow_up || (
              <span className="text-muted-foreground">
                Generate AI content to see follow-up email here.
              </span>
            )}
          </div>
        </div>
      )}

      {aiTab === 'SMS / Scripts' && (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              SMS / Call Script
            </span>
            <CopyButton text={job.generated_upsell} />
          </div>
          <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-sm leading-6 text-foreground">
            {job.generated_upsell || (
              <span className="text-muted-foreground">
                Generate AI content to see SMS/call scripts here.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

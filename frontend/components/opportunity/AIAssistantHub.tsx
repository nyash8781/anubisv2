'use client'

import { useState } from 'react'
import type { Job } from '@/types/job'

type AIAssistantHubProps = {
  job: Pick<Job, 'generated_follow_up' | 'generated_upsell'>
  generating: boolean
  aiTab: string
  setAiTab: (t: string) => void
  onGenerate: () => void
}

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
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
      className={`text-xs font-semibold transition ${copied ? 'text-green-600' : 'text-muted-foreground hover:text-primary'}`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function AIAssistantHub({ job, generating, aiTab, setAiTab, onGenerate }: AIAssistantHubProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TabBar tabs={['Email', 'SMS / Scripts']} active={aiTab} onChange={setAiTab} />
        <button
          onClick={onGenerate}
          disabled={generating}
          className="ml-3 shrink-0 rounded-xl bg-electric px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {generating ? 'Generating…' : '✨ Generate'}
        </button>
      </div>

      {aiTab === 'Email' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Follow-Up Email</span>
              <CopyButton text={job.generated_follow_up} />
            </div>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-sm leading-6 text-foreground">
              {job.generated_follow_up || (
                <span className="text-muted-foreground">Generate AI content to see follow-up email here.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {aiTab === 'SMS / Scripts' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">SMS / Call Script</span>
              <CopyButton text={job.generated_upsell} />
            </div>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-sm leading-6 text-foreground">
              {job.generated_upsell || (
                <span className="text-muted-foreground">Generate AI content to see SMS/call scripts here.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

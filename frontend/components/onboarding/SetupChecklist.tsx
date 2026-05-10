'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import type { Job } from '@/types/job'

type Settings = {
  base_prompt?: string
  business_context?: string
  extra?: Record<string, unknown>
}

type Step = {
  id: string
  title: string
  description: string
  href: string
  done: boolean
}

export function SetupChecklist() {
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiGet<Settings>('/settings').catch(() => ({} as Settings)),
      apiGet<Job[]>('/jobs').catch(() => [] as Job[]),
    ])
      .then(([s, jobs]) => {
        if (!active) return
        setSettings(s)
        const dismissed = Boolean((s.extra as Record<string, unknown> | undefined)?.onboarding_dismissed)
        if (dismissed) {
          setSteps([])
          return
        }
        const businessConfigured = Boolean(s.business_context && s.business_context.trim().length > 0)
        const extra = (s.extra ?? {}) as Record<string, unknown>
        const proposalSettings = extra.proposal_settings as { paymentTerms?: unknown[] } | undefined
        const paymentTermsConfigured = Array.isArray(proposalSettings?.paymentTerms) && proposalSettings!.paymentTerms!.length > 0
        const hasJob = Array.isArray(jobs) && jobs.length > 0
        setSteps([
          {
            id: 'business',
            title: 'Add your business profile',
            description: 'Company name, contact info, and business context for AI personalization.',
            href: '/settings?tab=business',
            done: businessConfigured,
          },
          {
            id: 'payment',
            title: 'Set your payment terms',
            description: 'Default deposit, midpoint, and final installment percentages.',
            href: '/settings?tab=proposal',
            done: paymentTermsConfigured,
          },
          {
            id: 'opportunity',
            title: 'Create your first opportunity',
            description: 'Add a lead or project to start tracking the pipeline.',
            href: '/opportunity/new',
            done: hasJob,
          },
        ])
      })
    return () => { active = false }
  }, [])

  const dismiss = async () => {
    if (dismissing || !settings) return
    setDismissing(true)
    try {
      const nextExtra = { ...(settings.extra ?? {}), onboarding_dismissed: true }
      await apiPut('/settings', {
        base_prompt: settings.base_prompt ?? '',
        business_context: settings.business_context ?? '',
        extra: nextExtra,
      })
      setSteps([])
    } catch {
      setDismissing(false)
    }
  }

  if (!steps || steps.length === 0) return null
  const allDone = steps.every((s) => s.done)
  if (allDone) return null

  const completedCount = steps.filter((s) => s.done).length

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Get Started</div>
          <h2 className="mt-1 font-display text-lg font-normal">Finish setting up Anubis</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {steps.length} complete · takes about 3 minutes
          </p>
        </div>
        <button
          onClick={dismiss}
          disabled={dismissing}
          aria-label="Dismiss setup checklist"
          className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                step.done
                  ? 'border-green-500/20 bg-green-50/50'
                  : 'border-border bg-white hover:border-primary/40'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? 'bg-green-600 text-white'
                    : 'border border-border bg-muted/30 text-muted-foreground'
                }`}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {!step.done && <span className="shrink-0 text-xs text-primary">Start →</span>}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

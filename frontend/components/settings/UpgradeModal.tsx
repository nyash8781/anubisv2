'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

type UpgradeModalProps = {
  open: boolean
  onClose: () => void
  currentPlan: { name: string; slug: string } | null
  usage: Array<{ metricKey: string; used: number; limit: number; percentage: number }>
  limitedMetrics: string[]
}

const PLAN_TIERS = [
  {
    name: 'Trial',
    priceMonthly: 0,
    color: 'bg-gray-50',
    limits: { ai_generations: 50, emails_sent: 100, sms_sent: 50, storage_gb: 5, team_members: 1 },
  },
  {
    name: 'Starter',
    priceMonthly: 49,
    color: 'bg-blue-50',
    limits: { ai_generations: 500, emails_sent: 1000, sms_sent: 500, storage_gb: 50, team_members: 5 },
  },
  {
    name: 'Growth',
    priceMonthly: 149,
    color: 'bg-indigo-50',
    limits: { ai_generations: 2000, emails_sent: 5000, sms_sent: 2000, storage_gb: 200, team_members: 20 },
  },
  {
    name: 'Enterprise',
    priceMonthly: null,
    color: 'bg-purple-50',
    limits: { ai_generations: -1, emails_sent: -1, sms_sent: -1, storage_gb: -1, team_members: -1 },
  },
]

function formatMetricName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function UpgradeModal({ open, onClose, currentPlan, usage, limitedMetrics }: UpgradeModalProps) {
  const currentPlanData = PLAN_TIERS.find((p) => p.name.toLowerCase() === currentPlan?.slug)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <DialogTitle>Usage Limit Approaching</DialogTitle>
          </div>
          <DialogDescription>
            You're approaching or have exceeded your usage limits. Upgrade your plan to continue using these features.
          </DialogDescription>
        </DialogHeader>

        {/* Metrics at risk */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Metrics at Risk</h3>
          <div className="space-y-2">
            {usage.map((metric) => {
              if (metric.percentage < 80) return null
              return (
                <div key={metric.metricKey} className="rounded-lg bg-amber-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{formatMetricName(metric.metricKey)}</span>
                    <span className="text-sm font-semibold text-amber-700">
                      {metric.used} / {metric.limit === -1 ? '∞' : metric.limit}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600"
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-700 mt-1">{metric.percentage}% used</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Plan comparison */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {PLAN_TIERS.map((plan) => {
              const isCurrent = plan.name.toLowerCase() === currentPlan?.slug
              return (
                <div
                  key={plan.name}
                  className={`rounded-lg border-2 p-4 ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  {plan.priceMonthly !== null ? (
                    <p className="text-lg font-bold text-primary">${plan.priceMonthly}/mo</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Custom pricing</p>
                  )}

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>AI: {plan.limits.ai_generations === -1 ? '∞' : plan.limits.ai_generations}</p>
                    <p>Emails: {plan.limits.emails_sent === -1 ? '∞' : plan.limits.emails_sent}</p>
                    <p>Storage: {plan.limits.storage_gb === -1 ? '∞' : plan.limits.storage_gb} GB</p>
                  </div>

                  {isCurrent && (
                    <div className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Current Plan
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button variant="default" asChild>
            <a href="/pricing">Upgrade Now</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

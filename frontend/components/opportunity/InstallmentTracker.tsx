'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { fmtMoney } from './utils'
import type { PaymentTerm } from '@/types/proposal'
import { requestPayment, type Payment } from '@/lib/services/paymentService'

type InstallmentTrackerProps = {
  opportunityId?: number | string
  bid?: string | number
  price?: string | number
  paymentsReceived?: string | number
  paymentTerms?: PaymentTerm[]
  onPaymentRequested?: (payment: Payment) => void
}

const DEFAULT_TERMS: PaymentTerm[] = [
  { id: 'deposit',   label: 'Deposit',       percentage: 30, description: 'Before work begins', dueTrigger: 'Before work begins' },
  { id: 'midpoint',  label: 'Midpoint',      percentage: 40, description: 'At midpoint',        dueTrigger: 'At midpoint'        },
  { id: 'final',     label: 'Final Payment', percentage: 30, description: 'On completion',      dueTrigger: 'On completion'      },
]

export function InstallmentTracker({
  opportunityId,
  bid,
  price,
  paymentsReceived,
  paymentTerms,
  onPaymentRequested,
}: InstallmentTrackerProps) {
  const bidAmount = Number(bid || price) || 0
  const paid = Number(paymentsReceived) || 0
  const terms = (paymentTerms && paymentTerms.length > 0) ? paymentTerms : DEFAULT_TERMS
  const [requestingId, setRequestingId] = useState<string | null>(null)

  if (bidAmount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Set a bid or price to see the installment breakdown.
      </p>
    )
  }

  async function handleRequest(term: PaymentTerm, amount: number) {
    if (!opportunityId) {
      toast.info('Save the opportunity first before requesting payment.')
      return
    }
    setRequestingId(term.id)
    const toastId = toast.loading(`Requesting ${term.label} payment…`)
    try {
      const res = await requestPayment({
        opportunityId: Number(opportunityId),
        amount,
        description: `${term.label} (${term.percentage}%)`,
      })
      onPaymentRequested?.(res.payment)
      if (res.stripeConfigured && res.stripeUrl) {
        toast.success('Payment request created — Stripe link ready.', { id: toastId })
        // Open the Stripe link in a new tab so the contractor can copy/share it
        window.open(res.stripeUrl, '_blank', 'noopener')
      } else {
        toast.success('Payment request recorded. Configure Stripe to enable payment links.', { id: toastId })
      }
    } catch (err) {
      console.error('Payment request failed:', err)
      toast.error(`Failed to request payment — ${err instanceof Error ? err.message : 'try again'}`, { id: toastId })
    } finally {
      setRequestingId(null)
    }
  }

  let runningPct = 0
  return (
    <div className="space-y-2">
      {terms.map((term) => {
        const fraction = (Number(term.percentage) || 0) / 100
        const amount = bidAmount * fraction
        runningPct += Number(term.percentage) || 0
        const cumulative = bidAmount * (runningPct / 100)
        const isPaid = paid >= cumulative
        const isRequesting = requestingId === term.id
        return (
          <div
            key={term.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              isPaid ? 'border-green-500/20 bg-green-50' : 'border-border bg-muted/20'
            }`}
          >
            <div>
              <div className="text-sm font-semibold text-foreground">
                {term.label} ({term.percentage}%)
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {fmtMoney(amount)}{term.dueTrigger ? ` · ${term.dueTrigger}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                  isPaid
                    ? 'border-green-500/30 bg-green-100 text-green-700'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              >
                {isPaid ? 'Paid' : 'Due'}
              </span>
              {!isPaid && (
                <button
                  onClick={() => handleRequest(term, amount)}
                  disabled={isRequesting}
                  className="rounded-lg border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isRequesting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isRequesting ? 'Requesting…' : 'Request'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

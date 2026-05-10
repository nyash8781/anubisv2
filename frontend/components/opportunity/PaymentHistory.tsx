'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react'
import {
  listPaymentsForOpportunity,
  markPaymentManually,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Payment,
} from '@/lib/services/paymentService'
import { fmtMoney } from './utils'

interface Props {
  opportunityId?: number | string
  // Bumping this triggers a re-fetch (parent flips it after a new payment request)
  refreshKey?: number
}

export function PaymentHistory({ opportunityId, refreshKey = 0 }: Props) {
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    if (!opportunityId) {
      setPayments([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    listPaymentsForOpportunity(opportunityId)
      .then((rows) => { if (active) setPayments(rows) })
      .catch((err) => {
        console.error('Failed to load payments:', err)
        if (active) setPayments([])
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [opportunityId, refreshKey])

  async function handleMarkPaid(paymentId: string) {
    setMarking(paymentId)
    const toastId = toast.loading('Marking as paid…')
    try {
      const updated = await markPaymentManually(paymentId, { status: 'manual', notes: 'Manually marked paid' })
      setPayments((prev) => prev ? prev.map((p) => p.id === updated.id ? updated : p) : prev)
      toast.success('Payment marked as paid.', { id: toastId })
    } catch (err) {
      console.error('Mark paid failed:', err)
      toast.error('Failed to mark paid.', { id: toastId })
    } finally {
      setMarking(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading payment history…
      </div>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment requests yet. Use the Installment Tracker above to request a payment.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => {
        const statusLabel = PAYMENT_STATUS_LABELS[p.status] ?? p.status
        const statusClass = PAYMENT_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'
        const isOpen = p.status === 'requested' || p.status === 'pending'
        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{fmtMoney(p.amount)}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground truncate">
                {p.description || 'Payment request'}
                {' · '}
                Requested {new Date(p.requestedAt).toLocaleDateString()}
                {p.paidAt && (<> · Paid {new Date(p.paidAt).toLocaleDateString()}</>)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {p.stripePaymentLinkUrl && isOpen && (
                <a
                  href={p.stripePaymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition"
                >
                  <ExternalLink className="h-3 w-3" />
                  Stripe
                </a>
              )}
              {isOpen && (
                <button
                  onClick={() => handleMarkPaid(p.id)}
                  disabled={marking === p.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                  title="Mark this payment as received (cash, check, ACH, etc.)"
                >
                  {marking === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

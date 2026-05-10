// Payment service — backend-backed.
// Backend rows are snake_case; this layer normalizes to camelCase for the UI.

import { apiGet, apiPost } from '@/lib/api'

export type PaymentStatus = 'requested' | 'pending' | 'succeeded' | 'failed' | 'refunded' | 'manual'

export type Payment = {
  id: string
  opportunityId: number
  proposalId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  description: string
  stripePaymentLinkId: string | null
  stripePaymentLinkUrl: string | null
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  metadata: Record<string, unknown>
  requestedAt: string
  paidAt: string | null
  failedAt: string | null
  refundedAt: string | null
  createdAt: string
  updatedAt: string
}

type PaymentRow = {
  id: string
  opportunity_id: number
  proposal_id: string | null
  amount: number | string
  currency: string
  status: PaymentStatus
  description: string
  stripe_payment_link_id: string | null
  stripe_payment_link_url: string | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  metadata: Record<string, unknown>
  requested_at: string
  paid_at: string | null
  failed_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

function num(v: number | string | null | undefined, d = 0): number {
  if (v === null || v === undefined) return d
  if (typeof v === 'number') return v
  const parsed = parseFloat(v)
  return Number.isFinite(parsed) ? parsed : d
}

function rowToPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    opportunityId: Number(r.opportunity_id),
    proposalId: r.proposal_id,
    amount: num(r.amount),
    currency: r.currency || 'usd',
    status: r.status,
    description: r.description || '',
    stripePaymentLinkId: r.stripe_payment_link_id,
    stripePaymentLinkUrl: r.stripe_payment_link_url,
    stripeSessionId: r.stripe_session_id,
    stripePaymentIntentId: r.stripe_payment_intent_id,
    metadata: r.metadata || {},
    requestedAt: r.requested_at,
    paidAt: r.paid_at,
    failedAt: r.failed_at,
    refundedAt: r.refunded_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listPaymentsForOpportunity(opportunityId: number | string): Promise<Payment[]> {
  const rows = await apiGet<PaymentRow[]>(`/payments?opportunity_id=${encodeURIComponent(String(opportunityId))}`)
  return (rows || []).map(rowToPayment)
}

export type PaymentRequestInput = {
  opportunityId: number
  proposalId?: string
  amount: number
  currency?: string
  description?: string
}

export type PaymentRequestResponse = {
  payment: Payment
  stripeUrl: string | null
  stripeConfigured: boolean
  message: string
}

export async function requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResponse> {
  const res = await apiPost<{
    payment: PaymentRow
    stripe_url: string | null
    stripe_configured: boolean
    message: string
  }>('/payments/request', {
    opportunity_id: input.opportunityId,
    proposal_id: input.proposalId ?? null,
    amount: input.amount,
    currency: input.currency || 'usd',
    description: input.description || '',
  })
  return {
    payment: rowToPayment(res.payment),
    stripeUrl: res.stripe_url,
    stripeConfigured: res.stripe_configured,
    message: res.message,
  }
}

export async function markPaymentManually(
  paymentId: string,
  payload: { status: PaymentStatus; paid_at?: string; notes?: string }
): Promise<Payment> {
  const row = await apiPost<PaymentRow>(`/payments/${paymentId}/mark`, payload)
  return rowToPayment(row)
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  requested: 'Requested',
  pending: 'Pending',
  succeeded: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  manual: 'Paid (manual)',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  requested: 'bg-amber-100 text-amber-800',
  pending: 'bg-blue-100 text-blue-800',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
  manual: 'bg-green-100 text-green-800',
}

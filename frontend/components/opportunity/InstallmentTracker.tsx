'use client'

import { fmtMoney } from './utils'

type InstallmentTrackerProps = {
  bid?: string | number
  price?: string | number
  paymentsReceived?: string | number
  onRequest: () => void
}

const INSTALLMENTS = [
  { label: 'Deposit (30%)', fraction: 0.3, cumFraction: 0.3 },
  { label: 'Midpoint (40%)', fraction: 0.4, cumFraction: 0.7 },
  { label: 'Final Payment (30%)', fraction: 0.3, cumFraction: 1.0 },
]

export function InstallmentTracker({
  bid,
  price,
  paymentsReceived,
  onRequest,
}: InstallmentTrackerProps) {
  const bidAmount = Number(bid || price) || 0
  const paid = Number(paymentsReceived) || 0

  return (
    <div className="space-y-2">
      {INSTALLMENTS.map((inst) => {
        const amount = bidAmount * inst.fraction
        const cumulative = bidAmount * inst.cumFraction
        const isPaid = paid >= cumulative
        return (
          <div
            key={inst.label}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              isPaid ? 'border-green-500/20 bg-green-50' : 'border-border bg-muted/20'
            }`}
          >
            <div>
              <div className="text-sm font-semibold text-foreground">{inst.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{fmtMoney(amount)}</div>
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
                  onClick={onRequest}
                  className="rounded-lg border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/5"
                >
                  Request
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

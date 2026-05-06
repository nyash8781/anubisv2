'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import type {
  BOMItem,
  Proposal,
  ContractorProposalSettings,
  PricingSnapshot,
  BOMItemCategory,
} from '@/types/proposal'
import {
  calculatePricing,
  formatCurrency,
  ALL_CATEGORIES,
} from '@/lib/services/pricingService'
import { BOM_CATEGORY_LABELS } from '@/lib/services/bomService'

interface Props {
  items: BOMItem[]
  proposal: Proposal
  proposalSettings: ContractorProposalSettings
  onChange: (updates: Partial<Proposal>) => void
}

export function PricingSummaryCard({
  items,
  proposal,
  proposalSettings,
  onChange,
}: Props) {
  const [open, setOpen] = useState(true)

  const pricing = calculatePricing(
    items,
    proposal.taxRate,
    proposal.discountAmount,
    proposal.taxEnabled
  )

  const paymentTerms = proposalSettings.paymentTerms

  return (
    <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Pricing Summary</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Total: <span className="font-bold text-primary">{formatCurrency(pricing.total)}</span>
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
        <div className="border-t border-border/40 px-5 py-5 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Cost breakdown by category */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cost by Category
              </p>
              <div className="space-y-1.5">
                {ALL_CATEGORIES.filter((c) => pricing.byCategory[c] > 0).map((cat) => (
                  <CategoryRow
                    key={cat}
                    label={BOM_CATEGORY_LABELS[cat]}
                    value={pricing.byCategory[cat]}
                  />
                ))}
                {ALL_CATEGORIES.every((c) => pricing.byCategory[c] === 0) && (
                  <p className="text-sm text-muted-foreground">No included items yet.</p>
                )}
              </div>
            </div>

            {/* Right: Totals + adjustments */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Totals
              </p>
              <div className="space-y-3">
                <TotalRow label="Subtotal" value={pricing.subtotal} />

                {/* Tax settings */}
                <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">Tax</span>
                    <Toggle
                      checked={proposal.taxEnabled}
                      onChange={(v) => onChange({ taxEnabled: v })}
                    />
                  </div>
                  {proposal.taxEnabled && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">Rate (%)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={proposal.taxRate}
                          onChange={(e) => onChange({ taxRate: Number(e.target.value) })}
                          className="h-7 w-24 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <TotalRow
                        label={`Taxable Subtotal`}
                        value={pricing.taxableSubtotal}
                        small
                      />
                      <TotalRow
                        label={`Tax (${proposal.taxRate}%)`}
                        value={pricing.taxAmount}
                        small
                      />
                    </>
                  )}
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">Discount ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposal.discountAmount}
                    onChange={(e) => onChange({ discountAmount: Number(e.target.value) })}
                    className="h-7 w-24 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none focus:border-primary"
                  />
                </div>
                {proposal.discountAmount > 0 && (
                  <TotalRow label="Discount Applied" value={-proposal.discountAmount} />
                )}

                {/* Grand total */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(pricing.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms Breakdown */}
          {pricing.total > 0 && paymentTerms.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment Schedule (from Proposal Settings)
              </p>
              <div className="space-y-2">
                {paymentTerms.map((term) => {
                  const amount = pricing.total * (term.percentage / 100)
                  return (
                    <div
                      key={term.id}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-background px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {term.label} — {term.percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">{term.dueTrigger}</p>
                      </div>
                      <span className="text-base font-bold text-primary">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function CategoryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{formatCurrency(value)}</span>
    </div>
  )
}

function TotalRow({
  label,
  value,
  small,
}: {
  label: string
  value: number
  small?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        {label}
      </span>
      <span
        className={`${small ? 'text-xs' : 'text-sm'} font-medium ${
          value < 0 ? 'text-green-600' : 'text-foreground'
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

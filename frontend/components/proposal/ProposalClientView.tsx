'use client'

// Shared client-facing proposal view.
// Used by:
//   - ProposalPreviewModal (contractor preview, in-app)
//   - /p/[token] public route (homeowner client, no auth)
//   - DEFERRED: PDF generation (Browserless will render this same component)
//
// CRITICAL: this component MUST NOT receive or render unit_cost, markup_value,
// markup_amount, internal_notes, or any internal-cost fields. The backend
// publicProposalDTO already strips those; this component is the second line of
// defense.

import { formatCurrency } from '@/lib/services/pricingService'

// A "client view item" is the public DTO shape: only safe-to-show fields.
export type ClientViewItem = {
  id: string
  item_name: string
  description?: string
  category?: string
  quantity: number | string
  unit?: string
  total: number | string
  optional?: boolean
  sort_order?: number
}

// A "client view proposal" is the public DTO shape — no internal cost fields.
export type ClientViewProposal = {
  id: string
  proposal_number: string
  title: string
  customer_name?: string
  customer_email?: string
  service_type?: string
  status?: string
  estimated_start_date?: string
  due_date?: string
  expires_at?: string | null
  scope_of_work?: string
  included_work?: string[]
  assumptions?: string[]
  exclusions?: string[]
  client_responsibilities?: string[]
  subtotal?: number | string
  tax_enabled?: boolean
  tax_rate?: number | string
  tax_amount?: number | string
  discount_amount?: number | string
  total: number | string
  sent_at?: string | null
  approved_at?: string | null
}

export type BusinessProfileSnapshot = {
  companyName?: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  businessAddress?: string
  licenseNumber?: string
  insuranceInfo?: string
  logoUrl?: string
}

export type LegalTextBlocks = {
  warrantyLanguage?: string
  changeOrderLanguage?: string
  pricingDisclaimer?: string
  expirationLanguage?: string
}

export type PaymentTermSnapshot = {
  id: string
  label: string
  percentage: number
  description?: string
  dueTrigger?: string
}

interface Props {
  proposal: ClientViewProposal
  items: ClientViewItem[]
  businessProfile?: BusinessProfileSnapshot
  legal?: LegalTextBlocks
  paymentTerms?: PaymentTermSnapshot[]
  // When true, omits things like the Anubis logo, Print/Download buttons, etc.
  // — strictly the proposal content. Used inside the preview modal.
  bare?: boolean
}

function num(v: number | string | null | undefined, d = 0): number {
  if (v === null || v === undefined) return d
  if (typeof v === 'number') return v
  const parsed = parseFloat(v)
  return Number.isFinite(parsed) ? parsed : d
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

export function ProposalClientView({
  proposal,
  items,
  businessProfile,
  legal,
  paymentTerms,
  bare = false,
}: Props) {
  const includedItems = items.filter((i) => !i.optional).sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)))
  const optionalItems = items.filter((i) => i.optional).sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)))
  const total = num(proposal.total)
  const subtotal = num(proposal.subtotal)
  const taxAmount = num(proposal.tax_amount)
  const discountAmount = num(proposal.discount_amount)

  return (
    <article className={`bg-white text-foreground ${bare ? '' : 'rounded-2xl shadow-lg'} mx-auto max-w-3xl`}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="border-b border-border px-8 py-6 flex items-start justify-between gap-4">
        <div>
          {businessProfile?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessProfile.logoUrl} alt={businessProfile.companyName || 'Logo'} className="h-12 mb-3" />
          )}
          <div className="font-display text-2xl">{businessProfile?.companyName || 'Your Company'}</div>
          {businessProfile?.businessAddress && (
            <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{businessProfile.businessAddress}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1 space-x-2">
            {businessProfile?.email && <span>{businessProfile.email}</span>}
            {businessProfile?.phone && <span>· {businessProfile.phone}</span>}
            {businessProfile?.website && <span>· {businessProfile.website}</span>}
          </div>
          {(businessProfile?.licenseNumber || businessProfile?.insuranceInfo) && (
            <div className="text-[11px] text-muted-foreground mt-1">
              {businessProfile?.licenseNumber && `License #${businessProfile.licenseNumber}`}
              {businessProfile?.licenseNumber && businessProfile?.insuranceInfo && ' · '}
              {businessProfile?.insuranceInfo}
            </div>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="font-bold uppercase tracking-[0.2em] text-primary">Proposal</div>
          <div className="mt-1 text-foreground font-semibold">{proposal.proposal_number || '—'}</div>
          {proposal.sent_at && <div className="mt-1">Sent {fmtDate(proposal.sent_at)}</div>}
          {proposal.expires_at && <div>Valid until {fmtDate(proposal.expires_at)}</div>}
        </div>
      </header>

      {/* ── Title + Customer ─────────────────────────────────────────── */}
      <section className="px-8 pt-6 pb-4 space-y-3">
        <h1 className="font-display text-3xl font-normal">
          {proposal.title || proposal.service_type || 'Project Proposal'}
        </h1>
        {(proposal.customer_name || proposal.customer_email) && (
          <div className="text-sm">
            <div className="text-muted-foreground">Prepared for</div>
            <div className="font-medium">{proposal.customer_name || proposal.customer_email}</div>
            {proposal.customer_name && proposal.customer_email && (
              <div className="text-xs text-muted-foreground">{proposal.customer_email}</div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground pt-2">
          {proposal.estimated_start_date && (
            <div><span className="font-semibold text-foreground">Est. start:</span> {fmtDate(proposal.estimated_start_date)}</div>
          )}
          {proposal.due_date && (
            <div><span className="font-semibold text-foreground">Target completion:</span> {fmtDate(proposal.due_date)}</div>
          )}
        </div>
      </section>

      {/* ── Scope of Work ────────────────────────────────────────────── */}
      {proposal.scope_of_work && (
        <section className="px-8 py-4 border-t border-border">
          <h2 className="font-display text-lg mb-2">Scope of Work</h2>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{proposal.scope_of_work}</p>
        </section>
      )}

      {/* ── Lists: Included / Assumptions / Exclusions / Client Responsibilities ─ */}
      <ListSection label="Included Work" items={proposal.included_work} />
      <ListSection label="Assumptions" items={proposal.assumptions} />
      <ListSection label="Exclusions" items={proposal.exclusions} />
      <ListSection label="Client Responsibilities" items={proposal.client_responsibilities} />

      {/* ── Line items ───────────────────────────────────────────────── */}
      {includedItems.length > 0 && (
        <section className="px-8 py-4 border-t border-border">
          <h2 className="font-display text-lg mb-3">Line Items</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider">
              <tr className="border-b border-border">
                <th className="text-left py-2 font-semibold">Item</th>
                <th className="text-right py-2 font-semibold w-20">Qty</th>
                <th className="text-right py-2 font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {includedItems.map((it) => (
                <tr key={it.id} className="border-b border-border/40">
                  <td className="py-2.5">
                    <div className="font-medium">{it.item_name}</div>
                    {it.description && <div className="text-xs text-muted-foreground mt-0.5">{it.description}</div>}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">{num(it.quantity)} {it.unit || ''}</td>
                  <td className="text-right py-2.5 font-semibold tabular-nums">{formatCurrency(num(it.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {optionalItems.length > 0 && (
        <section className="px-8 py-4 border-t border-border">
          <h2 className="font-display text-lg mb-3">Optional Add-ons</h2>
          <table className="w-full text-sm">
            <tbody>
              {optionalItems.map((it) => (
                <tr key={it.id} className="border-b border-border/40">
                  <td className="py-2.5">
                    <div className="font-medium">{it.item_name}</div>
                    {it.description && <div className="text-xs text-muted-foreground mt-0.5">{it.description}</div>}
                  </td>
                  <td className="text-right py-2.5 tabular-nums">{num(it.quantity)} {it.unit || ''}</td>
                  <td className="text-right py-2.5 font-semibold tabular-nums">{formatCurrency(num(it.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">Optional items are not included in the total below.</p>
        </section>
      )}

      {/* ── Pricing summary ─────────────────────────────────────────── */}
      <section className="px-8 py-4 border-t border-border bg-muted/10">
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-1 text-muted-foreground">Subtotal</td><td className="py-1 text-right tabular-nums">{formatCurrency(subtotal)}</td></tr>
            {proposal.tax_enabled && (
              <tr><td className="py-1 text-muted-foreground">Tax ({num(proposal.tax_rate)}%)</td><td className="py-1 text-right tabular-nums">{formatCurrency(taxAmount)}</td></tr>
            )}
            {discountAmount > 0 && (
              <tr><td className="py-1 text-muted-foreground">Discount</td><td className="py-1 text-right tabular-nums">−{formatCurrency(discountAmount)}</td></tr>
            )}
            <tr className="border-t border-border">
              <td className="py-2 font-display text-lg">Total</td>
              <td className="py-2 text-right tabular-nums font-display text-lg font-semibold text-primary">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Payment schedule ────────────────────────────────────────── */}
      {paymentTerms && paymentTerms.length > 0 && total > 0 && (
        <section className="px-8 py-4 border-t border-border">
          <h2 className="font-display text-lg mb-2">Payment Schedule</h2>
          <ul className="text-sm space-y-1.5">
            {paymentTerms.map((term) => {
              const amount = total * ((Number(term.percentage) || 0) / 100)
              return (
                <li key={term.id} className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1">
                  <span>
                    <span className="font-medium">{term.label}</span>{' '}
                    <span className="text-muted-foreground">({term.percentage}%)</span>
                    {term.dueTrigger && <span className="text-xs text-muted-foreground"> · {term.dueTrigger}</span>}
                  </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(amount)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Legal text blocks ───────────────────────────────────────── */}
      {(legal?.warrantyLanguage || legal?.changeOrderLanguage || legal?.pricingDisclaimer || legal?.expirationLanguage) && (
        <section className="px-8 py-4 border-t border-border space-y-3 text-xs text-muted-foreground">
          <h2 className="font-display text-lg text-foreground">Terms</h2>
          {legal?.warrantyLanguage && <div><div className="font-semibold text-foreground">Warranty</div><p className="mt-0.5 whitespace-pre-line">{legal.warrantyLanguage}</p></div>}
          {legal?.changeOrderLanguage && <div><div className="font-semibold text-foreground">Change Orders</div><p className="mt-0.5 whitespace-pre-line">{legal.changeOrderLanguage}</p></div>}
          {legal?.pricingDisclaimer && <div><div className="font-semibold text-foreground">Pricing</div><p className="mt-0.5 whitespace-pre-line">{legal.pricingDisclaimer}</p></div>}
          {legal?.expirationLanguage && <div><div className="font-semibold text-foreground">Expiration</div><p className="mt-0.5 whitespace-pre-line">{legal.expirationLanguage}</p></div>}
        </section>
      )}

      {!bare && (
        <footer className="px-8 py-6 border-t border-border text-center text-xs text-muted-foreground">
          Generated by {businessProfile?.companyName || 'Anubis'}
        </footer>
      )}
    </article>
  )
}

function ListSection({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <section className="px-8 py-4 border-t border-border">
      <h2 className="font-display text-lg mb-2">{label}</h2>
      <ul className="text-sm space-y-1 list-disc list-inside text-foreground">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  )
}

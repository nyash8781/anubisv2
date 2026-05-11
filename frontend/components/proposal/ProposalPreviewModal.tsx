'use client'

import { useRef } from 'react'
import { X, Printer, FileDown, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  Proposal,
  BOMItem,
  ContractorProposalSettings,
  PricingSnapshot,
} from '@/types/proposal'
import { formatCurrency } from '@/lib/services/pricingService'
import { generateProposalPdf } from '@/lib/services/pdfService'

interface Props {
  open: boolean
  onClose: () => void
  proposal: Proposal
  bomItems: BOMItem[]
  proposalSettings: ContractorProposalSettings
  pricing: PricingSnapshot
  onMarkReady: () => void
}

export function ProposalPreviewModal({
  open,
  onClose,
  proposal,
  bomItems,
  proposalSettings,
  pricing,
  onMarkReady,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const bp = {
    logoUrl: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    businessAddress: '',
    licenseNumber: '',
  }
  const textBlocks = proposalSettings.defaultTextBlocks
  const paymentTerms = proposalSettings.paymentTerms
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const includedItems = bomItems.filter((i) => i.included && !i.optional)
  const optionalItems = bomItems.filter((i) => i.optional)

  async function handleGeneratePdf() {
    const result = await generateProposalPdf(proposal.id, proposal)
    if (!result.success) {
      alert(result.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-background shadow-2xl mt-4 mb-8">
        {/* Modal toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border/40 bg-background/95 backdrop-blur-sm px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Proposal Preview</p>
            <p className="text-xs text-muted-foreground">
              Client-facing view &mdash; Modern template
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGeneratePdf}
              className="gap-1.5"
              title="PDF export coming in next phase"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF (Option C)
            </Button>
            {proposal.status !== 'ready' && (
              <Button
                size="sm"
                onClick={onMarkReady}
                className="gap-1.5 bg-electric text-white hover:opacity-90"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Ready
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div ref={printRef} className="px-8 py-8 space-y-8 print:p-0">
          {/* Company header */}
          <div className="flex items-start justify-between border-b border-border/40 pb-6">
            <div>
              {bp.logoUrl ? (
                <img
                  src={bp.logoUrl}
                  alt={bp.companyName}
                  className="h-12 w-auto mb-2 object-contain"
                />
              ) : (
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg">
                  {(bp.companyName || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="font-display text-xl font-bold text-foreground">
                {bp.companyName || 'Your Company Name'}
              </h2>
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {bp.contactName && <p>{bp.contactName}</p>}
                {bp.phone && <p>{bp.phone}</p>}
                {bp.email && <p>{bp.email}</p>}
                {bp.website && <p>{bp.website}</p>}
                {bp.businessAddress && <p>{bp.businessAddress}</p>}
                {bp.licenseNumber && <p>Lic # {bp.licenseNumber}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Proposal
              </p>
              <p className="text-2xl font-bold text-foreground font-display">
                {proposal.proposalNumber || '—'}
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>Date: {today}</p>
                {proposal.estimatedStartDate && (
                  <p>Est. Start: {proposal.estimatedStartDate}</p>
                )}
              </div>
              <div className="mt-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    proposal.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : proposal.status === 'ready' || proposal.status === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {proposal.status}
                </span>
              </div>
            </div>
          </div>

          {/* Proposal title */}
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {proposal.title || 'Untitled Proposal'}
            </h1>
            {proposal.serviceType && (
              <p className="mt-1 text-muted-foreground">{proposal.serviceType}</p>
            )}
          </div>

          {/* Scope of Work */}
          {proposal.scopeOfWork && (
            <PreviewSection title="Scope of Work">
              <p className="text-sm text-foreground leading-7 whitespace-pre-wrap">
                {proposal.scopeOfWork}
              </p>
            </PreviewSection>
          )}

          {/* Included Work */}
          {proposal.includedWork.length > 0 && (
            <PreviewSection title="Included Work">
              <ul className="space-y-1">
                {proposal.includedWork.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {/* BOM summary (included items, no pricing details) */}
          {includedItems.length > 0 && (
            <PreviewSection title="Materials & Work Summary">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">Item</th>
                      <th className="pb-2 pr-4">Category</th>
                      <th className="pb-2 pr-4 text-right">Qty</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {includedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 pr-4 text-foreground font-medium">{item.itemName}</td>
                        <td className="py-2 pr-4 text-muted-foreground capitalize">
                          {item.category}
                        </td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 text-right font-semibold text-foreground">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PreviewSection>
          )}

          {/* Optional items */}
          {optionalItems.length > 0 && (
            <PreviewSection title="Optional Add-Ons">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-border/20">
                  {optionalItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-4 text-foreground">{item.itemName}</td>
                      <td className="py-2 text-right font-semibold text-muted-foreground">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PreviewSection>
          )}

          {/* Pricing summary */}
          <PreviewSection title="Investment Summary">
            <div className="space-y-2 max-w-xs ml-auto">
              <PricingRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
              {pricing.taxAmount > 0 && (
                <PricingRow label="Tax" value={formatCurrency(pricing.taxAmount)} />
              )}
              {pricing.discountAmount > 0 && (
                <PricingRow
                  label="Discount"
                  value={`(${formatCurrency(pricing.discountAmount)})`}
                />
              )}
              <div className="flex justify-between border-t border-border/40 pt-2">
                <span className="font-bold text-foreground text-base">Total Investment</span>
                <span className="font-bold text-primary text-xl">
                  {formatCurrency(pricing.total)}
                </span>
              </div>
            </div>
          </PreviewSection>

          {/* Payment terms */}
          {pricing.total > 0 && paymentTerms.length > 0 && (
            <PreviewSection title="Payment Schedule">
              <div className="space-y-2">
                {paymentTerms.map((term) => (
                  <div key={term.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {term.label} ({term.percentage}%) &mdash; {term.dueTrigger}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(pricing.total * (term.percentage / 100))}
                    </span>
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {/* Assumptions */}
          {proposal.assumptions.length > 0 && (
            <PreviewSection title="Assumptions">
              <ListSection items={proposal.assumptions} />
            </PreviewSection>
          )}

          {/* Exclusions */}
          {proposal.exclusions.length > 0 && (
            <PreviewSection title="Exclusions">
              <ListSection items={proposal.exclusions} />
            </PreviewSection>
          )}

          {/* Legal text blocks */}
          {textBlocks.warrantyLanguage && (
            <PreviewSection title="Warranty">
              <p className="text-sm text-foreground leading-6">{textBlocks.warrantyLanguage}</p>
            </PreviewSection>
          )}

          {textBlocks.changeOrderLanguage && (
            <PreviewSection title="Change Orders">
              <p className="text-sm text-foreground leading-6">{textBlocks.changeOrderLanguage}</p>
            </PreviewSection>
          )}

          {textBlocks.pricingDisclaimer && (
            <p className="text-xs text-muted-foreground border-t border-border/40 pt-4">
              {textBlocks.pricingDisclaimer}
            </p>
          )}

          {/* Signature placeholder */}
          <PreviewSection title="Authorization">
            <div className="grid grid-cols-2 gap-8">
              <SignatureLine label="Client Signature" />
              <SignatureLine label="Contractor Signature" />
            </div>
          </PreviewSection>
        </div>
      </div>
    </div>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-base font-bold text-foreground border-b border-border/40 pb-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ListSection({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function PricingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="mt-12 border-t border-foreground/40" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <div className="mt-3 border-t border-foreground/40" />
      <p className="mt-1 text-xs text-muted-foreground">Date</p>
    </div>
  )
}

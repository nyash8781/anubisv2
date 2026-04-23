'use client'

import { useState } from 'react'
import { Plus, Printer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type LineItem = {
  id: number
  description: string
  qty: number
  unitPrice: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

let _id = 1
const newItem = (): LineItem => ({
  id: _id++,
  description: '',
  qty: 1,
  unitPrice: 0,
})

const INPUT =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-ring'

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ProposalPage() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [items, setItems] = useState<LineItem[]>([newItem()])
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState(
    'Payment due within 30 days of invoice. A deposit is required before work begins.',
  )

  const add = () => setItems((p) => [...p, newItem()])
  const remove = (id: number) => setItems((p) => p.filter((i) => i.id !== id))
  const update = (id: number, field: keyof LineItem, val: string | number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: val } : i)))

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {/* Header */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-action">
                Proposals
              </div>
              <h1 className="mt-1 text-3xl font-bold">Proposal Builder</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill in the details below, then print or save as PDF.
              </p>
            </div>
            <Button onClick={() => window.print()} className="shrink-0 gap-2">
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </section>

        {/* Proposal info */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Proposal Info
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Proposal Title" className="md:col-span-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deck Replacement — Smith Residence"
                className={INPUT}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Client Name">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Smith"
                className={INPUT}
              />
            </Field>
            <Field label="Client Email">
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="john@email.com"
                className={INPUT}
              />
            </Field>
            <Field label="Client Address">
              <input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="123 Main St, City, State 00000"
                className={INPUT}
              />
            </Field>
          </div>
        </section>

        {/* Line items */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Line Items
            </h2>
            <Button variant="outline" size="sm" onClick={add} className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4 font-semibold">Description</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Qty</th>
                  <th className="pb-3 pr-4 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="pb-3 pr-4 text-right font-semibold">Total</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">
                      <input
                        value={item.description}
                        onChange={(e) =>
                          update(item.id, 'description', e.target.value)
                        }
                        placeholder="Service or material description"
                        className={INPUT}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          update(item.id, 'qty', Number(e.target.value))
                        }
                        className={`${INPUT} w-20 text-right`}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          update(item.id, 'unitPrice', Number(e.target.value))
                        }
                        className={`${INPUT} w-28 text-right`}
                      />
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-action">
                      {fmt(item.qty * item.unitPrice)}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => remove(item.id)}
                        disabled={items.length === 1}
                        className="rounded-md p-1 text-muted-foreground transition hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Tax (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className={`${INPUT} w-20 text-right`}
                />
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold">{fmt(tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-2">
                <span className="font-bold">Total</span>
                <span className="text-lg font-bold text-action">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Scope of work, inclusions/exclusions, estimated timeline…"
            rows={4}
            className={`${INPUT} h-auto resize-none py-2`}
          />
        </section>

        {/* Terms */}
        <section className="rounded-2xl border border-border/40 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Terms &amp; Conditions
          </h2>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={3}
            className={`${INPUT} h-auto resize-none py-2`}
          />
        </section>
      </div>
    </main>
  )
}

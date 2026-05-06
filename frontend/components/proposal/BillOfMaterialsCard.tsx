'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BOMItem, BOMItemCategory, BOMItemMarkupType } from '@/types/proposal'
import {
  createDefaultBOMItem,
  updateItemField,
  duplicateItem,
  BOM_CATEGORY_LABELS,
  BOM_SOURCE_LABELS,
  CONFIDENCE_LABELS,
} from '@/lib/services/bomService'
import { recalcItem, formatCurrency } from '@/lib/services/pricingService'

interface Props {
  items: BOMItem[]
  onChange: (items: BOMItem[]) => void
  onRequestAI: () => void
}

const CATEGORIES = Object.keys(BOM_CATEGORY_LABELS) as BOMItemCategory[]
const MARKUP_TYPES: BOMItemMarkupType[] = ['none', 'percent', 'fixed']
const UNITS = ['ea', 'sqft', 'lf', 'hr', 'day', 'lot', 'lb', 'gal', 'ton', 'other']

export function BillOfMaterialsCard({ items, onChange, onRequestAI }: Props) {
  const [open, setOpen] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<string>('all')

  function addItem() {
    const item = recalcItem(createDefaultBOMItem(items.length))
    onChange([...items, item])
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }

  function dupItem(id: string) {
    onChange(duplicateItem(items, id))
  }

  function updateItem(id: string, field: keyof BOMItem, value: unknown) {
    onChange(updateItemField(items, id, field, value))
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearAIDraftItems() {
    onChange(items.filter((i) => i.source !== 'ai_generated'))
  }

  function acceptAllAIDraftItems() {
    onChange(items.map((i) => (i.source === 'ai_generated' ? { ...i, source: 'manual' } : i)))
  }

  const aiDraftCount = items.filter((i) => i.source === 'ai_generated').length
  const filtered =
    filterCategory === 'all' ? items : items.filter((i) => i.category === filterCategory)

  return (
    <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Bill of Materials</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''}
              {aiDraftCount > 0 && (
                <span className="ml-1.5 text-amber-600">
                  · {aiDraftCount} AI draft{aiDraftCount !== 1 ? 's' : ''}
                </span>
              )}
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
        <div className="border-t border-border/40">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border/20">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRequestAI}
                className="gap-1 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate BOM from Scope
              </Button>
              {aiDraftCount > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={acceptAllAIDraftItems}
                    className="gap-1 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Accept AI Items ({aiDraftCount})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAIDraftItems}
                    className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Clear AI Drafts
                  </Button>
                </>
              )}
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BOM_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No items yet. Add one manually or generate from scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border/20 bg-muted/20 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="w-6 px-3 py-2" />
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2 text-right">Unit Cost</th>
                    <th className="px-3 py-2">Markup</th>
                    <th className="px-2 py-2 text-center">Tax</th>
                    <th className="px-2 py-2 text-center">Opt</th>
                    <th className="px-2 py-2 text-center">Inc</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filtered.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`transition hover:bg-muted/10 ${
                          item.source === 'ai_generated'
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => toggleRow(item.id)}
                            className="text-muted-foreground transition hover:text-foreground"
                          >
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${
                                expandedRows.has(item.id) ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        </td>

                        {/* Item name */}
                        <td className="px-3 py-2">
                          <input
                            value={item.itemName}
                            onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                            placeholder="Item name"
                            className={CELL_INPUT}
                          />
                        </td>

                        {/* Category */}
                        <td className="px-3 py-2">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updateItem(item.id, 'category', e.target.value as BOMItemCategory)
                            }
                            className={CELL_SELECT}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {BOM_CATEGORY_LABELS[c]}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, 'quantity', Number(e.target.value))
                            }
                            className={`${CELL_INPUT} w-16 text-right`}
                          />
                        </td>

                        {/* Unit */}
                        <td className="px-3 py-2">
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className={`${CELL_SELECT} w-16`}
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Unit cost */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateItem(item.id, 'unitCost', Number(e.target.value))
                            }
                            className={`${CELL_INPUT} w-24 text-right`}
                          />
                        </td>

                        {/* Markup */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <select
                              value={item.markupType}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  'markupType',
                                  e.target.value as BOMItemMarkupType
                                )
                              }
                              className={`${CELL_SELECT} w-14`}
                            >
                              {MARKUP_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t === 'none' ? '—' : t === 'percent' ? '%' : '$'}
                                </option>
                              ))}
                            </select>
                            {item.markupType !== 'none' && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.markupValue}
                                onChange={(e) =>
                                  updateItem(item.id, 'markupValue', Number(e.target.value))
                                }
                                className={`${CELL_INPUT} w-16 text-right`}
                              />
                            )}
                          </div>
                        </td>

                        {/* Taxable */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => updateItem(item.id, 'taxable', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                        </td>

                        {/* Optional */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.optional}
                            onChange={(e) => updateItem(item.id, 'optional', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                        </td>

                        {/* Included */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={(e) => updateItem(item.id, 'included', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                        </td>

                        {/* Total */}
                        <td className="px-3 py-2 text-right text-sm font-semibold text-primary whitespace-nowrap">
                          {item.included
                            ? formatCurrency(item.total)
                            : <span className="text-muted-foreground line-through text-xs">{formatCurrency(item.total)}</span>
                          }
                        </td>

                        {/* Source badge */}
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                              item.source === 'ai_generated'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {BOM_SOURCE_LABELS[item.source]}
                            {item.source === 'ai_generated' &&
                              ` · ${CONFIDENCE_LABELS[item.confidence]}`}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => dupItem(item.id)}
                              className="rounded p-1 text-muted-foreground transition hover:text-foreground"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1 text-muted-foreground transition hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedRows.has(item.id) && (
                        <tr className="bg-muted/10">
                          <td />
                          <td colSpan={12} className="px-3 py-3">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <DetailField label="Description">
                                <input
                                  value={item.description}
                                  onChange={(e) =>
                                    updateItem(item.id, 'description', e.target.value)
                                  }
                                  placeholder="Item description"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Room / Area">
                                <input
                                  value={item.roomOrArea}
                                  onChange={(e) =>
                                    updateItem(item.id, 'roomOrArea', e.target.value)
                                  }
                                  placeholder="e.g. Kitchen"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Phase">
                                <input
                                  value={item.phase}
                                  onChange={(e) =>
                                    updateItem(item.id, 'phase', e.target.value)
                                  }
                                  placeholder="e.g. Rough-in"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Vendor">
                                <input
                                  value={item.vendor}
                                  onChange={(e) =>
                                    updateItem(item.id, 'vendor', e.target.value)
                                  }
                                  placeholder="Vendor name"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Model">
                                <input
                                  value={item.model}
                                  onChange={(e) =>
                                    updateItem(item.id, 'model', e.target.value)
                                  }
                                  placeholder="Model #"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="SKU">
                                <input
                                  value={item.sku}
                                  onChange={(e) =>
                                    updateItem(item.id, 'sku', e.target.value)
                                  }
                                  placeholder="SKU"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Notes">
                                <input
                                  value={item.notes}
                                  onChange={(e) =>
                                    updateItem(item.id, 'notes', e.target.value)
                                  }
                                  placeholder="Client-facing notes"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                              <DetailField label="Internal Notes">
                                <input
                                  value={item.internalNotes}
                                  onChange={(e) =>
                                    updateItem(item.id, 'internalNotes', e.target.value)
                                  }
                                  placeholder="Internal only"
                                  className={CELL_INPUT}
                                />
                              </DetailField>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer total */}
          {items.length > 0 && (
            <div className="flex justify-end px-5 py-3 border-t border-border/20">
              <span className="text-sm text-muted-foreground mr-2">Included Total:</span>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(
                  items
                    .filter((i) => i.included)
                    .reduce((s, i) => s + i.total, 0)
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

const CELL_INPUT =
  'h-7 w-full min-w-[80px] rounded border border-input bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20'

const CELL_SELECT =
  'h-7 rounded border border-input bg-background px-1 text-xs text-foreground outline-none transition focus:border-primary'

function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

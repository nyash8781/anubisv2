import type { BOMItem, BOMItemCategory, BOMItemSource, BOMItemConfidence } from '@/types/proposal'
import { recalcItem } from './pricingService'

export function createDefaultBOMItem(sortOrder: number): BOMItem {
  return {
    id: crypto.randomUUID(),
    itemName: '',
    description: '',
    category: 'material',
    roomOrArea: '',
    phase: '',
    vendor: '',
    model: '',
    sku: '',
    quantity: 1,
    unit: 'ea',
    unitCost: 0,
    markupType: 'none',
    markupValue: 0,
    taxable: false,
    optional: false,
    included: true,
    subtotal: 0,
    markupAmount: 0,
    total: 0,
    source: 'manual',
    confidence: 'high',
    notes: '',
    internalNotes: '',
    sortOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function updateItemField(
  items: BOMItem[],
  id: string,
  field: keyof BOMItem,
  value: unknown
): BOMItem[] {
  return items.map((item) => {
    if (item.id !== id) return item
    const updated = { ...item, [field]: value, updatedAt: new Date().toISOString() }
    // Recalculate computed fields when pricing-relevant fields change
    const pricingFields: (keyof BOMItem)[] = [
      'quantity',
      'unitCost',
      'markupType',
      'markupValue',
    ]
    if (pricingFields.includes(field)) return recalcItem(updated)
    return updated
  })
}

export function duplicateItem(items: BOMItem[], id: string): BOMItem[] {
  const source = items.find((i) => i.id === id)
  if (!source) return items
  const clone: BOMItem = {
    ...source,
    id: crypto.randomUUID(),
    sortOrder: items.length,
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return [...items, clone]
}

// Note: BOM persistence is handled atomically by proposalService.saveProposal —
// items travel with the proposal in a single backend round-trip. The legacy
// load/save helpers that read/wrote localStorage are gone.

export const BOM_CATEGORY_LABELS: Record<BOMItemCategory, string> = {
  material: 'Material',
  equipment: 'Equipment',
  labor: 'Labor',
  subcontractor: 'Subcontractor',
  permit: 'Permit',
  design: 'Design',
  travel: 'Travel',
  fee: 'Fee',
  allowance: 'Allowance',
  other: 'Other',
}

export const BOM_SOURCE_LABELS: Record<BOMItemSource, string> = {
  manual: 'Manual',
  ai_generated: 'AI Draft',
  catalog: 'Catalog',
  document_extract: 'Document',
  vendor_quote: 'Vendor Quote',
}

export const CONFIDENCE_LABELS: Record<BOMItemConfidence, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
  unknown: '—',
}

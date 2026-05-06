import type {
  BOMItem,
  BOMItemCategory,
  PricingSnapshot,
} from '@/types/proposal'

const ALL_CATEGORIES: BOMItemCategory[] = [
  'material',
  'equipment',
  'labor',
  'subcontractor',
  'permit',
  'design',
  'travel',
  'fee',
  'allowance',
  'other',
]

// Recalculate a single BOM item's computed fields
export function recalcItem(item: BOMItem): BOMItem {
  const subtotal = item.quantity * item.unitCost
  let markupAmount = 0
  if (item.markupType === 'percent') {
    markupAmount = subtotal * (item.markupValue / 100)
  } else if (item.markupType === 'fixed') {
    markupAmount = item.markupValue
  }
  const total = subtotal + markupAmount
  return { ...item, subtotal, markupAmount, total }
}

// Compute proposal-level pricing from BOM items
export function calculatePricing(
  items: BOMItem[],
  taxRate: number,
  discountAmount: number,
  taxEnabled: boolean
): PricingSnapshot {
  const included = items.filter((i) => i.included)

  const byCategory = Object.fromEntries(
    ALL_CATEGORIES.map((cat) => [
      cat,
      included
        .filter((i) => i.category === cat)
        .reduce((s, i) => s + i.total, 0),
    ])
  ) as Record<BOMItemCategory, number>

  const subtotal = included.reduce((s, i) => s + i.total, 0)
  const taxableSubtotal = taxEnabled
    ? included.filter((i) => i.taxable).reduce((s, i) => s + i.total, 0)
    : 0
  const taxAmount = taxEnabled ? taxableSubtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount - discountAmount

  return { byCategory, subtotal, taxableSubtotal, taxAmount, discountAmount, total }
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

export { ALL_CATEGORIES }

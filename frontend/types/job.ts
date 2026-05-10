// Canonical Job type — import from here. Do not redefine locally in page files.
// Mirrors backend/schemas.js jobUpsertSchema + normalizeJob output.

export type Milestone = 'Lead' | 'Site Visit' | 'Proposal' | 'Construction' | 'Completed'
export type JobStatus = 'Draft' | 'New' | 'Contacted' | 'Closed'
export type ContactMethod = 'call' | 'text' | 'email' | 'manual'
export type ActionType = ContactMethod | 'completed'
export type ProductionStatus = 'Not Scheduled' | 'Ready' | 'Scheduled' | 'In Progress' | 'Blocked' | 'Complete'
export type PaymentStatus = 'Not Started' | 'Deposit Pending' | 'Deposit Paid' | 'In Progress' | 'Overdue' | 'Paid In Full'
export type DepositStatus = 'N/A' | 'Pending' | 'Paid'

export type JobFlags = {
  isStale: boolean
  isAged: boolean
  agedType: 'aging' | 'old' | null
}

export type Job = {
  id?: number
  opportunity_id?: string

  // Customer
  customer_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile_number_1?: string
  mobile_number_2?: string

  // Address
  address?: string
  address_1?: string
  city?: string
  state?: string
  zip_code?: string

  // Work
  service?: string
  scope_of_work?: string

  // Pricing — stored as text in Phase 1; will migrate to number after 002_numeric_prices.sql
  price?: string | number
  bid?: string | number
  payments_received?: string | number
  balance_due?: string | number
  due_date?: string

  // Notes & workflow
  notes?: string
  milestone?: string   // dynamic — may be any user-defined label, not just Milestone enum
  status?: JobStatus
  contact_status?: string

  // Contact tracking
  last_contacted_date?: string
  last_contact_method?: string

  // AI-generated content (cached on the backend)
  generated_follow_up?: string
  generated_upsell?: string

  // Production workflow (Phase 1)
  production_status?: ProductionStatus
  production_blocker?: string
  production_owner?: string
  scheduled_date?: string

  // Payment status (Phase 1)
  payment_status?: PaymentStatus
  deposit_status?: DepositStatus

  // Timestamps
  created_at?: string
  updated_at?: string

  // Computed by normalizeJob — never stored
  flags?: JobFlags

  // Derived stale/aging fields attached by backend normalizeJob
  is_stale?: boolean
  days_since_contact?: number
}

export const MILESTONE_ORDER: Milestone[] = [
  'Lead',
  'Site Visit',
  'Proposal',
  'Construction',
  'Completed',
]

export const OPEN_MILESTONES: Milestone[] = ['Site Visit', 'Proposal', 'Construction']

export const JOB_STATUSES: JobStatus[] = ['Draft', 'New', 'Contacted', 'Closed']

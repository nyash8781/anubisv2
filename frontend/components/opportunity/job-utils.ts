import { fmtMoney } from './utils'
import type { Job } from '@/types/job'

// ─── Shared UI/business types used across opportunity components ──────────────

export type RiskLevel = 'On Track' | 'At Risk' | 'Urgent'

export type NBAAction = {
  label: string
  description: string
  action: 'call' | 'text' | 'email' | 'manual' | 'completed' | null
} | null

export type ActionType = 'email' | 'text' | 'call' | 'manual' | 'completed'

export type UiMessage = { type: 'success' | 'error' | 'info'; text: string } | null

// ─── ID / display helpers ─────────────────────────────────────────────────────

export function fallbackOpportunityId(job?: Job): string {
  if (!job) return ''
  if (job.opportunity_id) return job.opportunity_id
  const created = job.created_at ? new Date(job.created_at) : new Date()
  const yy = String(created.getFullYear()).slice(-2)
  const mm = String(created.getMonth() + 1).padStart(2, '0')
  const dd = String(created.getDate()).padStart(2, '0')
  const seq = String(job.id || 1).padStart(4, '0')
  return `${yy}${mm}${dd}${seq}`
}

export function titleFromJob(job: Job): string {
  const first = job.first_name?.trim() || ''
  const last = job.last_name?.trim() || ''
  const full = `${first} ${last}`.trim()
  return full || job.customer_name || 'New Opportunity'
}

// Format: Name · City, State · Service
export function clientSummary(job: Job): string {
  const name = titleFromJob(job)
  const location = [job.city, job.state].filter(Boolean).join(', ')
  const service = job.service?.trim() || ''
  return [name, location, service].filter(Boolean).join(' · ')
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

export function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

// ─── Business logic ───────────────────────────────────────────────────────────

export function computeRisk(job: Job): RiskLevel {
  const days = daysUntil(job.due_date)
  const balance = Number(job.balance_due) || 0
  const lastContact = daysSince(job.last_contacted_date)
  if (balance > 0 && days !== null && days < 0) return 'Urgent'
  if (balance > 0 && days !== null && days <= 2) return 'Urgent'
  if (lastContact !== null && lastContact > 7) return 'At Risk'
  if (balance > 0 && days !== null && days <= 7) return 'At Risk'
  return 'On Track'
}

// [AI HOOK] Future: replace rule-based NBA with model inference endpoint
export function computeNBA(job: Job): NBAAction {
  const days = daysUntil(job.due_date)
  const balance = Number(job.balance_due) || 0
  const lastContact = daysSince(job.last_contacted_date)
  if (balance > 0 && days !== null && days < 0)
    return { label: 'Send payment reminder', description: `Payment overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, action: 'email' }
  if (balance > 0 && days !== null && days <= 3)
    return { label: 'Request payment', description: `Due in ${days} day${days === 1 ? '' : 's'}`, action: 'email' }
  if (lastContact !== null && lastContact > 5)
    return { label: 'Follow up with client', description: `Last contacted ${lastContact} days ago`, action: 'call' }
  if (job.milestone === 'Lead')
    return { label: 'Schedule site visit', description: 'Move this lead to the next stage', action: 'call' }
  if (job.milestone === 'Site Visit')
    return { label: 'Send proposal', description: 'Follow up after site visit', action: 'email' }
  if (job.milestone === 'Proposal')
    return { label: 'Follow up on proposal', description: 'Check in with client on proposal status', action: 'call' }
  if (job.milestone === 'Construction')
    return { label: 'Check in on progress', description: 'Update client on project status', action: 'text' }
  return null
}

export function computeProgress(job: Job): { pct: number; paidLabel: string; totalLabel: string } {
  const bid = Number(job.bid || job.price) || 0
  const paid = Number(job.payments_received) || 0
  const pct = bid === 0 ? 0 : Math.min(100, Math.round((paid / bid) * 100))
  return { pct, paidLabel: fmtMoney(paid), totalLabel: fmtMoney(bid) }
}

'use client'

import { useEffect, useState } from 'react'
import { X, Phone, MessageSquare, Mail } from 'lucide-react'
import type { Job } from '@/types/job'
import { InputField } from './InputField'
import { fmtDate } from './utils'
import { RiskBadge } from './RiskBadge'
import type { RiskLevel } from './job-utils'

type Props = {
  open: boolean
  onClose: () => void
  job: Job
  setField: (field: keyof Job, value: string) => void
  onSave: () => void
  saving: boolean
  risk: RiskLevel
  oppId: string
  onLogCall: () => void
  onLogText: () => void
  onLogEmail: () => void
}

const TABS = ['Profile', 'System', 'Notes'] as const
type DrawerTab = (typeof TABS)[number]

export function ClientProfileDrawer({
  open,
  onClose,
  job,
  setField,
  onSave,
  saving,
  risk,
  oppId,
  onLogCall,
  onLogText,
  onLogEmail,
}: Props) {
  const [tab, setTab] = useState<DrawerTab>('Profile')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const displayName = [job.first_name, job.last_name].filter(Boolean).join(' ') || job.customer_name || 'New Client'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Client Profile</div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">{displayName}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border bg-muted/20 px-4 py-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                tab === t
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">

          {tab === 'Profile' && (
            <>
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Personal Info
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="First Name"
                      value={job.first_name}
                      onChange={(v) => setField('first_name', v)}
                    />
                    <InputField
                      label="Last Name"
                      value={job.last_name}
                      onChange={(v) => setField('last_name', v)}
                    />
                  </div>
                  <InputField
                    label="Address"
                    value={job.address_1}
                    onChange={(v) => setField('address_1', v)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label="City" value={job.city} onChange={(v) => setField('city', v)} />
                    <InputField label="State" value={job.state} onChange={(v) => setField('state', v)} />
                    <InputField label="Zip" value={job.zip_code} onChange={(v) => setField('zip_code', v)} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Contact
                </div>
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <InputField
                        label="Mobile #1"
                        value={job.mobile_number_1}
                        onChange={(v) => setField('mobile_number_1', v)}
                      />
                    </div>
                    <div className="flex gap-1 pb-0.5">
                      <button
                        onClick={onLogCall}
                        aria-label="Log call"
                        className="rounded-lg border border-border p-2 transition hover:border-primary hover:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={onLogText}
                        aria-label="Log text"
                        className="rounded-lg border border-border p-2 transition hover:border-primary hover:text-primary"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <InputField
                    label="Mobile #2"
                    value={job.mobile_number_2}
                    onChange={(v) => setField('mobile_number_2', v)}
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <InputField
                        label="Email"
                        value={job.email}
                        onChange={(v) => setField('email', v)}
                      />
                    </div>
                    <button
                      onClick={onLogEmail}
                      aria-label="Log email"
                      className="rounded-lg border border-border p-2 pb-0.5 transition hover:border-primary hover:text-primary"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'System' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Opportunity ID
                  </div>
                  <div className="text-sm font-semibold text-foreground">{oppId || 'Pending'}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Risk Status
                  </div>
                  <RiskBadge level={risk} />
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Last Contacted
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {fmtDate(job.last_contacted_date)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact Method
                  </div>
                  <div className="text-sm font-semibold capitalize text-foreground">
                    {job.last_contact_method || '—'}
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </div>
                <select
                  value={job.status || 'Draft'}
                  onChange={(e) => setField('status', e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  {['Draft', 'New', 'Contacted', 'Closed'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === 'Notes' && (
            <label className="block">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Internal Notes
              </div>
              <textarea
                value={job.notes || ''}
                onChange={(e) => setField('notes', e.target.value)}
                rows={14}
                placeholder="Internal notes, client preferences, follow-up context…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiGet, apiPut } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

type CompanyDetail = {
  company: {
    id: string
    name: string
    ownerEmail: string
    status: string
    createdAt: string
    settings: {
      businessName: string
      serviceArea: string
      basePrompt: string
      businessContext: string
    }
    plan: {
      id: string
      plan_id: string
      started_at: string
      override_limits: Record<string, number>
      plans: {
        id: string
        name: string
        price_monthly: number
      }
    }
    teamCount: number
    teamMembers: Array<{
      id: string
      email: string
      role: string
      status: string
      created_at: string
    }>
    usage: Array<{
      metric_key: string
      total_count: number
      estimated_cost_usd: number
    }>
  }
}

const METRIC_KEYS = ['ai_generations', 'emails_sent', 'sms_sent', 'team_members', 'storage_gb']
const FEATURE_KEYS = ['proposal_builder', 'outreach_studio', 'team_collaboration', 'advanced_analytics']

export default function CompanyDetailPage() {
  const params = useParams()
  const companyId = params.id as string
  const [company, setCompany] = useState<CompanyDetail['company'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Limit overrides state
  const [editingLimits, setEditingLimits] = useState(false)
  const [limitOverrides, setLimitOverrides] = useState<Record<string, number | string | undefined>>({})
  const [limitNotes, setLimitNotes] = useState('')
  const [savingLimits, setSavingLimits] = useState(false)

  // Feature flags state
  const [editingFeatures, setEditingFeatures] = useState(false)
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({})
  const [featureReason, setFeatureReason] = useState('')
  const [savingFeatures, setSavingFeatures] = useState(false)

  // Impersonation state
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    apiGet<CompanyDetail>(`/admin/companies/${companyId}`)
      .then((data) => {
        setCompany(data.company)
        setError(false)
        // Initialize limit overrides
        if (data.company?.plan?.override_limits) {
          setLimitOverrides(data.company.plan.override_limits)
        }
        // Initialize feature toggles (default all enabled)
        const toggles: Record<string, boolean> = {}
        FEATURE_KEYS.forEach(key => {
          toggles[key] = true
        })
        setFeatureToggles(toggles)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [companyId])

  const handleSaveLimitOverrides = async () => {
    setSavingLimits(true)
    try {
      await apiPut(`/admin/companies/${companyId}/limits`, {
        override_limits: limitOverrides,
        notes: limitNotes,
      })
      setEditingLimits(false)
      // Refresh company data
      const data = await apiGet<CompanyDetail>(`/admin/companies/${companyId}`)
      setCompany(data.company)
    } catch (err) {
      console.error('Failed to save limit overrides:', err)
    } finally {
      setSavingLimits(false)
    }
  }

  const handleSaveFeatureToggle = async (featureKey: string) => {
    setSavingFeatures(true)
    try {
      await apiPut(`/admin/companies/${companyId}/features`, {
        feature_key: featureKey,
        enabled: featureToggles[featureKey],
        reason: featureReason,
      })
      setEditingFeatures(false)
      setFeatureReason('')
    } catch (err) {
      console.error('Failed to save feature flag:', err)
    } finally {
      setSavingFeatures(false)
    }
  }

  const handleImpersonate = async () => {
    setImpersonating(true)
    try {
      await apiPut(`/admin/impersonate/${company?.id}`, {})
      // In a real implementation, would redirect to impersonation session
      alert(`Now impersonating: ${company?.ownerEmail}`)
      setShowImpersonateModal(false)
    } catch (err) {
      console.error('Failed to impersonate:', err)
    } finally {
      setImpersonating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <Link href="/admin/companies" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Companies</span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">Failed to load company details.</p>
        </div>
      </div>
    )
  }

  const totalCost = company.usage.reduce((sum, row) => sum + (row.estimated_cost_usd || 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/companies" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Companies</span>
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-foreground">{company.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{company.ownerEmail}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Plan</p>
          <p className="text-lg font-semibold text-foreground">{company.plan?.plans?.name || 'N/A'}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className="text-lg font-semibold text-foreground capitalize">{company.status}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Team Members</p>
          <p className="text-lg font-semibold text-foreground">{company.teamCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Cost This Month</p>
          <p className="text-lg font-semibold text-foreground">${totalCost.toFixed(2)}</p>
        </Card>
      </div>

      {/* Settings */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Company Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Business Name</p>
            <p className="text-foreground font-medium">{company.settings.businessName || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Service Area</p>
            <p className="text-foreground font-medium">{company.settings.serviceArea || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground mb-1">Business Context</p>
            <p className="text-foreground font-medium text-xs bg-muted/30 p-3 rounded-lg font-mono">
              {company.settings.businessContext || '(None)'}
            </p>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Team Members ({company.teamMembers.length})</h3>
        {company.teamMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members.</p>
        ) : (
          <div className="space-y-2">
            {company.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div>
                  <p className="text-foreground font-medium">{member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  member.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Usage */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Usage This Month</h3>
        {company.usage.length === 0 ? (
          <p className="text-sm text-muted-foreground">No usage recorded.</p>
        ) : (
          <div className="space-y-2">
            {company.usage.map((row) => (
              <div key={row.metric_key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <p className="text-foreground font-medium capitalize">{row.metric_key.replace(/_/g, ' ')}</p>
                <div className="text-right">
                  <p className="text-foreground font-semibold">{row.total_count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${row.estimated_cost_usd.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Limit Overrides */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Limit Overrides</h3>
          </div>
          <button
            onClick={() => setEditingLimits(!editingLimits)}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
          >
            {editingLimits ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {!editingLimits ? (
          <div className="space-y-3">
            {Object.keys(limitOverrides).length === 0 ? (
              <p className="text-sm text-muted-foreground">No overrides configured.</p>
            ) : (
              Object.entries(limitOverrides).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                  <p className="text-foreground capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                  <p className="text-foreground font-semibold">{value}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {METRIC_KEYS.map((metric) => (
              <div key={metric}>
                <label className="text-sm text-muted-foreground block mb-1 capitalize">{metric.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  value={limitOverrides[metric] || ''}
                  onChange={(e) =>
                    setLimitOverrides({
                      ...limitOverrides,
                      [metric]: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Leave empty for default limit"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Notes</label>
              <textarea
                value={limitNotes}
                onChange={(e) => setLimitNotes(e.target.value)}
                placeholder="Reason for override..."
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
              />
            </div>
            <button
              onClick={handleSaveLimitOverrides}
              disabled={savingLimits}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-medium text-sm"
            >
              {savingLimits ? 'Saving...' : 'Save Overrides'}
            </button>
          </div>
        )}
      </Card>

      {/* Feature Flags */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Feature Flags</h3>
          </div>
          <button
            onClick={() => setEditingFeatures(!editingFeatures)}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
          >
            {editingFeatures ? 'Cancel' : 'Configure'}
          </button>
        </div>

        {!editingFeatures ? (
          <div className="space-y-2">
            {FEATURE_KEYS.map((feature) => (
              <div key={feature} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <p className="text-foreground font-medium capitalize">{feature.replace(/_/g, ' ')}</p>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Enabled</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {FEATURE_KEYS.map((feature) => (
              <div key={feature} className="flex items-center justify-between">
                <label className="text-sm text-foreground font-medium capitalize">{feature.replace(/_/g, ' ')}</label>
                <button
                  onClick={() =>
                    setFeatureToggles({
                      ...featureToggles,
                      [feature]: !featureToggles[feature],
                    })
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    featureToggles[feature]
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {featureToggles[feature] ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Reason</label>
              <textarea
                value={featureReason}
                onChange={(e) => setFeatureReason(e.target.value)}
                placeholder="Why is this override set?..."
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
              />
            </div>
            <button
              onClick={() => {
                const changedFeature = FEATURE_KEYS.find((f) => featureToggles[f] !== true)
                if (changedFeature) handleSaveFeatureToggle(changedFeature)
              }}
              disabled={savingFeatures}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-medium text-sm"
            >
              {savingFeatures ? 'Saving...' : 'Save Feature Flags'}
            </button>
          </div>
        )}
      </Card>

      {/* Impersonation */}
      <Card className="p-6 border-amber-200 bg-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Impersonation</h3>
              <p className="text-xs text-amber-700 mt-1">Log in as this user for support purposes (audit logged)</p>
            </div>
          </div>
          <button
            onClick={() => setShowImpersonateModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm"
          >
            Impersonate
          </button>
        </div>

        {showImpersonateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
              <h4 className="font-semibold text-foreground mb-2">Impersonate User?</h4>
              <p className="text-sm text-muted-foreground mb-6">
                You are about to impersonate <strong>{company?.ownerEmail}</strong>. This action is fully audit logged. Proceed?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImpersonateModal(false)}
                  className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-muted transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImpersonate}
                  disabled={impersonating}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition font-medium text-sm"
                >
                  {impersonating ? 'Starting...' : 'Impersonate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

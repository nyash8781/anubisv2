'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

type AdminOverview = {
  kpis: {
    activeCompanies: number
    aiCallsThisMonth: number
    estimatedVariableCost: string
  }
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiGet<AdminOverview>('/admin')
      .then((data) => {
        setOverview(data)
        setError(false)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
        <p className="text-sm text-red-700">Failed to load admin overview.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">KPI Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Active Companies</p>
          <p className="text-3xl font-bold text-foreground">{overview.kpis.activeCompanies}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">AI Calls This Month</p>
          <p className="text-3xl font-bold text-foreground">{overview.kpis.aiCallsThisMonth.toLocaleString()}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Est. Variable Cost</p>
          <p className="text-3xl font-bold text-foreground">${overview.kpis.estimatedVariableCost}</p>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-3">Next Steps</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ View all companies in the <a href="/admin/companies" className="text-primary hover:underline">Companies</a> section</li>
          <li>• Wire usage_events logging into AI routes (Phase B)</li>
          <li>• Build entitlementService for usage limit enforcement (Phase C)</li>
          <li>• Add admin company detail page (Phase C)</li>
        </ul>
      </Card>
    </div>
  )
}

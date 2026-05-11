'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  ownerEmail: string
  plan: string
  status: string
  createdAt: string
  lastActive: string
  aiCallsThisMonth: number
}

type CompaniesResponse = {
  companies: Company[]
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiGet<CompaniesResponse>('/admin/companies')
      .then((data) => {
        setCompanies(data.companies || [])
        setError(false)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
        <p className="text-sm text-red-700">Failed to load companies.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Companies</h2>
          <p className="text-sm text-muted-foreground mt-1">{companies.length} registered contractor accounts</p>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No companies yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground">Company</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Owner</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">AI Calls (This Month)</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Last Active</th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-border/40 hover:bg-muted/30 transition">
                  <td className="py-3 px-4">
                    <span className="font-medium text-foreground">{company.name}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{company.ownerEmail}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {company.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      company.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">{company.aiCallsThisMonth.toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(company.lastActive).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition"
                    >
                      <span className="text-xs font-medium">View</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

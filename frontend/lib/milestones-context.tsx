'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export type MilestoneRow = {
  id: string
  label: string
  order_index: number
  stale_days: number
  color: string
  is_terminal: boolean
}

type MilestonesContextValue = {
  milestones: MilestoneRow[]
  milestoneLabels: string[]
  loading: boolean
  refresh: () => void
  createMilestone: (fields: Omit<MilestoneRow, 'id'>) => Promise<void>
  updateMilestone: (id: string, fields: Partial<MilestoneRow>) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>
  reorderMilestones: (order: { id: string; order_index: number }[]) => Promise<void>
}

const MilestonesContext = createContext<MilestonesContextValue | null>(null)

export function MilestonesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [milestones, setMilestones] = useState<MilestoneRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<MilestoneRow[]>('/milestones')
      setMilestones(Array.isArray(data) ? data : [])
    } catch {
      // Fall back to static defaults if API fails (e.g. not yet migrated)
      setMilestones([
        { id: 'lead',         label: 'Lead',         order_index: 0, stale_days: 30, color: '#3B82F6', is_terminal: false },
        { id: 'proposal',     label: 'Proposal',     order_index: 1, stale_days: 30, color: '#F59E0B', is_terminal: false },
        { id: 'construction', label: 'Construction', order_index: 2, stale_days: 14, color: '#F97316', is_terminal: false },
        { id: 'completed',    label: 'Completed',    order_index: 3, stale_days: 0,  color: '#22C55E', is_terminal: true  },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) refresh()
  }, [session, refresh])

  const createMilestone = async (fields: Omit<MilestoneRow, 'id'>) => {
    await apiPost('/milestones', fields)
    await refresh()
  }

  const updateMilestone = async (id: string, fields: Partial<MilestoneRow>) => {
    await apiPut(`/milestones/${id}`, fields)
    await refresh()
  }

  const deleteMilestone = async (id: string) => {
    await apiDelete(`/milestones/${id}`)
    await refresh()
  }

  const reorderMilestones = async (order: { id: string; order_index: number }[]) => {
    await apiPost('/milestones/reorder', { order })
    await refresh()
  }

  const milestoneLabels = milestones.map((m) => m.label)

  return (
    <MilestonesContext.Provider value={{
      milestones, milestoneLabels, loading, refresh,
      createMilestone, updateMilestone, deleteMilestone, reorderMilestones,
    }}>
      {children}
    </MilestonesContext.Provider>
  )
}

export function useMilestones() {
  const ctx = useContext(MilestonesContext)
  if (!ctx) throw new Error('useMilestones must be used inside MilestonesProvider')
  return ctx
}

'use client'

import type { RiskLevel } from './job-utils'

const STYLES: Record<RiskLevel, string> = {
  'On Track': 'border-green-500/30 bg-green-50 text-green-700',
  'At Risk': 'border-orange-400/30 bg-orange-50 text-orange-600',
  Urgent: 'border-red-500/30 bg-red-50 text-red-700',
}

const DOTS: Record<RiskLevel, string> = {
  'On Track': 'bg-green-500',
  'At Risk': 'bg-orange-400',
  Urgent: 'bg-red-500',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[level]}`} />
      {level}
    </span>
  )
}

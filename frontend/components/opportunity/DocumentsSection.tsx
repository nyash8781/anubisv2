'use client'

import { FolderOpen } from 'lucide-react'

export function DocumentsSection() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center space-y-1">
      <FolderOpen className="h-5 w-5 text-muted-foreground mx-auto" />
      <p className="text-sm font-medium text-foreground">No documents yet</p>
      <p className="text-xs text-muted-foreground">
        Document uploads ship in Phase 4.
      </p>
    </div>
  )
}

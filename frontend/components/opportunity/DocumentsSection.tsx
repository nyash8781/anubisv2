'use client'

import { FileText } from 'lucide-react'

export function DocumentsSection() {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/40">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-semibold text-foreground">Documents — Coming in Phase 2</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Contracts, BOMs, photos, and submittals will be attached here once file uploads are enabled.
      </p>
    </div>
  )
}

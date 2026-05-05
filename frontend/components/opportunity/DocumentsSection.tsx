'use client'

import { Upload, FileText } from 'lucide-react'

// [AI HOOK] Future: auto-categorize uploaded files (contract, BOM, photo, submittal)
// [API INTEGRATION] Phase 2: apiUpload('/jobs/:id/documents', formData) via R2/Supabase Storage

export function DocumentsSection() {
  return (
    <div className="space-y-3">
      {/* Upload drop zone — wired in Phase 2 */}
      <div className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/10 p-6 text-center transition hover:border-primary/40 hover:bg-primary/5">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/40">
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm font-semibold text-foreground">Upload Documents</div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag &amp; drop or click — contracts, BOMs, photos, submittals
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Browse Files
        </div>
      </div>

      {/* Uploaded file list — empty state */}
      <div className="rounded-xl border border-border bg-muted/10 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          No documents uploaded yet — file uploads enabled in Phase 2.
        </p>
      </div>
    </div>
  )
}

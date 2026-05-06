'use client'

import { useState, useRef } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Upload,
  Paperclip,
  Trash2,
  Eye,
  Link2,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProposalDocument, ProposalDocumentFileType, ProposalDocumentStatus } from '@/types/proposal'
import { createDocument, FILE_TYPE_LABELS } from '@/lib/services/proposalDocumentService'

const STATUS_COLORS: Record<ProposalDocumentStatus, string> = {
  uploaded: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  linked: 'bg-purple-100 text-purple-700',
  final: 'bg-green-100 text-green-700',
}

interface Props {
  documents: ProposalDocument[]
  onChange: (docs: ProposalDocument[]) => void
  proposalId?: string
}

export function DocumentsCard({ documents, onChange, proposalId }: Props) {
  const [open, setOpen] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  function addFiles(files: File[]) {
    const newDocs: ProposalDocument[] = files.map((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      const fileType: ProposalDocumentFileType =
        ext === 'pdf' || ext === 'doc' || ext === 'docx'
          ? 'proposal'
          : ext === 'png' || ext === 'jpg' || ext === 'jpeg'
          ? 'photo'
          : 'other'

      // NOTE: Real file upload to Supabase Storage happens in Option C.
      // For now we store a local placeholder URL.
      return createDocument(
        f.name,
        fileType,
        URL.createObjectURL(f),
        proposalId
      )
    })
    onChange([...documents, ...newDocs])
  }

  function removeDoc(id: string) {
    onChange(documents.filter((d) => d.id !== id))
  }

  function updateDoc(id: string, field: keyof ProposalDocument, value: unknown) {
    onChange(documents.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  return (
    <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Documents</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {documents.length} file{documents.length !== 1 ? 's' : ''} attached
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/40 px-5 py-5 space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border/40 bg-muted/10 hover:border-primary/40 hover:bg-muted/20'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`h-6 w-6 mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium text-foreground">
              Drop files here or{' '}
              <span className="text-primary underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, images, Word docs &middot; Real upload available in Option C
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border/20 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">File Name</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Linked</th>
                    <th className="pb-2 pr-4">Uploaded</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="transition hover:bg-muted/10">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-foreground truncate max-w-[180px] block">
                          {doc.fileName}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={doc.fileType}
                          onChange={(e) =>
                            updateDoc(
                              doc.id,
                              'fileType',
                              e.target.value as ProposalDocumentFileType
                            )
                          }
                          className="h-7 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
                        >
                          {(Object.keys(FILE_TYPE_LABELS) as ProposalDocumentFileType[]).map(
                            (t) => (
                              <option key={t} value={t}>
                                {FILE_TYPE_LABELS[t]}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            STATUS_COLORS[doc.status]
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <input
                          type="checkbox"
                          checked={doc.linkedToProposal}
                          onChange={(e) =>
                            updateDoc(doc.id, 'linkedToProposal', e.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {/* View — only works for object URLs */}
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-muted-foreground transition hover:text-foreground"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {/* Mark as Final */}
                          <button
                            type="button"
                            onClick={() => updateDoc(doc.id, 'status', 'final')}
                            disabled={doc.status === 'final'}
                            className="rounded p-1 text-muted-foreground transition hover:text-green-600 disabled:opacity-30"
                            title="Mark as Final"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                          {/* AI Placeholder actions */}
                          <button
                            type="button"
                            disabled
                            title="AI Summarize — Option C"
                            className="rounded p-1 text-muted-foreground opacity-40 cursor-not-allowed"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeDoc(doc.id)}
                            className="rounded p-1 text-muted-foreground transition hover:text-destructive"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Option C placeholder notice */}
          <div className="rounded-lg border border-border/20 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold">Option C</span>: Real file upload to Supabase Storage, AI document summarization, scope/pricing extraction, and proposal comparison will be enabled in the next phase.
          </div>
        </div>
      )}
    </section>
  )
}

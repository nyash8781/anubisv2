"use client";

import { Upload, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function UploadsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <FolderOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            Upload and organize project photos, contracts, and documents — with timestamps, geotags, and immutable records for legal protection.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Coming soon. In the meantime, attach documents directly to individual opportunities.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/jobs"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            Go to Opportunities
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * OPPORTUNITY DETAIL PLACEHOLDER
 *
 * Drop AnubisV2's working opportunity page code here. The original file is
 * `frontend/app/opportunity/[id]/page.tsx` in AnubisV2 — paste the full
 * contents into this file.
 *
 * Key things to preserve:
 *   - All apiGet/apiPost/apiPut imports (match lib/api.ts already)
 *   - localStorage key: "anubis_global_settings" (P1-02 fix)
 *   - Flat settings shape: { base_prompt, business_context }
 *   - generateAi payload including system_prompt + business_context
 *   - lifecycle milestone tracker (Lead → Site Visit → Proposal → Construction → Completed)
 *
 * Cosmetic changes to make when you paste:
 *   - Remove top-bar nav (AppShell now)
 *   - bg-yellow-400 → bg-action, text-yellow-400 → text-action (or text-primary — your call)
 *   - bg-[#0b0b0b] → bg-background, bg-[#111111] → bg-card, bg-[#0d0d0d] → bg-muted/40
 */

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const isNew = !id || id === "new";

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="space-y-2">
        <Badge variant="outline" className="rounded-full">Alpha scaffold</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          {isNew ? "New Opportunity" : `Opportunity ${id}`}
        </h1>
        <p className="text-muted-foreground">
          Drop AnubisV2's opportunity page code into{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            frontend/app/(app)/opportunity/[id]/page.tsx
          </code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCode2 className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Preserved features from AnubisV2</CardTitle>
          <CardDescription>Everything that already works — verbatim</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• Customer info (name, address, phone, email)</div>
          <div>• Financials (bid, payments received, balance due, due date)</div>
          <div>• Scope of work + internal notes</div>
          <div>• Milestone lifecycle tracker</div>
          <div>• AI Generate (follow-up + upsell) — reads from settings</div>
          <div>• Send Email / Text / Phone action buttons</div>
          <div>• Mark Contacted / Mark Completed</div>
          <div>• Files &amp; Evidence section (stub — R2 wired in Phase 2)</div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * DASHBOARD PLACEHOLDER
 *
 * Drop AnubisV2's working dashboard code here. See docs/MIGRATION_TODO.md
 * for the exact checklist. The working version in AnubisV2 lives at
 * `frontend/app/dashboard/page.tsx` (or `frontend/app/page.tsx` in the
 * original AnubisV2 before the UI merge).
 *
 * Key things to preserve when you paste:
 *   - All apiGet/apiPost calls (they already match lib/api.ts)
 *   - The React.Fragment with key (P1-03 fix)
 *   - The displayName() helper (P3-01 fix)
 *   - Title-case status filters (P3-03 fix)
 *
 * Cosmetic changes to make when you paste:
 *   - Replace bg-yellow-400 → bg-action (for contractor CTAs)
 *   - Replace bg-[#0b0b0b] → bg-background
 *   - Replace bg-[#111111] → bg-card
 *   - Remove the old nav links at the top — AppShell handles navigation now
 */

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-full">Alpha scaffold</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          This route is ready. Drop your AnubisV2 dashboard code in —{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            frontend/app/(app)/dashboard/page.tsx
          </code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCode2 className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Migration checklist</CardTitle>
          <CardDescription>
            The shell, design tokens, API client, and route groups are all in place.
            See <code>docs/MIGRATION_TODO.md</code> for the step-by-step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-xs">1</span>
            <span>
              Copy <code className="rounded bg-muted px-1.5 py-0.5 text-xs">frontend/app/dashboard/page.tsx</code> from
              AnubisV2 into this file.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-xs">2</span>
            <span>Strip the top navigation — AppShell handles it now.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-xs">3</span>
            <span>Swap <code className="rounded bg-muted px-1 text-xs">bg-yellow-400</code> → <code className="rounded bg-muted px-1 text-xs">bg-action</code> on primary buttons.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-xs">4</span>
            <span>
              Test locally — <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev</code> should just work;
              backend API client already points at <code className="rounded bg-muted px-1 text-xs">http://localhost:5000</code>.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/opportunity/new">
            New Opportunity <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
    </div>
  );
}

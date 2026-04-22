"use client";

import Link from "next/link";
import { Settings as SettingsIcon, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * SETTINGS PLACEHOLDER
 *
 * In AnubisV2 this lived at /input. It's moving to /settings for the Alpha.
 *
 * Drop AnubisV2's working settings code here (originally
 * `frontend/app/input/page.tsx`). Key things to preserve:
 *   - localStorage key: "anubis_global_settings" (P1-02 fix — DO NOT rename)
 *   - Flat shape: { base_prompt, business_context, ... }
 *   - All SettingsSection / TextInput / TextAreaInput / ToggleInput helpers
 *
 * Cosmetic changes to make when you paste:
 *   - Remove the top-bar nav (AppShell handles it)
 *   - Replace bg-yellow-400 → bg-action
 *   - Replace bg-[#0b0b0b] → bg-background, bg-[#111111] → bg-card
 *   - Replace text-yellow-400 → text-primary (for section accents)
 *     or keep text-action for save buttons — your call
 *
 * Phase 1 TODO: migrate localStorage → Supabase `settings` table, scoped by tenant.
 */

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-full">Alpha scaffold</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Business configuration, AI behavior, workflow rules, integrations.
          Migrate <code className="rounded bg-muted px-1.5 py-0.5 text-xs">frontend/app/input/page.tsx</code> from
          AnubisV2 into this file.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">What this page will contain</CardTitle>
          <CardDescription>
            Sections preserved from AnubisV2's working /input page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• <strong className="text-foreground">Brand &amp; Identity</strong> — company name, logo, contact, license, tagline, address</div>
          <div>• <strong className="text-foreground">AI Behavior</strong> — base prompt, business context, tone, personalization, reading level</div>
          <div>• <strong className="text-foreground">Communication Defaults</strong> — email and SMS tone, signatures, templates</div>
          <div>• <strong className="text-foreground">Workflow Rules</strong> — stale thresholds, milestone transitions, default service types</div>
          <div>• <strong className="text-foreground">Proposal Settings</strong> — default terms, payment schedule, warranty language</div>
          <div>• <strong className="text-foreground">Integrations</strong> — Resend, Twilio, R2, Stripe, Supabase (Phase 1+)</div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-action/15 text-action">
            <FileCode2 className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Migration note</CardTitle>
          <CardDescription>
            The <code>anubis_global_settings</code> localStorage key is unchanged.
            Your existing opportunity page's AI generation will pick up settings
            written here, same as before.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

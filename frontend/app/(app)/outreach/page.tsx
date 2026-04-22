import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OutreachPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Outreach</h1>
          <Badge variant="outline">Phase 2</Badge>
        </div>
        <p className="text-muted-foreground">
          Dedicated composer for customer-facing email and text — AI-drafted,
          reviewed before send, with branded preview and template library.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Ships week 3</CardTitle>
          <CardDescription>Planned scope</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Email composer with contractor branding (logo, signature, tagline)</li>
            <li>• SMS composer with character count + quiet-hours guardrail</li>
            <li>• Template library (estimate follow-up, appointment confirmation, payment reminder)</li>
            <li>• Live preview pane showing how the homeowner sees it</li>
            <li>• History tab — every message sent, per customer</li>
            <li>• 3-second "Undo" toast on text/phone actions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

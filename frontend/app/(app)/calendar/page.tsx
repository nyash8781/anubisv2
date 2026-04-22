import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
          <Badge variant="outline">Phase 2</Badge>
        </div>
        <p className="text-muted-foreground">
          Day / week / month views of all scheduled jobs, with automated
          appointment confirmation texts and .ics calendar invites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Ships weeks 4–5</CardTitle>
          <CardDescription>Planned scope for the Calendar module</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Day / week / month views of all job appointments</li>
            <li>• Click a day to create or edit an appointment</li>
            <li>• Link appointments back to the originating opportunity</li>
            <li>• Auto-send SMS confirmation via Twilio when an appointment is created (quiet-hours guardrail 8 PM–7 AM)</li>
            <li>• Send .ics calendar invites via email (works with Google / Apple / Outlook)</li>
            <li>• 24-hour reminder SMS before service</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

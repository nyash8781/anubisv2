import { redirect } from "next/navigation";

/**
 * /jobs → /dashboard for now.
 *
 * Phase 2 will turn this into a kanban view of the same opportunity data
 * (New / Contacted / Scheduled / Complete columns). Until then, the dashboard
 * table *is* the jobs view.
 */
export default function JobsPage() {
  redirect("/dashboard");
}

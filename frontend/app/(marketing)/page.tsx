import Link from "next/link";
import { ArrowRight, FileText, Bot, ShieldCheck, Hammer, Clock, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Opportunity tracking",
    description:
      "Every lead, every milestone, every last-contact date — in one place. Filter by status, mark stale before they ghost you.",
    icon: FileText,
  },
  {
    title: "AI follow-ups, your voice",
    description:
      "Claude writes the email you'd write if you weren't on a ladder. Tuned by your settings, reviewed before it sends.",
    icon: Bot,
  },
  {
    title: "Built for the field",
    description:
      "Big buttons, dark theme, thumb-friendly layouts. Works in the truck at 6 AM, not just on a monitor.",
    icon: ShieldCheck,
  },
];

const bullets = [
  { icon: Hammer, text: "Capture scope + bid + financials on one page" },
  { icon: Clock, text: "Stale-lead flags before the job goes cold" },
  { icon: DollarSign, text: "Estimated vs Actual margin (coming Phase 2)" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_40%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                Anubis — Alpha
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                Contractor operations that make you{" "}
                <span className="text-primary">look like a pro.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                From first inquiry to final follow-up, Anubis gives small contractors a premium
                workspace — AI-assisted communication, homeowner-facing polish, and zero
                friction between you and the next job.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Start Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>

              <ul className="mt-10 space-y-3">
                {bullets.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li key={b.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{b.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Product frame placeholder */}
            <div className="relative rounded-2xl border border-border/40 bg-card/40 p-3 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-primary/20 via-background to-background p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive/70" />
                  <div className="h-2 w-2 rounded-full bg-action/70" />
                  <div className="h-2 w-2 rounded-full bg-primary/70" />
                  <div className="ml-auto text-xs text-muted-foreground">Dashboard</div>
                </div>
                <div className="space-y-3">
                  <div className="h-8 w-3/4 rounded-md bg-muted/80" />
                  <div className="grid grid-cols-4 gap-2">
                    <div className="h-16 rounded-md bg-muted/60" />
                    <div className="h-16 rounded-md bg-primary/15" />
                    <div className="h-16 rounded-md bg-muted/60" />
                    <div className="h-16 rounded-md bg-muted/60" />
                  </div>
                  <div className="h-40 rounded-md bg-muted/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Every touchpoint, polished.
          </h2>
          <p className="mt-3 text-muted-foreground">
            The software is the digital face of your business. Anubis is built so every email,
            every portal link, every proposal looks like it came from someone three sizes larger.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="pt-3 text-xl">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-8 text-center md:p-12">
          <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Ready to run tighter?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Anubis is in Alpha. Early contractors lock in $15/month for the first three months.
            Sign in with a magic link — no password, no nonsense.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

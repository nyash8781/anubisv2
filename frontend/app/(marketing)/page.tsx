"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, FileText, Bot, Hammer, Clock, DollarSign, Zap, Users, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";

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
      "Big buttons, thumb-friendly layouts. Works in the truck at 6 AM, not just on a monitor.",
    icon: Hammer,
  },
];

const stats = [
  { value: "3×", label: "faster follow-up", icon: Zap },
  { value: "40%", label: "less admin time", icon: Clock },
  { value: "2×", label: "close rate", icon: TrendingUp },
  { value: "500+", label: "contractors in beta", icon: Users },
];

const bullets = [
  { icon: Hammer, text: "Capture scope + bid + financials on one page" },
  { icon: Clock, text: "Stale-lead flags before the job goes cold" },
  { icon: DollarSign, text: "Estimated vs Actual margin (coming Phase 2)" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(217_100%_50%/0.08),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Anubis — Alpha
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-6 font-display text-4xl font-normal tracking-tight md:text-6xl"
              >
                Contractor operations that make you{" "}
                <span className="bg-electric bg-clip-text text-transparent">
                  look like a pro.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg"
              >
                From first inquiry to final follow-up, Anubis gives small contractors a premium
                workspace — AI-assisted communication, homeowner-facing polish, and zero
                friction between you and the next job.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Start Free <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </motion.div>

              <motion.ul variants={fadeUp} className="mt-10 space-y-3">
                {bullets.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li key={b.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                      <span>{b.text}</span>
                    </li>
                  );
                })}
              </motion.ul>
            </motion.div>

            {/* Animated product frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-2xl border border-border bg-white p-3 shadow-xl shadow-primary/8"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-primary/5 via-background to-background p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive/70" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-primary/70" />
                    <div className="ml-auto text-xs text-muted-foreground">Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-7 w-3/4 rounded-md bg-muted" />
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-16 rounded-md bg-muted/60" />
                      <div className="h-16 rounded-md bg-electric opacity-20" />
                      <div className="h-16 rounded-md bg-muted/60" />
                      <div className="h-16 rounded-md bg-muted/60" />
                    </div>
                    <div className="h-36 rounded-md bg-muted/40" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats — inverted Electric Blue */}
      <section className="bg-electric">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} variants={fadeUp} className="text-center text-white">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="font-display text-3xl font-normal">{s.value}</div>
                  <div className="mt-1 text-sm text-white/75">{s.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-12 max-w-2xl">
            <span className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
              Features
            </span>
            <h2 className="font-display text-3xl font-normal tracking-tight md:text-4xl">
              Every touchpoint, polished.
            </h2>
            <p className="mt-3 text-muted-foreground">
              The software is the digital face of your business. Anubis is built so every email,
              every portal link, every proposal looks like it came from someone three sizes larger.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="group rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-electric p-8 text-center text-white md:p-14"
        >
          <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0_0%_100%/0.1),transparent_60%)]" />
          <h3 className="relative font-display text-2xl font-normal tracking-tight md:text-4xl">
            Ready to run tighter?
          </h3>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Anubis is in Alpha. Early contractors lock in $15/month for the first three months.
            Sign in with a magic link — no password, no nonsense.
          </p>
          <div className="relative mt-8 flex justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-sm"
            >
              <Link href="/login">Get Started Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </>
  );
}

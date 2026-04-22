import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Starter",
    price: "$15",
    period: "/mo",
    note: "First 3 months, then $30/mo",
    features: [
      "Opportunity dashboard",
      "AI follow-ups (capped)",
      "Email sending (Resend)",
      "Homeowner portal (view-only)",
      "Proposal PDF (single template)",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$59",
    period: "/mo",
    note: "Everything a solo contractor needs",
    features: [
      "Everything in Starter",
      "Change orders + digital signatures",
      "SMS (Twilio)",
      "Stripe payments in portal",
      "Photo evidence vault",
      "Estimated vs Actual ledger",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "Contact",
    period: "",
    note: "Multi-user crew access",
    features: [
      "Everything in Pro",
      "Multiple users per tenant",
      "Custom proposal templates",
      "White-label portal",
      "Advanced reporting",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Simple pricing for growing service businesses
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Pay for the stage you're in. Upgrade when the jobs get bigger.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={tier.highlighted ? "border-primary/40 shadow-lg shadow-primary/5" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                {tier.highlighted && <Badge>Most popular</Badge>}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">{tier.period}</span>
                )}
              </div>
              <CardDescription>{tier.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
              >
                <Link href="/login">{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

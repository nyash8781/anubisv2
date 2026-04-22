const faqs = [
  {
    q: "Who is Anubis for?",
    a: "Small contractors — electricians, landscapers, general contractors, handymen — who run their business solo or with a small crew and want operations software that makes them look bigger than they are.",
  },
  {
    q: "How does scheduling work?",
    a: "Today, every opportunity captures a due date and milestone. The full Calendar page ships in Phase 2 (week 4–5) with day/week/month views, appointment confirmations via SMS, and .ics calendar invites.",
  },
  {
    q: "Can I send texts and emails?",
    a: "Yes — email via Resend and SMS via Twilio. In the current Alpha the buttons log the contact; real sending is wired up but requires you to add your API keys in settings.",
  },
  {
    q: "Can I upload job photos and files?",
    a: "Yes. Photos attach to each opportunity. Phase 2 adds timestamp + geotag preservation and a dedicated file manager view.",
  },
  {
    q: "Does it support teams?",
    a: "Multi-user crew access is on the premium tier (Team plan). Solo and Pro tiers are single-user today.",
  },
  {
    q: "What about change orders and payments?",
    a: "Both are Phase 2 priorities. Change orders with digital signatures ship in week 4; Stripe payment collection in the homeowner portal ships in week 5.",
  },
];

export default function FAQPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
        Frequently asked
      </h1>
      <p className="mt-4 text-muted-foreground">
        Straight answers. If something isn't here,{" "}
        <a className="text-primary hover:underline" href="mailto:hello@anubis.example">
          ask us directly
        </a>
        .
      </p>

      <div className="mt-10 divide-y divide-border/40 rounded-xl border border-border/40 bg-card/40">
        {faqs.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="cursor-pointer list-none text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between">
                <span>{f.q}</span>
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

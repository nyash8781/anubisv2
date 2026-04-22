export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">About Anubis</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Anubis was built by people who grew up on jobsites. We know the difference between
        software that helps and software that gets in the way. Our goal is simple: every email
        your customer opens, every portal link they tap, every proposal you hand them should
        make you look like the pro you are.
      </p>
      <p className="mt-4 text-muted-foreground">
        This is an Alpha. The roadmap is public — see{" "}
        <a className="text-primary hover:underline" href="/pricing">
          Pricing
        </a>{" "}
        for what ships when.
      </p>
    </section>
  );
}

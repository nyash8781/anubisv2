import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 md:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your email — we'll send you a one-tap magic link. No passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              placeholder="you@company.com"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>

          {/*
           * Phase 1 TODO: wire up Supabase magic-link flow.
           *   import { createClient } from '@supabase/supabase-js'
           *   const supabase = createClient(URL, ANON_KEY)
           *   await supabase.auth.signInWithOtp({
           *     email,
           *     options: { emailRedirectTo: `${location.origin}/dashboard` },
           *   })
           */}
          <Button className="w-full" size="lg">
            Send magic link
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

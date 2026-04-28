"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) handleSend();
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 md:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block font-medium text-foreground">
              AI-powered opportunity management for contractors.
            </span>
            <span className="block">
              {sent
                ? "Check your inbox for the magic link."
                : "Enter your email — we'll send you a one-tap magic link. No passwords."}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sent && (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                />
              </label>

              {error && (
                <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? "Sending…" : "Send magic link"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing you agree to our Terms and Privacy Policy.
              </p>
            </>
          )}

          {sent && (
            <div className="space-y-3 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm text-green-300">
              <p className="font-medium">Magic link sent.</p>
              <p className="text-green-300/80">
                Check <span className="font-medium">{email}</span> and tap the link to sign in.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-xs underline hover:no-underline"
              >
                Use a different email
              </button>
            </div>
          )}

        </CardContent>
      </Card>
    </section>
  );
}

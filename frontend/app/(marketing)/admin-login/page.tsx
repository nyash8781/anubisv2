'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.replace('/dashboard')
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 md:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Admin sign in</CardTitle>
          <CardDescription>
            Password-based sign-in. Session persists across reloads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

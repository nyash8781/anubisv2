'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    if (code) {
      // PKCE flow: exchange the one-time code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace('/login?error=auth_failed')
        } else {
          router.replace('/dashboard')
        }
      })
    } else {
      // Implicit flow: detectSessionInUrl already stored the session from the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard')
        } else {
          router.replace('/login?error=no_session')
        }
      })
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}

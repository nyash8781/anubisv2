'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiGet, apiPost } from '@/lib/api'

type InviteState =
  | { status: 'loading' }
  | { status: 'unauth' }
  | { status: 'invalid'; reason: string }
  | { status: 'ready'; invite: InviteInfo }
  | { status: 'accepting' }
  | { status: 'accepted' }
  | { status: 'error'; message: string }

type InviteInfo = {
  id: string
  invite_email: string
  role: string
  status: string
  invited_at: string
}

export default function TeamAcceptPage() {
  return (
    <Suspense fallback={<TeamAcceptLoading />}>
      <TeamAcceptInner />
    </Suspense>
  )
}

function TeamAcceptLoading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    </main>
  )
}

function TeamAcceptInner() {
  const router = useRouter()
  const params = useSearchParams()
  const inviteId = params?.get('invite_id') ?? ''
  const { session, user } = useAuth()
  const [state, setState] = useState<InviteState>({ status: 'loading' })

  useEffect(() => {
    if (!inviteId) {
      setState({ status: 'invalid', reason: 'Missing invite_id in URL.' })
      return
    }

    // If not signed in, send to /login with a redirect back here
    if (session === null) {
      const back = `/team/accept?invite_id=${encodeURIComponent(inviteId)}`
      router.replace(`/login?redirect=${encodeURIComponent(back)}`)
      setState({ status: 'unauth' })
      return
    }

    // Still loading session
    if (session === 'loading') return

    // Authenticated — fetch invite
    let active = true
    apiGet<InviteInfo>(`/team/invites/${inviteId}`)
      .then((invite) => { if (active) setState({ status: 'ready', invite }) })
      .catch((err) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : 'Failed to load invite'
        setState({ status: 'invalid', reason: msg })
      })
    return () => { active = false }
  }, [inviteId, session, router])

  async function handleAccept() {
    setState({ status: 'accepting' })
    try {
      await apiPost('/team/accept', { invite_id: inviteId })
      setState({ status: 'accepted' })
      setTimeout(() => router.replace('/dashboard'), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invite'
      setState({ status: 'error', message: msg })
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Team Invitation</div>
        <h1 className="font-display text-2xl font-normal mb-1">Join the team</h1>

        {state.status === 'loading' && (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invitation…
          </div>
        )}

        {state.status === 'unauth' && (
          <div className="mt-6 text-sm text-muted-foreground">Redirecting to sign-in…</div>
        )}

        {state.status === 'invalid' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{state.reason}</div>
            </div>
            <Link
              href="/dashboard"
              className="inline-block text-sm text-primary hover:underline"
            >
              Go to dashboard →
            </Link>
          </div>
        )}

        {state.status === 'ready' && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              You've been invited as{' '}
              <span className="font-semibold text-foreground capitalize">{state.invite.role}</span>.
            </p>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Invite for:</span>{' '}
                <span className="font-medium text-foreground">{state.invite.invite_email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Signed in as:</span>{' '}
                <span className="font-medium text-foreground">{user?.email || '—'}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Sent {new Date(state.invite.invited_at).toLocaleDateString()}
              </div>
            </div>
            {user?.email && state.invite.invite_email.toLowerCase() !== user.email.toLowerCase() && (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                The invite was sent to <code>{state.invite.invite_email}</code> but you're signed in as <code>{user.email}</code>. Sign out and back in with the invited email to accept.
              </div>
            )}
            <button
              onClick={handleAccept}
              className="w-full rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Accept Invitation
            </button>
          </div>
        )}

        {state.status === 'accepting' && (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Accepting invitation…
          </div>
        )}

        {state.status === 'accepted' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">You're in!</div>
                <div className="mt-0.5 text-xs">Redirecting to your dashboard…</div>
              </div>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{state.message}</div>
            </div>
            <button
              onClick={() => setState({ status: 'loading' })}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

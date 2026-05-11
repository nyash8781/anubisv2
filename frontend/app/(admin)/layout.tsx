'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Menu } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === 'loading') return

    // Check if user is admin via custom claim in JWT
    // For MVP, this is checked via ADMIN_USER_IDS env var on the backend
    // Frontend can't easily verify without an /admin/me endpoint
    // For now, trust the backend auth middleware
    if (session && user) {
      setIsAuthed(true)
      setLoading(false)
    } else {
      // Not authenticated — redirect to login
      router.push('/login')
    }
  }, [session, user, router])

  if (loading || session === 'loading') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">Admin</h1>
              <p className="text-sm text-muted-foreground">Platform overview and management</p>
            </div>
          </div>

          {/* Admin nav */}
          <nav className="mt-6 flex gap-8 border-t border-border/40 pt-4 text-sm font-medium">
            <Link
              href="/admin"
              className="text-foreground hover:text-primary transition"
            >
              Overview
            </Link>
            <Link
              href="/admin/companies"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Companies
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}

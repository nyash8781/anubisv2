import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createServerClient, supabaseForUser } from './supabase'

type AuthHandler = (user: User, db: SupabaseClient) => Promise<NextResponse>

export async function withAuth(
  request: NextRequest,
  handler: AuthHandler,
): Promise<NextResponse> {
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error,
  } = await createServerClient().auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return handler(user, supabaseForUser(token))
}

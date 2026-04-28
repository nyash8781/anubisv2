import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // Auth is enforced client-side by (app)/layout.tsx via useAuth().
  // The Supabase browser client stores sessions in localStorage, not cookies,
  // so a cookie-based edge check would always redirect to /login.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}

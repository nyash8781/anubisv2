import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    r2: Boolean(
      process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY &&
      process.env.R2_SECRET_KEY && process.env.R2_BUCKET_NAME,
    ),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    posthog: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  })
}

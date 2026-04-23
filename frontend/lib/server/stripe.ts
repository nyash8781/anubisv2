import type Stripe from 'stripe'

let client: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not set')
    const { default: StripeSdk } = await import('stripe')
    client = new StripeSdk(apiKey)
  }
  return client
}

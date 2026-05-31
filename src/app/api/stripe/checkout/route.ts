import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, createStripeCustomer, createCheckoutSession } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: userData } = await admin.from('users').select('*').eq('id', user.id).single()

  // Get or create Stripe customer
  let stripeCustomerId: string
  const { data: creator } = await admin
    .from('creators')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (creator?.stripe_customer_id) {
    stripeCustomerId = creator.stripe_customer_id
  } else {
    const customer = await createStripeCustomer(user.email!, userData?.username)
    stripeCustomerId = customer.id
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const session = await createCheckoutSession({
    customerId: stripeCustomerId,
    priceId: process.env.STRIPE_CREATOR_PRICE_ID!,
    successUrl: `${appUrl}/creator/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/pricing`,
    userId: user.id,
  })

  return NextResponse.json({ url: session.url })
}

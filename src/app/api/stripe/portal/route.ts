import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBillingPortalSession } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('creators')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!creator?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const session = await createBillingPortalSession(
    creator.stripe_customer_id,
    `${appUrl}/creator/dashboard/billing`
  )

  return NextResponse.json({ url: session.url })
}

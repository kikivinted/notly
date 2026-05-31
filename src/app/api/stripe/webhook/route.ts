import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (userId && customerId && subscriptionId) {
        // Activate or create creator record
        await admin.from('creators').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          is_active: true,
          youtube_channel_id: 'pending',
          channel_name: 'Pending Setup',
        }, { onConflict: 'user_id' })

        // Update user role to creator
        await admin.from('users').update({ role: 'creator' }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const status = subscription.status
      const customerId = subscription.customer as string

      await admin
        .from('creators')
        .update({
          subscription_status: status as any,
          is_active: status === 'active' || status === 'trialing',
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await admin
        .from('creators')
        .update({ subscription_status: 'cancelled', is_active: false })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await admin
        .from('creators')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }

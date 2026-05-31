'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { CreditCard, Check, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const [creator, setCreator] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('creators').select('*').eq('user_id', user.id).single()
        .then(({ data }) => setCreator(data))
    })
  }, [])

  const handlePortal = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast.error(data.error || 'Failed to open billing portal')
    setLoading(false)
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast.error(data.error || 'Failed to start checkout')
    setCheckoutLoading(false)
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Billing</h1>

        <div className="bg-surface-2 border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-white">Subscription status</h2>
          </div>

          {creator ? (
            <>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
                creator.subscription_status === 'active'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : creator.subscription_status === 'past_due'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {creator.subscription_status === 'active' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {creator.subscription_status === 'active' ? 'Active — Creator Pro' : creator.subscription_status || 'No subscription'}
              </div>

              {creator.subscription_status === 'active' ? (
                <div>
                  <p className="text-sm text-text-secondary mb-4">
                    Manage your subscription, update payment method, or cancel via the Stripe customer portal.
                  </p>
                  <Button onClick={handlePortal} loading={loading} variant="secondary">
                    Manage subscription
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary mb-4">Subscribe to Creator Pro to activate your channel.</p>
                  <Button onClick={handleCheckout} loading={checkoutLoading}>
                    Subscribe — 9€/month
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-text-secondary mb-4">No creator account found. Subscribe to get started.</p>
              <Button onClick={handleCheckout} loading={checkoutLoading}>
                Subscribe — 9€/month
              </Button>
            </div>
          )}
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-3">What's included</h2>
          <ul className="space-y-2">
            {[
              'YouTube channel connected and synced',
              'All videos automatically imported',
              'Community ratings and feedback',
              'Creator dashboard with analytics',
              'Ranking in monthly and semester charts',
              '"Verified Creator" badge',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-accent flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

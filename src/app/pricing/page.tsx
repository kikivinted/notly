import Link from 'next/link'
import { Check, Star, TrendingUp, BarChart3, BadgeCheck, Zap } from 'lucide-react'

export const metadata = {
  title: 'Pricing — Join Notly as a Creator',
  description: 'Connect your YouTube channel and get community ratings for your videos.',
}

const features = [
  'YouTube channel connected',
  'All videos automatically imported',
  'Real community ratings',
  'Creator dashboard with analytics',
  'Ranking in monthly and semester charts',
  '"Verified Creator" badge',
  'Auto-sync every 24h',
  'Priority support',
]

export default function PricingPage() {
  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-extrabold text-white mb-4">
            Simple pricing for creators
          </h1>
          <p className="text-text-secondary text-xl max-w-xl mx-auto">
            One plan. Everything included. Get real community feedback on your YouTube content.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Monthly */}
          <div className="bg-surface-2 border border-border rounded-2xl p-8 relative">
            <h3 className="font-display text-xl font-bold text-white mb-2">Creator Pro</h3>
            <p className="text-text-secondary text-sm mb-6">Monthly subscription</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl font-extrabold text-white">9€</span>
              <span className="text-text-secondary">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register?plan=monthly"
              className="block w-full text-center bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Start now
            </Link>
          </div>

          {/* Annual */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
              SAVE 50%
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Creator Pro Annual</h3>
            <p className="text-text-secondary text-sm mb-6">One year, paid upfront</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display text-5xl font-extrabold text-white">49€</span>
              <span className="text-text-secondary">/year</span>
            </div>
            <p className="text-xs text-text-secondary mb-6">~4€/month — save 59€ vs monthly</p>
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register?plan=annual"
              className="block w-full text-center bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Start now — best value
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: <Star className="w-5 h-5" />, title: 'Real ratings', desc: 'From genuine viewers' },
            { icon: <TrendingUp className="w-5 h-5" />, title: 'Rise in rankings', desc: 'Quality is rewarded' },
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Detailed analytics', desc: 'Understand your audience' },
            { icon: <BadgeCheck className="w-5 h-5" />, title: 'Verified badge', desc: 'Credibility on Notly' },
          ].map((b) => (
            <div key={b.title} className="bg-surface-2 border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent mx-auto mb-3">
                {b.icon}
              </div>
              <p className="font-semibold text-white text-sm">{b.title}</p>
              <p className="text-xs text-text-secondary mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-white mb-6">FAQ</h2>
          {[
            { q: 'How does video import work?', a: 'You connect your YouTube channel via OAuth. We automatically import your last 50 videos and sync every 24h.' },
            { q: 'Can viewers rate for free?', a: 'Absolutely. Viewing and rating videos is always free for viewers. Only creators pay.' },
            { q: 'What happens if I cancel?', a: 'Your videos stay visible until the end of the billing period. After that, your channel is deactivated.' },
            { q: 'Is there a free trial?', a: 'We offer a 7-day free trial. No commitment required.' },
          ].map((item) => (
            <div key={item.q} className="bg-surface-2 border border-border rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-text-secondary">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

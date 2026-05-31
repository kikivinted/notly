import Link from 'next/link'
import { Heart, Star, Users, Zap } from 'lucide-react'

export const metadata = {
  title: 'About Notly',
  description: 'Notly is the platform where the community rates YouTube videos.',
}

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-extrabold text-white mb-6">
            About <span className="text-accent">Notly</span>
          </h1>
          <p className="text-xl text-text-secondary">
            We believe quality content deserves to be discovered. Notly gives a voice to the community to rate YouTube videos.
          </p>
        </div>

        <div className="space-y-8 text-text-secondary">
          <div className="bg-surface-2 border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl font-bold text-white">Our mission</h2>
            </div>
            <p>YouTube's algorithm promotes videos that generate engagement — clicks, watch time, reactions — not necessarily quality. Notly is different: here, the community decides what's worth watching.</p>
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl font-bold text-white">How it works</h2>
            </div>
            <ul className="space-y-3 list-disc list-inside">
              <li>Creators connect their YouTube channel and subscribe</li>
              <li>Videos are automatically imported and visible on Notly</li>
              <li>Viewers rate videos from 1 to 5 stars</li>
              <li>Our algorithm promotes quality content</li>
              <li>Monthly and semester top charts reward the best creators</li>
            </ul>
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl font-bold text-white">For small creators</h2>
            </div>
            <p>New creators benefit from an additional visibility boost. On Notly, it's not about having millions of subscribers — it's about making quality videos.</p>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            <Zap className="w-5 h-5" />
            Join as a creator
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VideoCard } from '@/components/ui/VideoCard'
import { VideoWithCreator } from '@/types'
import { ArrowRight, Star, TrendingUp, Users, Zap } from 'lucide-react'

async function getTrendingVideos(): Promise<VideoWithCreator[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('videos')
    .select('*, creators(*, users(*))')
    .eq('creators.is_active', true)
    .order('total_votes', { ascending: false })
    .limit(8)
  return (data || []) as VideoWithCreator[]
}

async function getTopMonthlyPreview(): Promise<VideoWithCreator[]> {
  const supabase = createClient()
  const period = new Date().toISOString().slice(0, 7)
  const { data } = await supabase
    .from('monthly_tops')
    .select('*, videos(*, creators(*, users(*)))')
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(3)
  if (!data?.length) {
    const { data: fallback } = await supabase
      .from('videos')
      .select('*, creators(*, users(*))')
      .eq('creators.is_active', true)
      .order('avg_rating', { ascending: false })
      .limit(3)
    return (fallback || []) as VideoWithCreator[]
  }
  return data.map((item: any) => item.videos) as VideoWithCreator[]
}

export default async function HomePage() {
  const [trending, topMonthly] = await Promise.all([
    getTrendingVideos(),
    getTopMonthlyPreview(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-3.5 h-3.5 text-accent" />
            <span className="text-sm text-accent font-medium">Community ratings for YouTube</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-extrabold text-white mb-6 leading-tight">
            Rate the videos<br />
            <span className="text-accent">that matter</span>
          </h1>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Notly is the platform where the community rates YouTube videos. Discover quality content from independent creators that the algorithm ignores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Discover videos <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="bg-surface-2 hover:bg-surface-3 border border-border text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
            >
              I'm a creator →
            </Link>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            {[
              { label: 'Creators', value: '500+' },
              { label: 'Videos rated', value: '12K+' },
              { label: 'Community votes', value: '150K+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="font-display text-2xl font-bold text-white">Trending now</h2>
            </div>
            <Link href="/discover" className="text-sm text-text-secondary hover:text-accent transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-secondary">
              <p className="text-lg">No videos yet.</p>
              <p className="text-sm mt-2">Be the first creator to join Notly!</p>
            </div>
          )}
        </div>
      </section>

      {/* Top Monthly Preview */}
      {topMonthly.length > 0 && (
        <section className="py-16 px-4 bg-surface/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <h2 className="font-display text-2xl font-bold text-white">Top of the month</h2>
              </div>
              <Link href="/top/monthly" className="text-sm text-text-secondary hover:text-accent transition-colors flex items-center gap-1">
                Full top 50 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topMonthly.map((video, i) => (
                <VideoCard key={video.id} video={video} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features / CTA for creators */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for creators who care
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Get real feedback from an engaged community. Not just views — genuine ratings.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Star className="w-6 h-6 text-accent" />,
                title: 'Community ratings',
                desc: 'Viewers rate your videos from 1 to 5 stars. See exactly what resonates.',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-accent" />,
                title: 'Smart algorithm',
                desc: 'Quality content rises. Our algorithm values rating quality AND community engagement.',
              },
              {
                icon: <Users className="w-6 h-6 text-accent" />,
                title: 'Small creator boost',
                desc: 'New creators get extra visibility. Notly fights against algorithmic bias.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-surface-2 border border-border rounded-2xl p-6">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-8 text-center">
            <Zap className="w-8 h-8 text-accent mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-white mb-2">Join as a Creator</h3>
            <p className="text-text-secondary mb-6">Connect your YouTube channel and start getting community ratings for just 9€/month.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

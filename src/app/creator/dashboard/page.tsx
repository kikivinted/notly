import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Star, TrendingUp, Video, Users, AlertCircle, ArrowRight } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export const metadata = { title: 'Creator Dashboard' }

export default async function CreatorDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator) {
    return (
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-text-secondary" />
          <h1 className="font-display text-3xl font-bold text-white mb-4">Creator account required</h1>
          <p className="text-text-secondary mb-6">Connect your YouTube channel to claim your videos and access your creator dashboard — it's free.</p>
          <Link href="/creator/dashboard/channel" className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-block">
            Connect my channel
          </Link>
        </div>
      </div>
    )
  }

  // Get video stats
  const { data: videos } = await admin
    .from('videos')
    .select('id, avg_rating, total_votes, view_count, title')
    .eq('creator_id', creator.id)
    .order('avg_rating', { ascending: false })

  const stats = {
    totalVideos: videos?.length || 0,
    avgRating: videos?.length
      ? videos.reduce((sum, v) => sum + v.avg_rating, 0) / videos.length
      : 0,
    totalVotes: videos?.reduce((sum, v) => sum + v.total_votes, 0) || 0,
    totalViews: videos?.reduce((sum, v) => sum + v.view_count, 0) || 0,
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Creator Dashboard</h1>
            <p className="text-text-secondary mt-1">{creator.channel_name || 'Your channel'}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            creator.subscription_status === 'active'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {creator.subscription_status === 'active' ? 'Active' : creator.subscription_status || 'Inactive'}
          </div>
        </div>

        {/* Setup banner */}
        {creator.youtube_channel_id === 'pending' && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium">Connect your YouTube channel</p>
              <p className="text-sm text-text-secondary">Your subscription is active. Now connect your channel to import videos.</p>
            </div>
            <Link href="/creator/dashboard/channel" className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover font-medium">
              Connect <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg Rating', value: stats.avgRating.toFixed(2), icon: <Star className="w-5 h-5" />, suffix: '/5' },
            { label: 'Total Votes', value: formatNumber(stats.totalVotes), icon: <TrendingUp className="w-5 h-5" /> },
            { label: 'Videos', value: stats.totalVideos.toString(), icon: <Video className="w-5 h-5" /> },
            { label: 'Total Views', value: formatNumber(stats.totalViews), icon: <Users className="w-5 h-5" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-2 border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 text-accent mb-3">{stat.icon}</div>
              <p className="font-display text-2xl font-bold text-white">
                {stat.value}<span className="text-base font-normal text-text-secondary">{stat.suffix}</span>
              </p>
              <p className="text-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/creator/dashboard/videos', label: 'My Videos', desc: 'View all your videos and ratings', icon: <Video className="w-5 h-5" /> },
            { href: '/creator/dashboard/channel', label: 'Channel Settings', desc: 'Manage your YouTube connection', icon: <Users className="w-5 h-5" /> },
            { href: '/creator/dashboard/billing', label: 'Billing', desc: 'Manage your subscription', icon: <Star className="w-5 h-5" /> },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="bg-surface-2 border border-border hover:border-border-hover rounded-xl p-5 transition-colors group">
              <div className="flex items-center gap-2 text-accent mb-2">{link.icon}</div>
              <p className="font-semibold text-white group-hover:text-accent transition-colors">{link.label}</p>
              <p className="text-sm text-text-secondary mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

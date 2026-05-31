import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, TrendingUp } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'

export const metadata = { title: 'My Videos — Creator Dashboard' }

export default async function CreatorVideosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/creator/dashboard')

  const { data: videos } = await admin
    .from('videos')
    .select('*')
    .eq('creator_id', creator.id)
    .order('avg_rating', { ascending: false })

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">My Videos</h1>

        {videos?.length ? (
          <div className="space-y-3">
            {videos.map((video, i) => (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="flex items-center gap-4 bg-surface-2 border border-border hover:border-border-hover rounded-xl p-4 transition-colors group"
              >
                <span className="font-display text-lg font-bold text-text-secondary w-8 flex-shrink-0">#{i + 1}</span>
                <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={video.thumbnail_url} alt={video.title} width={96} height={56} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white group-hover:text-accent transition-colors truncate">{video.title}</p>
                  <p className="text-xs text-text-secondary">{formatDate(video.published_at)}</p>
                </div>
                <div className="flex items-center gap-6 text-sm flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-bold text-white">{video.avg_rating.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-secondary">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatNumber(video.total_votes)} votes</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-secondary">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(video.view_count)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-text-secondary">
            <p className="text-xl font-semibold text-white mb-2">No videos yet</p>
            <p>Connect your YouTube channel to import your videos.</p>
            <Link href="/creator/dashboard/channel" className="inline-block mt-4 bg-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-hover transition-colors">
              Connect channel
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

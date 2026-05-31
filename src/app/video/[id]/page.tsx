import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoWithCreator } from '@/types'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { RatingWidget } from '@/components/video/RatingWidget'
import { RatingBreakdown } from '@/components/ui/RatingBreakdown'
import { CreatorBadge } from '@/components/ui/CreatorBadge'
import { StarRating } from '@/components/ui/StarRating'
import { formatNumber, formatDate } from '@/lib/utils'
import { Eye, Clock, Calendar } from 'lucide-react'

async function getVideo(id: string): Promise<VideoWithCreator | null> {
  const supabase = createClient()

  // Try by Notly UUID first
  const { data } = await supabase
    .from('videos')
    .select('*, creators(*, users(*))')
    .eq('id', id)
    .single()

  if (data) return data as VideoWithCreator

  // Try by YouTube video ID (11-char alphanumeric)
  if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    const { data: byYtId } = await supabase
      .from('videos')
      .select('*, creators(*, users(*))')
      .eq('youtube_video_id', id)
      .single()
    if (byYtId) return byYtId as VideoWithCreator
  }

  return null
}

async function getRatingBreakdown(videoId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('ratings')
    .select('score')
    .eq('video_id', videoId)

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  data?.forEach((r: { score: number }) => { counts[r.score] = (counts[r.score] || 0) + 1 })
  const total = data?.length || 0

  return [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: counts[score] || 0,
    percentage: total > 0 ? ((counts[score] || 0) / total) * 100 : 0,
  }))
}

async function getUserRating(videoId: string): Promise<number | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('ratings')
    .select('score')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .single()
  return data?.score ?? null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const video = await getVideo(params.id)
  if (!video) return { title: 'Video not found' }
  return {
    title: video.title,
    description: `${video.avg_rating.toFixed(1)}/5 stars from ${formatNumber(video.total_votes)} ratings on Notly`,
    openGraph: {
      title: video.title,
      description: video.description || '',
      images: [{ url: video.thumbnail_url }],
    },
  }
}

export default async function VideoPage({ params }: { params: { id: string } }) {
  const [video, breakdown, userRating] = await Promise.all([
    getVideo(params.id),
    getRatingBreakdown(params.id),
    getUserRating(params.id),
  ])

  if (!video) notFound()

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer youtubeId={video.youtube_video_id} title={video.title} />

            <div>
              <h1 className="font-display text-2xl font-bold text-white mb-3">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {formatNumber(video.view_count)} views</span>
                {video.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {video.duration}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(video.published_at)}</span>
              </div>
              {video.description && (
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-4">{video.description}</p>
              )}
            </div>

            {video.creators && (
              <div className="border-t border-border pt-6">
                <CreatorBadge creator={video.creators} size="lg" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating widget */}
            <div className="bg-surface-2 border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-white mb-4">Community Rating</h3>
              <div className="text-center mb-4">
                <span className="font-display text-5xl font-extrabold text-white">{video.avg_rating.toFixed(1)}</span>
                <span className="text-text-secondary">/5</span>
                <div className="flex justify-center mt-2">
                  <StarRating score={video.avg_rating} size="md" />
                </div>
                <p className="text-sm text-text-secondary mt-1">{formatNumber(video.total_votes)} ratings</p>
              </div>
              <div className="mb-6">
                <RatingBreakdown breakdown={breakdown} totalVotes={video.total_votes} />
              </div>
              <RatingWidget videoId={video.id} initialRating={userRating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

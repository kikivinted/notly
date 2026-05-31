import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { VideoCard } from '@/components/ui/VideoCard'
import { VideoWithCreator, Creator } from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { BadgeCheck, Star, Video, Users, Calendar } from 'lucide-react'

async function getCreator(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('creators')
    .select('*, users(*)')
    .eq('id', id)
    .single()
  return data
}

async function getCreatorVideos(creatorId: string): Promise<VideoWithCreator[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('videos')
    .select('*, creators(*, users(*))')
    .eq('creator_id', creatorId)
    .order('avg_rating', { ascending: false })
  return (data || []) as VideoWithCreator[]
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const creator = await getCreator(params.id)
  if (!creator) return { title: 'Creator not found' }
  return {
    title: `${creator.channel_name} — Creator`,
    description: `Watch and rate videos from ${creator.channel_name} on Notly.`,
    openGraph: { images: creator.channel_thumbnail ? [creator.channel_thumbnail] : [] },
  }
}

export default async function CreatorPage({ params }: { params: { id: string } }) {
  const creator = await getCreator(params.id)
  if (!creator) notFound()

  const videos = await getCreatorVideos(params.id)
  const avgRating = videos.length > 0
    ? videos.reduce((sum, v) => sum + v.avg_rating, 0) / videos.length
    : 0
  const totalVotes = videos.reduce((sum, v) => sum + v.total_votes, 0)

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-surface-2 border border-border rounded-2xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {creator.channel_thumbnail ? (
              <Image
                src={creator.channel_thumbnail}
                alt={creator.channel_name}
                width={96}
                height={96}
                className="rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold">
                {creator.channel_name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-white">{creator.channel_name}</h1>
                {creator.is_active && (
                  <span className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Creator
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {formatNumber(creator.subscriber_count)} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" /> {videos.length} videos
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Joined {formatDate(creator.created_at)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-surface-3 rounded-xl px-4 py-3">
                <p className="font-display text-2xl font-bold text-white">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center mt-1">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                </div>
                <p className="text-xs text-text-secondary mt-1">Avg rating</p>
              </div>
              <div className="bg-surface-3 rounded-xl px-4 py-3">
                <p className="font-display text-2xl font-bold text-white">{formatNumber(totalVotes)}</p>
                <p className="text-xs text-text-secondary mt-1">Total votes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        <h2 className="font-display text-xl font-bold text-white mb-4">Videos</h2>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-text-secondary">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No videos yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

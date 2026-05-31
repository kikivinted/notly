import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Eye } from 'lucide-react'
import { VideoWithCreator } from '@/types'
import { formatNumber, timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VideoCardProps {
  video: VideoWithCreator
  rank?: number
  showRankChange?: boolean
  previousRank?: number
  size?: 'sm' | 'md' | 'lg'
}

export function VideoCard({ video, rank, showRankChange, previousRank, size = 'md' }: VideoCardProps) {
  const rankChange = previousRank && rank ? previousRank - rank : null

  return (
    <Link href={`/video/${video.id}`} className={cn('group video-card block', size === 'sm' && 'text-sm')}>
      <div className="relative overflow-hidden rounded-xl bg-surface-2 border border-border group-hover:border-border-hover transition-all duration-300">
        {/* Thumbnail */}
        <div className={cn('relative overflow-hidden', size === 'lg' ? 'aspect-video' : 'aspect-video')}>
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay */}
          <div className="video-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 transition-opacity duration-300" />

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
              {video.duration}
            </div>
          )}

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-2 left-2">
              <div className={cn(
                'text-white font-display font-bold text-sm px-2.5 py-1 rounded-lg',
                rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-600' : 'bg-black/70'
              )}>
                #{rank}
              </div>
            </div>
          )}

          {/* Rank change */}
          {showRankChange && rankChange !== null && (
            <div className="absolute top-2 right-2">
              {rankChange > 0 ? (
                <span className="bg-green-500/80 text-white text-xs px-2 py-0.5 rounded-full">↑{rankChange}</span>
              ) : rankChange < 0 ? (
                <span className="bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-full">↓{Math.abs(rankChange)}</span>
              ) : (
                <span className="bg-gray-500/80 text-white text-xs px-2 py-0.5 rounded-full">—</span>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-accent transition-colors text-sm leading-snug">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            {video.creators?.channel_thumbnail && (
              <Image
                src={video.creators.channel_thumbnail}
                alt={video.creators.channel_name}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-xs text-text-secondary truncate">{video.creators?.channel_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
              <span className="text-sm font-semibold text-white">{video.avg_rating.toFixed(1)}</span>
              <span className="text-xs text-text-secondary">({formatNumber(video.total_votes)})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatNumber(video.view_count)}</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-1">{timeAgo(video.published_at)}</p>
        </div>
      </div>
    </Link>
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface-2 border border-border overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-3 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
    </div>
  )
}

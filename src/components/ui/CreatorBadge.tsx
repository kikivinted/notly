import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { Creator } from '@/types'
import { formatNumber } from '@/lib/utils'

interface CreatorBadgeProps {
  creator: Creator
  showStats?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CreatorBadge({ creator, showStats = true, size = 'md' }: CreatorBadgeProps) {
  const avatarSize = size === 'sm' ? 32 : size === 'lg' ? 56 : 40

  return (
    <Link href={`/creator/${creator.id}`} className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
      <div className="relative flex-shrink-0">
        {creator.channel_thumbnail ? (
          <Image
            src={creator.channel_thumbnail}
            alt={creator.channel_name}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="rounded-full bg-accent flex items-center justify-center text-white font-bold"
            style={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.4 }}
          >
            {creator.channel_name[0]?.toUpperCase()}
          </div>
        )}
        {creator.is_active && (
          <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-accent fill-white" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-1">
          <span className={`font-semibold text-white ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
            {creator.channel_name}
          </span>
          {creator.is_active && (
            <span className="text-xs text-accent font-medium bg-accent/10 px-1.5 py-0.5 rounded-full">Pro</span>
          )}
        </div>
        {showStats && (
          <p className="text-xs text-text-secondary">
            {formatNumber(creator.subscriber_count)} subscribers
          </p>
        )}
      </div>
    </Link>
  )
}

'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  score: number
  maxScore?: number
  interactive?: boolean
  onRate?: (score: number) => void
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

export function StarRating({
  score,
  maxScore = 5,
  interactive = false,
  onRate,
  size = 'md',
  showScore = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const sizeMap = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-7 h-7' }
  const starSize = sizeMap[size]
  const displayScore = interactive && hovered > 0 ? hovered : score

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxScore }, (_, i) => {
        const starValue = i + 1
        const filled = displayScore >= starValue
        const halfFilled = !filled && displayScore >= starValue - 0.5

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={cn(
              'transition-transform',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              'focus:outline-none'
            )}
          >
            <Star
              className={cn(
                starSize,
                filled || halfFilled ? 'text-accent fill-accent' : 'text-text-muted',
                interactive && !filled && 'hover:text-accent/60'
              )}
            />
          </button>
        )
      })}
      {showScore && (
        <span className={cn('ml-1 font-semibold text-white', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm')}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}

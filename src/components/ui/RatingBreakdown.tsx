import { RatingBreakdown as RatingBreakdownType } from '@/types'
import { Star } from 'lucide-react'

interface RatingBreakdownProps {
  breakdown: RatingBreakdownType[]
  totalVotes: number
}

export function RatingBreakdown({ breakdown, totalVotes }: RatingBreakdownProps) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((score) => {
        const item = breakdown.find((b) => b.score === score)
        const count = item?.count || 0
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0

        return (
          <div key={score} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-10 flex-shrink-0">
              <span className="text-xs text-text-secondary">{score}</span>
              <Star className="w-3 h-3 text-accent fill-accent" />
            </div>
            <div className="flex-1 bg-surface-3 rounded-full h-2 overflow-hidden">
              <div
                className="rating-bar bg-accent h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

import { Video } from '@/types'

export function computeScore(video: Pick<Video, 'avg_rating' | 'total_votes' | 'published_at'>): number {
  const daysSincePublished = (Date.now() - new Date(video.published_at).getTime()) / (1000 * 60 * 60 * 24)
  // Recency boost: full boost for < 7 days, decays over time
  const recencyFactor = daysSincePublished < 7 ? 1 : Math.max(0, 1 - (daysSincePublished - 7) / 365)
  const logVotes = video.total_votes > 0 ? Math.log(video.total_votes + 1) : 0
  return video.avg_rating * 0.6 + logVotes * 0.3 + recencyFactor * 0.1
}

export function sortByScore<T extends Pick<Video, 'avg_rating' | 'total_votes' | 'published_at'>>(videos: T[]): T[] {
  return [...videos].sort((a, b) => computeScore(b) - computeScore(a))
}

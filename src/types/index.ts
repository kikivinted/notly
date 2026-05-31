export type UserRole = 'viewer' | 'creator' | 'admin'

export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Creator {
  id: string
  user_id: string
  youtube_channel_id: string
  channel_name: string
  channel_thumbnail: string | null
  subscriber_count: number
  is_active: boolean
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  users?: User
}

export interface Video {
  id: string
  creator_id: string
  youtube_video_id: string
  title: string
  description: string | null
  thumbnail_url: string
  duration: string | null
  published_at: string
  view_count: number
  avg_rating: number
  total_votes: number
  imported_at: string
  creators?: Creator
}

export interface Rating {
  id: string
  user_id: string
  video_id: string
  score: number
  created_at: string
  videos?: Video
}

export interface MonthlyTop {
  id: string
  video_id: string
  period: string
  rank: number
  avg_rating: number
  total_votes: number
  videos?: Video
}

export interface SemesterTop {
  id: string
  video_id: string
  period: string
  rank: number
  avg_rating: number
  total_votes: number
  videos?: Video
}

export interface RatingBreakdown {
  score: number
  count: number
  percentage: number
}

export interface VideoWithCreator extends Video {
  creators: Creator & { users: User }
}

export interface SearchFilters {
  query?: string
  minRating?: number
  maxDuration?: number
  sortBy?: 'top_rated' | 'most_voted' | 'newest' | 'trending'
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface StripeSubscription {
  id: string
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: string
  publishedAt: string
  viewCount: number
}

export interface YouTubeChannel {
  id: string
  title: string
  thumbnailUrl: string
  subscriberCount: number
}

export interface CreatorStats {
  avgRating: number
  totalVotes: number
  totalVideos: number
  rankPosition: number | null
}

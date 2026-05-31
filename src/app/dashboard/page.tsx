import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoCard } from '@/components/ui/VideoCard'
import { VideoWithCreator } from '@/types'
import { Star, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function getUserRatings(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('ratings')
    .select('*, videos(*, creators(*, users(*)))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export const metadata = { title: 'My Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const ratings = await getUserRatings(user.id)

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-text-secondary">{ratings.length} video{ratings.length !== 1 ? 's' : ''} rated</p>
        </div>

        {ratings.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl font-bold text-white">Rated videos</h2>
            </div>
            <div className="space-y-3">
              {ratings.map((rating: any) => (
                <div key={rating.id} className="bg-surface-2 border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <VideoCard video={rating.videos as VideoWithCreator} size="sm" />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-bold text-white">{rating.score}/5</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{formatDate(rating.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <Star className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-xl font-semibold text-white">No ratings yet</p>
            <p className="text-text-secondary mt-2">Discover videos and start rating!</p>
            <a href="/discover" className="inline-block mt-4 bg-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-hover transition-colors">
              Discover videos
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

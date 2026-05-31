import { createClient } from '@/lib/supabase/server'
import { VideoCard } from '@/components/ui/VideoCard'
import { VideoWithCreator } from '@/types'
import { Trophy } from 'lucide-react'

async function getMonthlyTop() {
  const supabase = createClient()
  const period = new Date().toISOString().slice(0, 7)
  const { data } = await supabase
    .from('monthly_tops')
    .select('*, videos(*, creators(*, users(*)))')
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(50)

  if (!data?.length) {
    const { data: fallback } = await supabase
      .from('videos')
      .select('*, creators!inner(*, users(*))')
      .eq('creators.is_active', true)
      .order('avg_rating', { ascending: false })
      .limit(50)
    return (fallback || []).map((v: any, i: number) => ({ ...v, rank: i + 1, video: v }))
  }

  return data.map((item: any) => ({ ...item.videos, rank: item.rank, avg_rating: item.avg_rating, total_votes: item.total_votes }))
}

export const metadata = {
  title: 'Monthly Top 50',
  description: 'The 50 best-rated YouTube videos on Notly this month.',
}

export default async function MonthlyTopPage() {
  const videos = await getMonthlyTop()
  const period = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">{period}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Monthly Top 50</h1>
          <p className="text-text-secondary mt-2">The best-rated videos from the community this month</p>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video: any) => (
              <VideoCard key={video.id} video={video as VideoWithCreator} rank={video.rank} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-text-secondary">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-semibold text-white">No rankings yet</p>
            <p className="mt-2">Rankings are computed daily. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

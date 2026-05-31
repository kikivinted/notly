import { createClient } from '@/lib/supabase/server'
import { VideoCard } from '@/components/ui/VideoCard'
import { VideoWithCreator } from '@/types'
import { Award } from 'lucide-react'

async function getSemesterTop() {
  const supabase = createClient()
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() < 6 ? 'S1' : 'S2'
  const period = `${year}-${semester}`

  const { data } = await supabase
    .from('semester_tops')
    .select('*, videos(*, creators(*, users(*)))')
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(50)

  if (!data?.length) {
    const start = semester === 'S1' ? `${year}-01-01` : `${year}-07-01`
    const { data: fallback } = await supabase
      .from('videos')
      .select('*, creators!inner(*, users(*))')
      .eq('creators.is_active', true)
      .gte('published_at', start)
      .order('avg_rating', { ascending: false })
      .limit(50)
    return { videos: (fallback || []).map((v: any, i: number) => ({ ...v, rank: i + 1 })), period }
  }

  return { videos: data.map((item: any) => ({ ...item.videos, rank: item.rank })), period }
}

export const metadata = {
  title: 'Semester Top 50',
  description: 'The 50 best-rated YouTube videos on Notly this semester.',
}

export default async function SemesterTopPage() {
  const { videos, period } = await getSemesterTop()
  const [year, sem] = period.split('-')
  const semLabel = sem === 'S1' ? 'Jan–Jun' : 'Jul–Dec'

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">{semLabel} {year}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Semester Top 50</h1>
          <p className="text-text-secondary mt-2">The best-rated videos over the past 6 months</p>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video: any) => (
              <VideoCard key={video.id} video={video as VideoWithCreator} rank={video.rank} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-text-secondary">
            <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-semibold text-white">No rankings yet</p>
            <p className="mt-2">Rankings are computed monthly. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { VideoCard, VideoCardSkeleton } from '@/components/ui/VideoCard'
import { VideoWithCreator } from '@/types'
import { Search, SlidersHorizontal } from 'lucide-react'
import { DiscoverFilters } from '@/components/discover/DiscoverFilters'

interface SearchParams {
  q?: string
  sort?: string
  minRating?: string
  page?: string
}

async function getVideos(searchParams: SearchParams): Promise<{ videos: VideoWithCreator[]; total: number }> {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')
  const limit = 24
  const offset = (page - 1) * limit

  let query = supabase
    .from('videos')
    .select('*, creators!inner(*, users(*))', { count: 'exact' })
    .eq('creators.is_active', true)

  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  if (searchParams.minRating) {
    query = query.gte('avg_rating', parseFloat(searchParams.minRating))
  }

  const sort = searchParams.sort || 'trending'
  if (sort === 'top_rated') {
    query = query.order('avg_rating', { ascending: false })
  } else if (sort === 'most_voted') {
    query = query.order('total_votes', { ascending: false })
  } else if (sort === 'newest') {
    query = query.order('published_at', { ascending: false })
  } else {
    query = query.order('total_votes', { ascending: false })
  }

  const { data, count } = await query.range(offset, offset + limit - 1)
  return { videos: (data || []) as VideoWithCreator[], total: count || 0 }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  return {
    title: searchParams.q ? `"${searchParams.q}" — Discover` : 'Discover Videos',
    description: 'Browse and discover top-rated YouTube videos on Notly.',
  }
}

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const { videos, total } = await getVideos(searchParams)
  const page = parseInt(searchParams.page || '1')
  const totalPages = Math.ceil(total / 24)

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Discover</h1>
          <p className="text-text-secondary">
            {total > 0 ? `${total.toLocaleString()} videos from verified creators` : 'Browse top-rated YouTube videos'}
          </p>
        </div>

        <DiscoverFilters defaultQuery={searchParams.q} defaultSort={searchParams.sort} defaultMinRating={searchParams.minRating} />

        {searchParams.q && (
          <div className="flex items-center gap-2 mb-6 text-text-secondary">
            <Search className="w-4 h-4" />
            <span>Results for <strong className="text-white">"{searchParams.q}"</strong></span>
          </div>
        )}

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
          </div>
        }>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {videos.map((video) => <VideoCard key={video.id} video={video} />)}
            </div>
          ) : (
            <div className="text-center py-24">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-white font-semibold text-lg">No rated videos found for this search</p>
              <p className="text-text-secondary mt-2 mb-6">
                Use the search bar at the top to find any YouTube video and add it to Notly.
              </p>
              {searchParams.q && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchParams.q)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-surface-2 border border-border hover:border-border-hover text-white px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Search "{searchParams.q}" on YouTube ↗
                </a>
              )}
            </div>
          )}
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <a href={`/discover?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-secondary hover:text-white transition-colors">
                Previous
              </a>
            )}
            <span className="px-4 py-2 text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a href={`/discover?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-secondary hover:text-white transition-colors">
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

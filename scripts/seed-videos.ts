/**
 * Seed script: imports trending/popular YouTube videos into Notly.
 * Run with: npx ts-node --project tsconfig.seed.json scripts/seed-videos.ts
 * Requires YOUTUBE_API_KEY and SUPABASE_* env vars.
 */
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

async function fetchPopularVideos(regionCode = 'US', maxResults = 50) {
  const res = await youtube.videos.list({
    part: ['snippet', 'contentDetails', 'statistics'],
    chart: 'mostPopular',
    regionCode,
    maxResults,
    videoCategoryId: '0',
  })
  return res.data.items || []
}

async function seed() {
  console.log('Seeding popular YouTube videos...')
  const regions = ['US', 'GB', 'FR', 'DE', 'JP']
  let total = 0

  for (const region of regions) {
    console.log(`Fetching popular videos for ${region}...`)
    const videos = await fetchPopularVideos(region, 50)

    for (const video of videos) {
      const { error } = await supabase.from('videos').upsert({
        creator_id: null,
        youtube_video_id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnail_url:
          video.snippet?.thumbnails?.maxres?.url ||
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.default?.url || '',
        duration: parseDuration(video.contentDetails?.duration || ''),
        published_at: video.snippet?.publishedAt || new Date().toISOString(),
        view_count: parseInt(video.statistics?.viewCount || '0'),
        youtube_channel_id: video.snippet?.channelId || null,
        channel_name: video.snippet?.channelTitle || null,
        channel_thumbnail: null,
      }, { onConflict: 'youtube_video_id', ignoreDuplicates: true })

      if (!error) total++
    }
  }

  console.log(`✓ Seeded ${total} videos across ${regions.length} regions`)
}

seed().catch(console.error)

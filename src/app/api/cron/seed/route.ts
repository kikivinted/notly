import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${min}:${String(s).padStart(2,'0')}`
}

// Import today's trending videos (lightweight cron version)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'placeholder') {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const DAILY_REGIONS = ['US', 'GB', 'FR', 'DE', 'BR', 'IN', 'JP', 'KR', 'MX', 'AU']
  let totalImported = 0

  for (const region of DAILY_REGIONS) {
    try {
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode: region,
        maxResults: 50,
      })

      const rows = (response.data.items || []).map(video => ({
        creator_id: null,
        youtube_video_id: video.id!,
        title: video.snippet?.title || '',
        description: (video.snippet?.description || '').slice(0, 5000),
        thumbnail_url: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
        duration: parseDuration(video.contentDetails?.duration || ''),
        published_at: video.snippet?.publishedAt || new Date().toISOString(),
        view_count: parseInt(video.statistics?.viewCount || '0'),
        youtube_channel_id: video.snippet?.channelId || null,
        channel_name: video.snippet?.channelTitle || null,
        channel_thumbnail: null,
      })).filter(r => r.youtube_video_id && r.title && r.thumbnail_url)

      await admin.from('videos').upsert(rows, { onConflict: 'youtube_video_id', ignoreDuplicates: true })
      totalImported += rows.length
    } catch (err) {
      console.error(`Error seeding region ${region}:`, err)
    }
  }

  return NextResponse.json({ success: true, imported: totalImported, regions: DAILY_REGIONS.length })
}

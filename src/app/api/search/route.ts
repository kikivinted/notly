import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const source = searchParams.get('source') || 'both' // 'notly' | 'youtube' | 'both'

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const admin = createAdminClient()
  const results: any[] = []

  // 1. Search Notly DB first (already rated/imported videos)
  if (source !== 'youtube') {
    const { data: notlyVideos } = await admin
      .from('videos')
      .select('id, youtube_video_id, title, thumbnail_url, channel_name, avg_rating, total_votes, duration, creators(channel_name, channel_thumbnail)')
      .ilike('title', `%${q}%`)
      .order('total_votes', { ascending: false })
      .limit(5)

    if (notlyVideos) {
      for (const v of notlyVideos) {
        results.push({
          notlyId: v.id,
          youtubeId: v.youtube_video_id,
          title: v.title,
          thumbnail: v.thumbnail_url,
          channelName: (v.creators as any)?.channel_name || v.channel_name || '',
          duration: v.duration || '',
          avgRating: v.avg_rating,
          totalVotes: v.total_votes,
          inNotly: true,
        })
      }
    }
  }

  // 2. Search YouTube API (live results)
  if (source !== 'notly' && process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'placeholder') {
    try {
      const searchRes = await youtube.search.list({
        part: ['snippet'],
        q,
        type: ['video'],
        maxResults: 8,
        safeSearch: 'none',
        relevanceLanguage: 'en',
      })

      const ytVideoIds = searchRes.data.items
        ?.map(i => i.id?.videoId)
        .filter(Boolean) as string[]

      if (ytVideoIds?.length) {
        // Fetch video details for duration
        const detailsRes = await youtube.videos.list({
          part: ['contentDetails', 'statistics'],
          id: ytVideoIds,
        })
        const detailsMap = new Map(detailsRes.data.items?.map(v => [v.id!, v]))

        // Check which ones are already in Notly
        const { data: existingInNotly } = await admin
          .from('videos')
          .select('youtube_video_id, id')
          .in('youtube_video_id', ytVideoIds)

        const notlyMap = new Map(existingInNotly?.map(v => [v.youtube_video_id, v.id]))

        for (const item of searchRes.data.items || []) {
          const vid = item.id?.videoId!
          if (!vid) continue
          // Skip duplicates already in Notly results
          if (results.some(r => r.youtubeId === vid)) continue

          const details = detailsMap.get(vid)
          results.push({
            notlyId: notlyMap.get(vid) || null,
            youtubeId: vid,
            title: item.snippet?.title || '',
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
            channelName: item.snippet?.channelTitle || '',
            channelId: item.snippet?.channelId || '',
            duration: details ? parseDuration(details.contentDetails?.duration || '') : '',
            avgRating: 0,
            totalVotes: 0,
            inNotly: !!notlyMap.get(vid),
          })
        }
      }
    } catch (err) {
      console.error('YouTube search error:', err)
    }
  }

  return NextResponse.json({ results: results.slice(0, 10) })
}

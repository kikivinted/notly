import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVideoInfo, getChannelInfo } from '@/lib/youtube'
import { NextRequest, NextResponse } from 'next/server'

function extractYouTubeId(input: string): string | null {
  // Support various YouTube URL formats and plain IDs
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in to add videos' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url) {
    return NextResponse.json({ error: 'YouTube URL required' }, { status: 400 })
  }

  const videoId = extractYouTubeId(url.trim())
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if already exists
  const { data: existing } = await admin
    .from('videos')
    .select('id, title, avg_rating, total_votes, thumbnail_url, youtube_video_id, channel_name')
    .eq('youtube_video_id', videoId)
    .single()

  if (existing) {
    return NextResponse.json({ video: existing, alreadyExists: true })
  }

  // Fetch from YouTube API
  const videoInfo = await getVideoInfo(videoId)
  if (!videoInfo) {
    return NextResponse.json({ error: 'Video not found on YouTube' }, { status: 404 })
  }

  // Check if we have a registered creator for this channel
  // We'll get the channel info from the video's channel
  const { data: creator } = await admin
    .from('creators')
    .select('id')
    .eq('youtube_channel_id', (videoInfo as any).channelId || '')
    .single()

  const { data: video, error } = await admin
    .from('videos')
    .insert({
      creator_id: creator?.id || null,
      youtube_video_id: videoInfo.id,
      title: videoInfo.title,
      description: videoInfo.description,
      thumbnail_url: videoInfo.thumbnailUrl,
      duration: videoInfo.duration,
      published_at: videoInfo.publishedAt,
      view_count: videoInfo.viewCount,
      youtube_channel_id: (videoInfo as any).channelId || null,
      channel_name: (videoInfo as any).channelTitle || null,
      channel_thumbnail: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ video, alreadyExists: false })
}

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '8')

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const admin = createAdminClient()

  // Full-text search across title and channel_name using pg_trgm
  const { data: videos } = await admin
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, channel_name, channel_thumbnail, avg_rating, total_votes, duration, creators(channel_name, channel_thumbnail)')
    .or(`title.ilike.%${q}%,channel_name.ilike.%${q}%`)
    .order('total_votes', { ascending: false })
    .limit(limit)

  const results = (videos || []).map((v: any) => ({
    notlyId: v.id,
    youtubeId: v.youtube_video_id,
    title: v.title,
    thumbnail: v.thumbnail_url,
    channelName: v.creators?.channel_name || v.channel_name || '',
    channelThumbnail: v.creators?.channel_thumbnail || v.channel_thumbnail || null,
    duration: v.duration || '',
    avgRating: v.avg_rating || 0,
    totalVotes: v.total_votes || 0,
    inNotly: true,
  }))

  return NextResponse.json({ results })
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChannelInfo, getChannelVideos } from '@/lib/youtube'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { channelId } = await request.json()
  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: creator } = await admin
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator || !creator.is_active) {
    return NextResponse.json({ error: 'Active creator subscription required' }, { status: 403 })
  }

  // Validate channel via YouTube API
  const channelInfo = await getChannelInfo(channelId)
  if (!channelInfo) {
    return NextResponse.json({ error: 'YouTube channel not found' }, { status: 404 })
  }

  // Update creator with channel info
  await admin.from('creators').update({
    youtube_channel_id: channelId,
    channel_name: channelInfo.title,
    channel_thumbnail: channelInfo.thumbnailUrl,
    subscriber_count: channelInfo.subscriberCount,
  }).eq('id', creator.id)

  // Import initial videos
  const videos = await getChannelVideos(channelId, 50)
  for (const video of videos) {
    await admin.from('videos').upsert({
      creator_id: creator.id,
      youtube_video_id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      published_at: video.publishedAt,
      view_count: video.viewCount,
    }, { onConflict: 'youtube_video_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ success: true, channel: channelInfo, videosImported: videos.length })
}

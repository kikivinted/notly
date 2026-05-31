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

  // Validate channel via YouTube API
  const channelInfo = await getChannelInfo(channelId)
  if (!channelInfo) {
    return NextResponse.json({ error: 'YouTube channel not found' }, { status: 404 })
  }

  // Upsert creator record (free, no subscription required)
  const { data: creator, error: creatorError } = await admin
    .from('creators')
    .upsert({
      user_id: user.id,
      youtube_channel_id: channelId,
      channel_name: channelInfo.title,
      channel_thumbnail: channelInfo.thumbnailUrl,
      subscriber_count: channelInfo.subscriberCount,
      is_active: true,
      subscription_status: null,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (creatorError) {
    return NextResponse.json({ error: creatorError.message }, { status: 500 })
  }

  // Update user role to creator
  await admin.from('users').update({ role: 'creator' }).eq('id', user.id)

  // Link existing videos with this channel_id to this creator
  await admin
    .from('videos')
    .update({ creator_id: creator.id })
    .eq('youtube_channel_id', channelId)
    .is('creator_id', null)

  // Import new videos
  const videos = await getChannelVideos(channelId, 50)
  let imported = 0
  for (const video of videos) {
    const { error } = await admin.from('videos').upsert({
      creator_id: creator.id,
      youtube_video_id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      published_at: video.publishedAt,
      view_count: video.viewCount,
      youtube_channel_id: channelId,
      channel_name: channelInfo.title,
      channel_thumbnail: channelInfo.thumbnailUrl,
    }, { onConflict: 'youtube_video_id', ignoreDuplicates: false })
    if (!error) imported++
  }

  return NextResponse.json({ success: true, channel: channelInfo, videosImported: imported })
}

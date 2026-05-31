import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChannelVideos, getChannelInfo } from '@/lib/youtube'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator || !creator.is_active) {
    return NextResponse.json({ error: 'Active creator account required' }, { status: 403 })
  }

  if (creator.youtube_channel_id === 'pending') {
    return NextResponse.json({ error: 'YouTube channel not connected' }, { status: 400 })
  }

  try {
    // Fetch latest channel info
    const channelInfo = await getChannelInfo(creator.youtube_channel_id)
    if (channelInfo) {
      await admin.from('creators').update({
        channel_name: channelInfo.title,
        channel_thumbnail: channelInfo.thumbnailUrl,
        subscriber_count: channelInfo.subscriberCount,
      }).eq('id', creator.id)
    }

    // Fetch videos
    const videos = await getChannelVideos(creator.youtube_channel_id, 50)
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
      }, { onConflict: 'youtube_video_id', ignoreDuplicates: false })

      if (!error) imported++
    }

    return NextResponse.json({ success: true, imported, total: videos.length })
  } catch (error: any) {
    console.error('YouTube sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Cron job endpoint — secured by a secret token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: creators } = await admin
    .from('creators')
    .select('*')
    .eq('is_active', true)
    .neq('youtube_channel_id', 'pending')

  let totalImported = 0
  for (const creator of creators || []) {
    const videos = await getChannelVideos(creator.youtube_channel_id, 50)
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
      }, { onConflict: 'youtube_video_id', ignoreDuplicates: false })
      totalImported++
    }
  }

  return NextResponse.json({ success: true, creatorsProcessed: creators?.length, totalImported })
}

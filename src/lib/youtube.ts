import { google } from 'googleapis'
import type { YouTubeVideo, YouTubeChannel } from '@/types'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

function parseDuration(iso8601: string): string {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
  try {
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId],
    })
    const channel = response.data.items?.[0]
    if (!channel) return null
    return {
      id: channel.id!,
      title: channel.snippet?.title || '',
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url || '',
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
    }
  } catch (error) {
    console.error('YouTube getChannelInfo error:', error)
    return null
  }
}

export async function getChannelVideos(channelId: string, maxResults = 50): Promise<YouTubeVideo[]> {
  try {
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      channelId,
      type: ['video'],
      order: 'date',
      maxResults,
    })

    const videoIds = searchResponse.data.items
      ?.map((item) => item.id?.videoId)
      .filter(Boolean) as string[]

    if (!videoIds?.length) return []

    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
    })

    return (videoResponse.data.items || []).map((video) => ({
      id: video.id!,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnailUrl:
        video.snippet?.thumbnails?.maxres?.url ||
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.default?.url || '',
      duration: parseDuration(video.contentDetails?.duration || ''),
      publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
      viewCount: parseInt(video.statistics?.viewCount || '0'),
    }))
  } catch (error) {
    console.error('YouTube getChannelVideos error:', error)
    return []
  }
}

export async function getVideoInfo(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    })
    const video = response.data.items?.[0]
    if (!video) return null
    return {
      id: video.id!,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnailUrl:
        video.snippet?.thumbnails?.maxres?.url ||
        video.snippet?.thumbnails?.high?.url || '',
      duration: parseDuration(video.contentDetails?.duration || ''),
      publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
      viewCount: parseInt(video.statistics?.viewCount || '0'),
    }
  } catch (error) {
    console.error('YouTube getVideoInfo error:', error)
    return null
  }
}

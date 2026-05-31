/**
 * Comprehensive seed script for Notly.
 * Imports popular YouTube videos from all regions and categories.
 *
 * Usage:
 *   npx ts-node -r dotenv/config --project tsconfig.seed.json scripts/seed-videos.ts
 *
 * With dotenv: dotenv loads .env.local automatically if you set DOTENV_CONFIG_PATH
 *   DOTENV_CONFIG_PATH=.env.local npx ts-node -r dotenv/config --project tsconfig.seed.json scripts/seed-videos.ts
 */

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// YouTube region codes (ISO 3166-1 alpha-2)
const REGIONS = [
  'US', 'GB', 'CA', 'AU', 'FR', 'DE', 'ES', 'IT', 'PT', 'NL',
  'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU',
  'RO', 'GR', 'TR', 'IL', 'AE', 'SA', 'EG', 'ZA', 'NG', 'KE',
  'BR', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'IN', 'PK', 'BD',
  'JP', 'KR', 'CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'ID', 'PH',
  'VN', 'UA', 'RU', 'KZ', 'BY',
]

// YouTube video category IDs
const CATEGORIES = [
  '0',  // All categories (default)
  '1',  // Film & Animation
  '2',  // Autos & Vehicles
  '10', // Music
  '15', // Pets & Animals
  '17', // Sports
  '19', // Travel & Events
  '20', // Gaming
  '22', // People & Blogs
  '23', // Comedy
  '24', // Entertainment
  '25', // News & Politics
  '26', // Howto & Style
  '27', // Education
  '28', // Science & Technology
  '29', // Nonprofits & Activism
]

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0')
  const min = parseInt(m[2] || '0')
  const s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let totalImported = 0
let apiCallsUsed = 0
const MAX_API_CALLS = 9000 // Stay under the 10K daily limit

async function importVideosToDb(videos: any[]): Promise<number> {
  if (!videos.length) return 0

  const rows = videos.map(video => ({
    creator_id: null,
    youtube_video_id: video.id,
    title: video.snippet?.title || '',
    description: (video.snippet?.description || '').slice(0, 5000),
    thumbnail_url:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      video.snippet?.thumbnails?.default?.url || '',
    duration: parseDuration(video.contentDetails?.duration || ''),
    published_at: video.snippet?.publishedAt || new Date().toISOString(),
    view_count: parseInt(video.statistics?.viewCount || '0'),
    youtube_channel_id: video.snippet?.channelId || null,
    channel_name: video.snippet?.channelTitle || null,
    channel_thumbnail: null,
  })).filter(r => r.youtube_video_id && r.title && r.thumbnail_url)

  const { error } = await supabase
    .from('videos')
    .upsert(rows, { onConflict: 'youtube_video_id', ignoreDuplicates: true })

  if (error) {
    console.error('DB insert error:', error.message)
    return 0
  }
  return rows.length
}

async function fetchMostPopular(regionCode: string, categoryId: string, maxPages = 4): Promise<any[]> {
  const allVideos: any[] = []
  let pageToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    if (apiCallsUsed >= MAX_API_CALLS) {
      console.log('API call limit reached, stopping.')
      break
    }

    try {
      // Fetch video list (1 API unit per call)
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        videoCategoryId: categoryId === '0' ? undefined : categoryId,
        maxResults: 50,
        pageToken,
      })
      apiCallsUsed++

      const items = response.data.items || []
      allVideos.push(...items)

      pageToken = response.data.nextPageToken || undefined
      if (!pageToken) break

      // Small delay to be nice to the API
      await sleep(100)
    } catch (err: any) {
      if (err?.code === 429 || err?.message?.includes('quota')) {
        console.log('Quota exceeded, stopping.')
        break
      }
      // Skip region/category combo that fails
      break
    }
  }

  return allVideos
}

async function seedRegion(regionCode: string) {
  // Fetch "all categories" for this region (most efficient)
  const videos = await fetchMostPopular(regionCode, '0', 4)
  const count = await importVideosToDb(videos)
  totalImported += count
  return count
}

async function seedByCategory(categoryId: string) {
  // Fetch top videos globally for specific categories
  const videos = await fetchMostPopular('US', categoryId, 4)
  const count = await importVideosToDb(videos)
  totalImported += count
  return count
}

async function main() {
  console.log('Notly Video Seed Script')
  console.log('============================')
  console.log(`Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...`)
  console.log(`YouTube API key: ${process.env.YOUTUBE_API_KEY?.slice(0, 8)}...`)
  console.log('')

  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'placeholder') {
    console.error('ERROR: YOUTUBE_API_KEY is not set in .env.local')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Supabase credentials not set in .env.local')
    process.exit(1)
  }

  console.log('Phase 1: Importing popular videos by region...')
  for (const region of REGIONS) {
    if (apiCallsUsed >= MAX_API_CALLS) break
    const count = await seedRegion(region)
    process.stdout.write(`  ${region}: ${count} videos | API calls: ${apiCallsUsed} | Total: ${totalImported}\r`)
    await sleep(200)
  }

  console.log('\n')
  console.log('Phase 2: Importing top videos by category (US)...')
  for (const cat of CATEGORIES) {
    if (apiCallsUsed >= MAX_API_CALLS) break
    const count = await seedByCategory(cat)
    console.log(`  Category ${cat}: ${count} videos | API calls: ${apiCallsUsed}`)
    await sleep(200)
  }

  console.log('\n============================')
  console.log('Seed complete!')
  console.log(`   Total videos imported: ${totalImported}`)
  console.log(`   YouTube API calls used: ${apiCallsUsed} / 10,000`)
  console.log('')
  console.log('Run daily to keep the database fresh:')
  console.log('  npm run seed')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

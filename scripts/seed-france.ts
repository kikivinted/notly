/**
 * France Seed Script — imports all videos from French YouTube channels with 10K+ subscribers.
 *
 * Strategy (YouTube API has no "list all channels by country"):
 *   Phase 1 — Discover channels via trending/popular videos in France
 *   Phase 2 — Search French channels by category keywords
 *   Phase 3 — For each channel with 10K+ subs → import ALL their videos
 *
 * Quota cost: ~5,000–9,000 units per run (free tier = 10,000/day)
 * If you hit the quota, just re-run the next day — already-imported videos are skipped.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx ts-node -r dotenv/config --project tsconfig.seed.json scripts/seed-france.ts
 */

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- CONFIG ---
const MIN_SUBSCRIBERS = 10_000
const MAX_API_CALLS = 9_500          // hard stop before hitting 10K limit
const PROGRESS_FILE = '.seed-france-progress.json' // resume across runs
// --------------

let apiCallsUsed = 0
let totalVideosImported = 0
let channelsProcessed = 0

// Persist discovered channel IDs across runs
function loadProgress(): { discovered: string[]; done: string[] } {
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { discovered: [], done: [] }
  }
}

function saveProgress(data: { discovered: string[]; done: string[] }) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2))
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function checkQuota() {
  if (apiCallsUsed >= MAX_API_CALLS) {
    console.log(`\n⚠️  API quota limit reached (${apiCallsUsed} units used).`)
    console.log('Progress saved. Re-run tomorrow to continue.')
    process.exit(0)
  }
}

// ─── Phase 1: Discover channel IDs from trending French videos ────────────────
async function discoverChannelsFromTrending(): Promise<Set<string>> {
  const channelIds = new Set<string>()
  const categories = ['0','1','2','10','15','17','20','22','23','24','25','26','27','28']

  console.log('📺 Phase 1: Discovering channels from French trending videos...')

  for (const catId of categories) {
    checkQuota()
    try {
      let pageToken: string | undefined
      for (let page = 0; page < 4; page++) {
        checkQuota()
        const res = await youtube.videos.list({
          part: ['snippet'],
          chart: 'mostPopular',
          regionCode: 'FR',
          videoCategoryId: catId === '0' ? undefined : catId,
          maxResults: 50,
          pageToken,
        })
        apiCallsUsed++
        for (const v of res.data.items || []) {
          if (v.snippet?.channelId) channelIds.add(v.snippet.channelId)
        }
        pageToken = res.data.nextPageToken || undefined
        if (!pageToken) break
        await sleep(100)
      }
    } catch { /* skip failing category */ }
  }

  console.log(`  Found ${channelIds.size} channels from trending`)
  return channelIds
}

// ─── Phase 2: Discover channels via keyword search ────────────────────────────
async function discoverChannelsFromSearch(): Promise<Set<string>> {
  const channelIds = new Set<string>()

  // French YouTube niches — broad coverage
  const keywords = [
    'france', 'français', 'francais', 'france 2024',
    'gaming france', 'jeux vidéo france', 'minecraft france', 'fortnite france',
    'cuisine française', 'recette facile', 'vlog france', 'paris vlog',
    'musique française', 'rap français', 'chanson française',
    'actualité france', 'info france', 'politique france',
    'sport france', 'football france', 'basketball france', 'rugby france',
    'humour français', 'sketch français', 'comédie france',
    'beauté france', 'mode france', 'maquillage tutoriel',
    'science france', 'histoire france', 'culture france',
    'tech france', 'informatique france', 'programmation',
    'voyage france', 'tourisme france', 'road trip france',
    'fitness france', 'musculation france', 'yoga france',
    'famille france', 'enfants france', 'dessin animé',
    'business france', 'entrepreneuriat', 'finance personnelle france',
    'cinéma france', 'film critique', 'série tv france',
    'podcast france', 'interview france', 'documentaire france',
    'livres france', 'lecture france', 'bd manga france',
    'animaux france', 'chats chiens france',
    'bricolage france', 'jardinage france', 'décoration',
    'education france', 'cours en ligne', 'apprendre français',
  ]

  console.log('🔍 Phase 2: Searching French channels by keyword...')
  let keywordsProcessed = 0

  for (const kw of keywords) {
    checkQuota()
    try {
      // search.list costs 100 units — use sparingly
      const res = await youtube.search.list({
        part: ['snippet'],
        q: kw,
        type: ['channel'],
        regionCode: 'FR',
        relevanceLanguage: 'fr',
        maxResults: 50,
      })
      apiCallsUsed += 100 // search.list is expensive
      for (const item of res.data.items || []) {
        if (item.snippet?.channelId) channelIds.add(item.snippet.channelId)
        if (item.id?.channelId) channelIds.add(item.id.channelId)
      }
      keywordsProcessed++
      process.stdout.write(`  Keyword ${keywordsProcessed}/${keywords.length}: "${kw}" → ${channelIds.size} channels total | API: ${apiCallsUsed}\r`)
      await sleep(200)
    } catch (err: any) {
      if (err?.message?.includes('quota')) { checkQuota() }
    }
  }

  console.log(`\n  Found ${channelIds.size} channels via keyword search`)
  return channelIds
}

// ─── Filter channels by subscriber count ──────────────────────────────────────
async function filterBySubscribers(channelIds: string[]): Promise<string[]> {
  const qualifying: string[] = []
  const BATCH = 50

  console.log(`\n👥 Checking subscriber counts for ${channelIds.length} channels...`)

  for (let i = 0; i < channelIds.length; i += BATCH) {
    checkQuota()
    const batch = channelIds.slice(i, i + BATCH)
    try {
      const res = await youtube.channels.list({
        part: ['statistics', 'snippet'],
        id: batch,
      })
      apiCallsUsed++
      for (const ch of res.data.items || []) {
        const subs = parseInt(ch.statistics?.subscriberCount || '0')
        if (subs >= MIN_SUBSCRIBERS) {
          qualifying.push(ch.id!)
        }
      }
      process.stdout.write(`  Checked ${Math.min(i + BATCH, channelIds.length)}/${channelIds.length} | Qualifying: ${qualifying.length}\r`)
      await sleep(100)
    } catch { /* skip */ }
  }

  console.log(`\n  ✅ ${qualifying.length} channels have ${MIN_SUBSCRIBERS.toLocaleString()}+ subscribers`)
  return qualifying
}

// ─── Import all videos from a channel ────────────────────────────────────────
async function importAllVideosFromChannel(channelId: string): Promise<number> {
  checkQuota()

  // Step 1: Get the uploads playlist ID for this channel
  let uploadsPlaylistId: string | null = null
  try {
    const chRes = await youtube.channels.list({
      part: ['contentDetails', 'snippet', 'statistics'],
      id: [channelId],
    })
    apiCallsUsed++
    const ch = chRes.data.items?.[0]
    if (!ch) return 0
    uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads || null

    // Update channel info in DB if it exists as a creator
    await supabase
      .from('creators')
      .update({
        channel_name: ch.snippet?.title,
        channel_thumbnail: ch.snippet?.thumbnails?.default?.url,
        subscriber_count: parseInt(ch.statistics?.subscriberCount || '0'),
      })
      .eq('youtube_channel_id', channelId)
  } catch { return 0 }

  if (!uploadsPlaylistId) return 0

  // Step 2: Iterate through the uploads playlist
  const videoIds: string[] = []
  let pageToken: string | undefined

  // Limit to last 200 videos per channel to stay within quota
  for (let page = 0; page < 4; page++) {
    checkQuota()
    try {
      const res = await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken,
      })
      apiCallsUsed++
      for (const item of res.data.items || []) {
        if (item.contentDetails?.videoId) {
          videoIds.push(item.contentDetails.videoId)
        }
      }
      pageToken = res.data.nextPageToken || undefined
      if (!pageToken) break
      await sleep(100)
    } catch { break }
  }

  if (!videoIds.length) return 0

  // Step 3: Fetch video details in batches of 50
  let imported = 0
  const BATCH = 50

  for (let i = 0; i < videoIds.length; i += BATCH) {
    checkQuota()
    const batch = videoIds.slice(i, i + BATCH)
    try {
      const res = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: batch,
      })
      apiCallsUsed++

      // Find if this channel has a registered creator on Notly
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('youtube_channel_id', channelId)
        .single()

      const rows = (res.data.items || []).map(video => ({
        creator_id: creator?.id || null,
        youtube_video_id: video.id!,
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
        youtube_channel_id: video.snippet?.channelId || channelId,
        channel_name: video.snippet?.channelTitle || null,
        channel_thumbnail: null,
      })).filter(r => r.youtube_video_id && r.title && r.thumbnail_url)

      const { error } = await supabase
        .from('videos')
        .upsert(rows, { onConflict: 'youtube_video_id', ignoreDuplicates: true })

      if (!error) imported += rows.length
      await sleep(50)
    } catch { /* skip batch */ }
  }

  return imported
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🇫🇷 Notly — France Channel Seed Script')
  console.log('=========================================')
  console.log(`Min subscribers: ${MIN_SUBSCRIBERS.toLocaleString()}`)
  console.log(`Max API units/run: ${MAX_API_CALLS.toLocaleString()}`)
  console.log('')

  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'placeholder') {
    console.error('❌ YOUTUBE_API_KEY not set in .env.local')
    process.exit(1)
  }

  const progress = loadProgress()
  let allChannelIds = new Set<string>(progress.discovered)
  const doneChannels = new Set<string>(progress.done)

  // ── Phase 1 & 2: Discover channels (skip if already have a big list) ──────
  if (allChannelIds.size < 500) {
    const trending = await discoverChannelsFromTrending()
    trending.forEach(id => allChannelIds.add(id))

    const fromSearch = await discoverChannelsFromSearch()
    fromSearch.forEach(id => allChannelIds.add(id))
  } else {
    console.log(`ℹ️  Using ${allChannelIds.size} previously discovered channels`)
  }

  // ── Phase 3: Filter by subscriber count ───────────────────────────────────
  const newChannels = Array.from(allChannelIds).filter(id => !doneChannels.has(id))
  console.log(`\n📊 ${allChannelIds.size} total channels (${doneChannels.size} already done, ${newChannels.length} to process)`)

  const qualifying = await filterBySubscribers(newChannels)

  // Save progress
  saveProgress({ discovered: Array.from(allChannelIds), done: Array.from(doneChannels) })

  // ── Phase 4: Import all videos from qualifying channels ───────────────────
  console.log(`\n📥 Phase 4: Importing videos from ${qualifying.length} qualifying channels...`)

  for (const channelId of qualifying) {
    if (doneChannels.has(channelId)) continue
    checkQuota()

    const count = await importAllVideosFromChannel(channelId)
    totalVideosImported += count
    channelsProcessed++
    doneChannels.add(channelId)

    process.stdout.write(
      `  Channel ${channelsProcessed}/${qualifying.length} | +${count} videos | Total: ${totalVideosImported} | API: ${apiCallsUsed}\r`
    )

    // Save progress every 10 channels
    if (channelsProcessed % 10 === 0) {
      saveProgress({ discovered: Array.from(allChannelIds), done: Array.from(doneChannels) })
    }

    await sleep(150)
  }

  // Final save
  saveProgress({ discovered: Array.from(allChannelIds), done: Array.from(doneChannels) })

  console.log('\n\n=========================================')
  console.log('✅ Seed complete!')
  console.log(`   Channels processed: ${channelsProcessed}`)
  console.log(`   Total videos imported: ${totalVideosImported.toLocaleString()}`)
  console.log(`   YouTube API units used: ${apiCallsUsed} / 10,000`)
  console.log('')
  console.log('Run again tomorrow to continue with remaining channels.')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})

/**
 * Seed script — 156 chaînes YouTube françaises spécifiques.
 * Importe toutes les vidéos de chaque chaîne.
 *
 * Stratégie quota-friendly :
 *   1. channels.list?forHandle=@slug  → 1 unité par chaîne (très bon marché)
 *   2. Si échec → search.list?q=nom   → 100 unités (fallback)
 *
 * Usage :
 *   DOTENV_CONFIG_PATH=.env.local npx ts-node -r dotenv/config --project tsconfig.seed.json scripts/seed-channels-fr.ts
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

const PROGRESS_FILE = '.seed-channels-fr-progress.json'
const MAX_VIDEOS_PER_CHANNEL = 500  // max vidéos importées par chaîne
const MAX_API_UNITS = 9_500

let apiUnitsUsed = 0
let totalVideos = 0

// ─── Liste des 156 chaînes ────────────────────────────────────────────────────
// Format: [nom_affiché, slug_handle_probable] — le slug est testé en premier (1 unité)
const CHANNELS: [string, string][] = [
  ['Nick Jr. France',            'nickjrfrance'],
  ['Kidi Fun',                   'kidifun'],
  ['Squeezie',                   'squeezie'],
  ['Swan & Néo',                 'swanneo'],
  ['Ryhan Family',               'ryhanfamily'],
  ['Tuvok12',                    'tuvok12'],
  ['Mayamystic',                 'mayamystic'],
  ['Furious Jumper',             'furiousjumper'],
  ['Fitness Muscu',              'fitnessmuscufr'],
  ['Seany Tv',                   'seanytv'],
  ['Fadi Maaz',                  'fadimaaz'],
  ['Amixem',                     'amixem'],
  ['Le Foot en Vidéo',           'lefootenvideo'],
  ['Grizzy et les Lemmings',     'grizzyleslemmings'],
  ['Madame Récré FR',            'madamerecrefr'],
  ['Léo Léo',                    'leoleo'],
  ['Sarah Lezito',               'sarahlezito'],
  ['FilmsActu',                  'filmsactu'],
  ['Remi Ragnar',                'remiragnar'],
  ['Cyprien',                    'cyprien'],
  ['Unchained Off',              'unchainedoff'],
  ['The Voice France',           'thevoicefrance'],
  ['Michou',                     'michouofficial'],
  ['BATZAIR',                    'batzair'],
  ['Peppa Pig Français',         'peppapigfrancais'],
  ['Le Parisien',                'leparisien'],
  ['Disney Kids FR',             'disneykidsfr'],
  ['Arabian Fairy Tales',        'arabianfairytales'],
  ['Dimerci TV',                 'dimercitv'],
  ['McFly et Carlito',           'mcflyetcarlito'],
  ['KIDIBLI en Français',        'kidiblifrancais'],
  ['ADEL et SAMI',               'adeletsami'],
  ['HeyKids Chansons',           'heykidschansons'],
  ['EchoroukTV',                 'echorouk'],
  ['Squeezie Gaming',            'squeeziegaming'],
  ['ROOKIE',                     'rookiefr'],
  ['Wankil Studio',              'wankilstudio'],
  ['L\'étoile Noire',            'letoilenoire'],
  ['Palmashow',                  'palmashow'],
  ['Natop Shorts',               'natopshorts'],
  ['Creamimy Artist',            'creaimyartist'],
  ['Lama Faché',                 'lamafache'],
  ['Unchained',                  'unchained'],
  ['FastGoodCuisine',            'fastgoodcuisine'],
  ['Renard',                     'renard'],
  ['Nickelodeon France',         'nickelodeonfrance'],
  ['Misha et Alex',              'mishaAlex'],
  ['SAM le SLICK SLIME',         'samslickslime'],
  ['Séan Garnier',               'seangarnier'],
  ['Comptines et Chansons',      'comptineschansons'],
  ['Rémi Gaillard',              'remigaillard'],
  ['Le Déraciné',                'lederacine'],
  ['MichouOff',                  'michouoff'],
  ['Anas Le Bled Art',           'anasledart'],
  ['Bleu',                       'bleufr'],
  ['WB Kids Français',           'wbkidsfrancais'],
  ['MatiFamily',                 'matifamily'],
  ['Tam Tam TV',                 'tamtamtv'],
  ['L\'atelier de Roxane',       'atelierroxane'],
  ['BroxEditZ',                  'broxeditz'],
  ['JOYCA',                      'joyca'],
  ['Binge Society',              'bingesociety'],
  ['GameMixTreize',              'gamemixtreize'],
  ['Fuze III',                   'fuzeiii'],
  ['XILAM TV',                   'xilamtv'],
  ['Brico Sympa',                'bricosympa'],
  ['Mr President',               'mrpresident'],
  ['Europe 1',                   'europe1'],
  ['REDKILL',                    'redkill'],
  ['Cartoon Network France',     'cartoonnetworkfr'],
  ['TheLyonBlack',               'thelyonblack'],
  ['Bollywood Mania',            'bollywoodmania'],
  ['SYMPA',                      'sympa'],
  ['France 24 Arabic',           'france24arabic'],
  ['Loïc Suberville',            'loicsuberville'],
  ['Investigation Discovery FR', 'investigationfr'],
  ['BFMTV',                      'bfmtv'],
  ['Star Freestyle',             'starfreestyle'],
  ['CANAL+ Sport',               'canalplussport'],
  ['Polo CBGames',               'cbgames'],
  ['Fantasyange',                'fantasyange'],
  ['lilyslilah',                 'lilyslilah'],
  ['Chefclub',                   'chefclubfr'],
  ['Cinéma Cinémas',             'cinemacinemas'],
  ['Redha Jr',                   'redhajr'],
  ['LeHuffPost',                 'lehuffpost'],
  ['Sam Zirah',                  'samzirah'],
  ['Antton Racca',               'anttonracca'],
  ['Fédération Française de Football', 'fff'],
  ['Booshra',                    'booshra'],
  ['Miraculous FR',              'miraculousfr'],
  ['Les P\'tits z\'Amis',        'lespttitszamis'],
  ['Caillou Français',           'cailloufrancais'],
  ['Rabbids Invasion',           'rabbidsinvasion'],
  ['PSG',                        'psg'],
  ['Ubisoft',                    'ubisoft'],
  ['Patrick Sébastien',          'patricksebastien'],
  ['Rock n Insectes',            'rockninsectes'],
  ['HugoDécrypte',               'hugodecrypte'],
  ['The Voice Kids France',      'thevoicekidsfrance'],
  ['SUPERBOUMJ',                 'superboumj'],
  ['LCI',                        'lcitv'],
  ['Inoxtag',                    'inoxtag'],
  ['AFP News Agency',            'afpnews'],
  ['YOUCAR',                     'youcar'],
  ['CYRILmp4',                   'cyrilmp4'],
  ['Les Parodie Bros',           'lesparodiebros'],
  ['Le Rire Jaune',              'lerirejauneofficiel'],
  ['Ligue 1 McDonald\'s',        'ligue1mcdonalds'],
  ['Brut',                       'brutfr'],
  ['LeBouseuh',                  'lebouseuh'],
  ['Siphano',                    'siphano'],
  ['Casquey',                    'casquey'],
  ['Bref Rap',                   'brefrap'],
  ['Studio Bagel',               'studiobagel'],
  ['BabyZone',                   'babyzone'],
  ['MrBoom',                     'mrboomfr'],
  ['Lolywood',                   'lolywood'],
  ['Mastu',                      'mastu'],
  ['WooHoo FR',                  'woohoofr'],
  ['Dr Nozman',                  'drnozman'],
  ['Netflix France',             'netflixfrance'],
  ['StundZow',                   'stundzow'],
  ['Zapping Sauvage',            'zappingsauvage'],
  ['Boogytoons',                 'boogytoons'],
  ['loufitlove',                 'loufitlove'],
  ['Supermassive',               'supermassive'],
  ['Amelina Kiss',               'amelinakiss'],
  ['Antoine Anecdotes',          'antoineanecdotes'],
  ['TF1 INFO',                   'tf1info'],
  ['Valouzz',                    'valouzz'],
  ['CodFamilya',                 'codfamilya'],
  ['Golden Moustache',           'goldenmoustache'],
  ['Booska-P',                   'booskap'],
  ['WildBrain Enfants',          'wildbrainenfants'],
  ['Cléopâtre',                  'cleopatre'],
  ['Les Anges',                  'lesanges'],
  ['Cute Roblox TV',             'cuteroboxtv'],
  ['Astuces du Panda',           'astucesdupanda'],
  ['Poisson Fécond',             'poissonfecond'],
  ['Hugoposé',                   'hugopose'],
  ['Fechal Vidéo',               'fechalvideo'],
  ['Rzm64',                      'rzm64'],
  ['Les Patapons',               'lespatapons'],
  ['Le Monde à l\'Envers',       'lemondeenvers'],
  ['Sora',                       'sorafr'],
  ['Ninjaxx',                    'ninjaxx'],
  ['Levilone Family',            'levilonefamily'],
  ['Skyrroz',                    'skyrroz'],
  ['Natoo',                      'natoo'],
]

// ─── Progress ─────────────────────────────────────────────────────────────────
interface Progress {
  done: string[]      // channel names already processed
  channelIds: Record<string, string>  // name → channelId cache
}

function loadProgress(): Progress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch {
    return { done: [], channelIds: {} }
  }
}

function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2))
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0')
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function checkQuota(label = '') {
  if (apiUnitsUsed >= MAX_API_UNITS) {
    console.log(`\n⚠️  Quota atteint (${apiUnitsUsed} unités).`)
    console.log('Progression sauvegardée — relance demain.')
    process.exit(0)
  }
}

// ─── Trouver le Channel ID ────────────────────────────────────────────────────
async function findChannelId(name: string, slug: string): Promise<string | null> {
  // Tentative 1 : forHandle (1 unité)
  const handles = [`@${slug}`, `@${name.replace(/[^a-zA-Z0-9]/g, '')}`, `@${name.replace(/\s+/g, '')}`]
  for (const handle of handles) {
    checkQuota()
    try {
      const res = await youtube.channels.list({ part: ['id'], forHandle: handle })
      apiUnitsUsed++
      const id = res.data.items?.[0]?.id
      if (id) return id
    } catch { /* essai suivant */ }
    await sleep(80)
  }

  // Tentative 2 : forUsername (1 unité)
  checkQuota()
  try {
    const res = await youtube.channels.list({ part: ['id'], forUsername: slug })
    apiUnitsUsed++
    const id = res.data.items?.[0]?.id
    if (id) return id
  } catch { }

  // Tentative 3 : search.list (100 unités — fallback)
  checkQuota()
  try {
    const res = await youtube.search.list({
      part: ['snippet'],
      q: name,
      type: ['channel'],
      regionCode: 'FR',
      relevanceLanguage: 'fr',
      maxResults: 3,
    })
    apiUnitsUsed += 100

    // Prend la première chaîne dont le titre ressemble au nom
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const target = norm(name)
    for (const item of res.data.items || []) {
      const title = norm(item.snippet?.channelTitle || '')
      if (title.includes(target.slice(0, 6)) || target.includes(title.slice(0, 6))) {
        return item.snippet?.channelId || item.id?.channelId || null
      }
    }
    // Si aucune correspondance exacte, prend le premier résultat
    const first = res.data.items?.[0]
    return first?.snippet?.channelId || first?.id?.channelId || null
  } catch { }

  return null
}

// ─── Importer les vidéos d'une chaîne ────────────────────────────────────────
async function importChannel(channelId: string, channelName: string): Promise<number> {
  checkQuota()

  // Récupère la playlist "uploads" et les infos de la chaîne
  let uploadsId: string | null = null
  let channelThumb: string | null = null
  let subscriberCount = 0

  try {
    const res = await youtube.channels.list({
      part: ['contentDetails', 'snippet', 'statistics'],
      id: [channelId],
    })
    apiUnitsUsed++
    const ch = res.data.items?.[0]
    if (!ch) return 0
    uploadsId = ch.contentDetails?.relatedPlaylists?.uploads || null
    channelThumb = ch.snippet?.thumbnails?.default?.url || null
    subscriberCount = parseInt(ch.statistics?.subscriberCount || '0')
  } catch { return 0 }

  if (!uploadsId) return 0

  // Récupère les IDs de vidéos via la playlist
  const videoIds: string[] = []
  let pageToken: string | undefined

  for (let page = 0; page < Math.ceil(MAX_VIDEOS_PER_CHANNEL / 50); page++) {
    checkQuota()
    try {
      const res = await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: uploadsId,
        maxResults: 50,
        pageToken,
      })
      apiUnitsUsed++
      for (const item of res.data.items || []) {
        if (item.contentDetails?.videoId) videoIds.push(item.contentDetails.videoId)
      }
      pageToken = res.data.nextPageToken || undefined
      if (!pageToken) break
      await sleep(100)
    } catch { break }
  }

  if (!videoIds.length) return 0

  // Récupère les détails de chaque vidéo (par batchs de 50)
  let imported = 0
  for (let i = 0; i < videoIds.length; i += 50) {
    checkQuota()
    const batch = videoIds.slice(i, i + 50)
    try {
      const res = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: batch,
      })
      apiUnitsUsed++

      // Vérifie si un créateur Notly a déjà revendiqué cette chaîne
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('youtube_channel_id', channelId)
        .single()

      const rows = (res.data.items || [])
        .filter(v => v.id && v.snippet?.title && (v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url))
        .map(v => ({
          creator_id: creator?.id || null,
          youtube_video_id: v.id!,
          title: v.snippet!.title!,
          description: (v.snippet?.description || '').slice(0, 5000),
          thumbnail_url:
            v.snippet?.thumbnails?.maxres?.url ||
            v.snippet?.thumbnails?.high?.url ||
            v.snippet?.thumbnails?.medium?.url ||
            v.snippet?.thumbnails?.default?.url!,
          duration: parseDuration(v.contentDetails?.duration || ''),
          published_at: v.snippet?.publishedAt || new Date().toISOString(),
          view_count: parseInt(v.statistics?.viewCount || '0'),
          youtube_channel_id: channelId,
          channel_name: channelName,
          channel_thumbnail: channelThumb,
        }))

      if (rows.length) {
        await supabase
          .from('videos')
          .upsert(rows, { onConflict: 'youtube_video_id', ignoreDuplicates: true })
        imported += rows.length
      }
      await sleep(80)
    } catch { /* skip batch */ }
  }

  return imported
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🇫🇷 Notly — Seed 156 chaînes françaises')
  console.log('==========================================')
  console.log(`Max vidéos par chaîne : ${MAX_VIDEOS_PER_CHANNEL}`)
  console.log(`Quota API max : ${MAX_API_UNITS} unités/run`)
  console.log('')

  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'placeholder') {
    console.error('❌ YOUTUBE_API_KEY manquant dans .env.local')
    process.exit(1)
  }

  const progress = loadProgress()
  const doneSet = new Set(progress.done)
  const channelIdCache = progress.channelIds

  const remaining = CHANNELS.filter(([name]) => !doneSet.has(name))
  console.log(`📊 ${CHANNELS.length} chaînes au total — ${doneSet.size} déjà traitées — ${remaining.length} restantes\n`)

  for (let i = 0; i < remaining.length; i++) {
    const [name, slug] = remaining[i]
    checkQuota()

    process.stdout.write(`[${i + 1}/${remaining.length}] ${name} ... `)

    // Trouver le channel ID (depuis le cache ou YouTube)
    let channelId = channelIdCache[name]
    if (!channelId) {
      channelId = (await findChannelId(name, slug)) || ''
      if (channelId) {
        channelIdCache[name] = channelId
        saveProgress({ done: Array.from(doneSet), channelIds: channelIdCache })
      }
    }

    if (!channelId) {
      console.log(`❌ introuvable (API: ${apiUnitsUsed})`)
      doneSet.add(name) // marque comme traité pour ne pas reessayer
      saveProgress({ done: Array.from(doneSet), channelIds: channelIdCache })
      continue
    }

    const count = await importChannel(channelId, name)
    totalVideos += count
    doneSet.add(name)

    console.log(`✅ ${count} vidéos | API: ${apiUnitsUsed} | Total: ${totalVideos}`)

    // Sauvegarde tous les 5 canaux
    if (i % 5 === 0) {
      saveProgress({ done: Array.from(doneSet), channelIds: channelIdCache })
    }

    await sleep(150)
  }

  saveProgress({ done: Array.from(doneSet), channelIds: channelIdCache })

  console.log('\n==========================================')
  console.log('✅ Terminé !')
  console.log(`   Chaînes traitées : ${doneSet.size}/${CHANNELS.length}`)
  console.log(`   Vidéos importées : ${totalVideos.toLocaleString()}`)
  console.log(`   Unités API utilisées : ${apiUnitsUsed} / 10,000`)
  if (doneSet.size < CHANNELS.length) {
    console.log('\n   Relance demain pour continuer avec les chaînes restantes.')
  }
}

main().catch(err => {
  console.error('\n❌ Erreur fatale :', err.message)
  process.exit(1)
})

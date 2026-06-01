/**
 * Seed script — 143 chaînes YouTube françaises avec Channel IDs hardcodés.
 * Importe toutes les vidéos de chaque chaîne directement, sans appels de découverte.
 *
 * Coût API : ~6-8 unités par chaîne (channels.list + playlistItems + videos.list)
 * Quota gratuit = 10 000 unités/jour → ~150 chaînes par run
 *
 * Usage :
 *   npm run seed:channels
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
const MAX_VIDEOS_PER_CHANNEL = 500
const MAX_API_UNITS = 9_500

let apiUnitsUsed = 0
let totalVideos = 0

// ─── 143 chaînes françaises — [nom, channelId] ───────────────────────────────
const CHANNELS: [string, string][] = [
  ['Nick Jr. France',                  'UCKjDy-Wv29ZVd_itGOe76LA'],
  ['Kidi Fun',                         'UCKG_7KqdGT4YceIh-lCfNUA'],
  ['Squeezie',                         'UCWeg2Pkate69NFdBeuRFTAw'],
  ['Swan & Néo',                       'UCzYC9ss2P77Ry2LzIDL5Xsw'],
  ['Ryhan Family',                     'UCcFQLco2CA2uq9J2Uwcoi6Q'],
  ['Tuvok12',                          'UC5xkroXBlsRzInHzVaFO5HA'],
  ['Mayamystic',                       'UCsbzkA9S4TPhkt2Kl2Rx3ig'],
  ['Furious Jumper',                   'UCLMKLU-ZuDQIsbjMvR3bbog'],
  ['Fitness Muscu',                    'UCev7uCn7hMoehbcMj1sadcQ'],
  ['Seany Tv',                         'UCpCLsVt-9LhvDKvEzE7Kw7A'],
  ['Fadi Maaz',                        'UCUB7RmTY80Wy0Xo0biV34vQ'],
  ['Amixem',                           'UCgvqvBoSHB1ctlyyhoHrGwQ'],
  ['Le Foot en Vidéo',                 'UC960cXgEv6mCZ5iGnWSd0oQ'],
  ['Grizzy et les Lemmings',           'UCn9l4gU5mkmmlC2eiVu0LHw'],
  ['Madame Récré FR',                  'UCH0HvBshlVE7gCoV6as51og'],
  ['Léo Léo',                          'UCJDBsRxSr-sSHjLyZOeiG3g'],
  ['Sarah Lezito',                     'UCvlBxzsiVjykUcKW9OxN8kg'],
  ['FilmsActu',                        'UC_i8X3p8oZNaik8X513Zn1Q'],
  ['Remi Ragnar',                      'UCD1DAIeBN62QafNLArqZDrQ'],
  ['Cyprien',                          'UCyWqModMQlbIo8274Wh_ZsQ'],
  ['Unchained Off',                    'UCiFyJ_EBmF2XJuR9buWE_3A'],
  ['The Voice France',                 'UCQRELbX0H5FCokIFxOAsHFA'],
  ['Michou',                           'UCo3i0nUzZjjLuM7VjAVz4zA'],
  ['BATZAIR',                          'UCCU2Tvanl8gLaJ7pYDuIYkg'],
  ['Peppa Pig Français',               'UCXptamDYEVcU4JCio30hYTw'],
  ['Le Parisien',                      'UCfHn_8-ehdem86fEvlFg-Gw'],
  ['Disney Kids FR',                   'UC7Gf2tZ8coTX2ckTPgn62iQ'],
  ['Arabian Fairy Tales',              'UCazFScO30FKY3YoNNDfNY5g'],
  ['Dimerci TV',                       'UCXFrzOlPpbOZOd1KClSWlQw'],
  ['McFly et Carlito',                 'UCDPK_MTu3uTUFJXRVcTJcEw'],
  ['KIDIBLI en Français',              'UCustR5f-R1KVU-jZEqGo3_g'],
  ['ADEL et SAMI',                     'UCPalOwaTaSwFS4PANDNv7Zg'],
  ['HeyKids Chansons',                 'UCl0KdGiwyqLJCdu5XMIz_TQ'],
  ['EchoroukTV',                       'UCd9ox6D3VbhNp3kJNTxQzCQ'],
  ['Squeezie Gaming',                  'UCY-_QmcW09PHAImgVnKxU2g'],
  ['Wankil Studio',                    'UCYGjxo5ifuhnmvhPvCc3DJQ'],
  ["L'étoile Noire",                   'UCky8Z5AYEHA55-r2TFNC_KA'],
  ['Palmashow',                        'UCoZoRz4-y6r87ptDp4Jk74g'],
  ['Natop Shorts',                     'UCPZJQKRCa8qR42yrbsZPA0A'],
  ['Creamimy Artist',                  'UCIXh7Oo7kooBy7cTzh86IEg'],
  ['Lama Faché',                       'UCH0XvUpYcxn4V0iZGnZXMnQ'],
  ['Unchained',                        'UCugeH-Bmo9a5-Jnbt9X-3bA'],
  ['FastGoodCuisine',                  'UCKq9JxyISqBHDd-fXfV3QtQ'],
  ['Nickelodeon France',               'UCeGvSi1Tb8OV78ue3_tux1A'],
  ['Misha et Alex',                    'UChocYxNSOmyI53eGUuiECvA'],
  ['SAM le SLICK SLIME',               'UC7mEf-ZbAc7at0QUoI-DiMQ'],
  ['Séan Garnier',                     'UCIGIk1wN10aAPHusfE7AEPA'],
  ['Comptines et Chansons',            'UCq6jhYDQ2HBvEPIev8NDglw'],
  ['Rémi Gaillard',                    'UCmPSwsooZq8an7xOLQQhAdw'],
  ['Le Déraciné',                      'UCpsvoU1qL4WLR6jvh1CWjhw'],
  ['MichouOff',                        'UCOdKaYgvLlPuinUJ1z5Gm2g'],
  ['Anas Le Bled Art',                 'UCP8A8blIPLuL2kSSrhKJIhg'],
  ['Bleu',                             'UCvBAeCRF5iFQUVueXQT81NQ'],
  ['WB Kids Français',                 'UCqvIdlrnd4DCcqp2DZwaZYw'],
  ['MatiFamily',                       'UCdbxtRmc5oM2tQBqpQ-Tk7w'],
  ['Tam Tam TV',                       'UChOQ_YphUJTEczNXMrUoucg'],
  ["L'atelier de Roxane",              'UC3rxwrZSiTp6Kk2RXcyHtCA'],
  ['BroxEditZ',                        'UCf7BD2olgOvb51FaIFNUmhA'],
  ['JOYCA',                            'UCow2IGnug1l3Xazkrc5jM_Q'],
  ['Binge Society',                    'UCOo_v3eVbfET7_zi2KLOP9g'],
  ['GameMixTreize',                    'UCNVMW8UDDZYVxXJqVs3lnUA'],
  ['Fuze III',                         'UCfznY5SlSoZoXN0-kBPtCdg'],
  ['XILAM TV',                         'UCunZysK4AQ45ewLs5OhSsrg'],
  ['Brico Sympa',                      'UC9TJezP2M1ADmUYVl8hrQ2A'],
  ['Europe 1',                         'UCIMGfEAERXjmWwQeg15BFsg'],
  ['REDKILL',                          'UCAo9RLXZvUiyRllJ-1Ekefg'],
  ['Cartoon Network France',           'UCO-sJY43ksC5ir_Jf1YJDew'],
  ['TheLyonBlack',                     'UCMsCTwRr0vpB8anyEiLJMmg'],
  ['Bollywood Mania',                  'UCqnNoWp-C7MjIKPTVTBtstQ'],
  ['SYMPA',                            'UCt6IQpsggvn6zmalhPglSEA'],
  ['France 24 Arabic',                 'UCdTyuXgmJkG_O8_75eqej-w'],
  ['Loïc Suberville',                  'UCywGsTdh_qqZUYmA2Gro2CA'],
  ['BFMTV',                            'UCXwDLMDV86ldKoFVc_g8P0g'],
  ['Star Freestyle',                   'UCwwgI0AzG5Y2lU-C8LiKP2A'],
  ['CANAL+ Sport',                     'UC8ggH3zU61XO0nMskSQwZdA'],
  ['Polo CBGames',                     'UCD94IYXQINu04R0KxOrhEzA'],
  ['Fantasyange',                      'UC18NpPsh3gV4u7KDSRYGZhw'],
  ['lilyslilah',                       'UCi86W8vBDYYSRABNpzl5i-w'],
  ['Chefclub',                         'UCqdiFB7Tfs_DpEMSzmoHZ8w'],
  ['Cinéma Cinémas',                   'UCQIrvVPHrt2cN14ktGA2Snw'],
  ['Redha Jr',                         'UCjDJyveN85BFN5QcQ0iDqnQ'],
  ['LeHuffPost',                       'UC9GGzAhhvhJO1hL10-BcgNA'],
  ['Sam Zirah',                        'UC_z1oN2V5Im7o5YMY5pfRrA'],
  ['Antton Racca',                     'UCxAe6guYq0Q-UBfQrEauF2A'],
  ['Fédération Française de Football', 'UCeJlXGyEl7kBgQJKADAHM3A'],
  ['Booshra',                          'UCUJjGd8fKVtaZ10YGRB36uw'],
  ['Miraculous FR',                    'UCIpBLlcyR1W6oEji4_qdrQA'],
  ["Les P'tits z'Amis",               'UC9pxNghOaqpW4FzW74_KS1Q'],
  ['Caillou Français',                 'UCBwSqx6A83sNQ5SIYWpmucQ'],
  ['Rabbids Invasion',                 'UC7KswdJ3yn5yzqUU4wWQHNg'],
  ['PSG',                              'UCt9a_qP9CqHCNwilf-iULag'],
  ['Ubisoft',                          'UCEl915e-AtoJ7i1m_SXekTw'],
  ['Patrick Sébastien',                'UCpo07GQbWMybKrjgoVf4ETg'],
  ['Rock n Insectes',                  'UC6lDwIetO21Ed4kHMd5Eoxg'],
  ['HugoDécrypte',                     'UCAcAnMF0OrCtUep3Y4M-ZPw'],
  ['The Voice Kids France',            'UCxaCpO3C7BM-8zNvP-SgBgQ'],
  ['SUPERBOUMJ',                       'UCIP_mImUesUeVaLsLEzH9zA'],
  ['LCI',                              'UCh3EoX0OabKZJj9jMrViBfA'],
  ['Inoxtag',                          'UCL9aTJb0ur4sovxcppAopEw'],
  ['AFP News Agency',                  'UC86dbj-lbDks_hZ5gRKL49Q'],
  ['CYRILmp4',                         'UC-4M8AN08hw39nn2v91VuMQ'],
  ['Les Parodie Bros',                 'UCMqzZ17aTG2hKj2mVl7U4MA'],
  ['Le Rire Jaune',                    'UCTt2AnK--mnRmICnf-CCcrw'],
  ['Brut',                             'UCSKdvgqdnj72_SLggp7BDTg'],
  ['LeBouseuh',                        'UCUl7mwOyySfZzUkq4H29nug'],
  ['Siphano',                          'UCwa-qCAFghXwkcQvLadzRxQ'],
  ['Casquey',                          'UCnnUozIhtK9k_ubGIo8J3FQ'],
  ['Bref Rap',                         'UCq0u7q5-uCs7djwM5AZdBRg'],
  ['Studio Bagel',                     'UCZ8kV8vuMdDLSerCIFfWnFQ'],
  ['BabyZone',                         'UC6vi73R2Z82ppU6OpFwml0A'],
  ['MrBoom',                           'UCUfHr7rri9NzdINueLllWQg'],
  ['Lolywood',                         'UCSse-lNI1DQ4w-8lh7vfPUw'],
  ['Mastu',                            'UCAhaFPP6v3WCfK5Tjao0B7A'],
  ['WooHoo FR',                        'UC_43FPUCrWzUUsPsdwDCtKw'],
  ['Dr Nozman',                        'UCWnfDPdZw6A23UtuBpYBbAg'],
  ['Netflix France',                   'UCroNr00O68n25IqSNapMK8w'],
  ['StundZow',                         'UCcXNrBbhJ2AwbtiPTzQCJ-A'],
  ['Zapping Sauvage',                  'UCAdyNOE80FsFPYlFliyXfwQ'],
  ['Boogytoons',                       'UC2mjGHgbQYCw8zk0yyfB6IA'],
  ['loufitlove',                       'UCicJflaX_UIUfE8bS5rN0mQ'],
  ['Supermassive',                     'UCe6iWPkV14Hubsp4uh2PKnw'],
  ['Amelina Kiss',                     'UCON8Ljv25qnZeKVGyTKG1OA'],
  ['Antoine Anecdotes',                'UCmXnPRRKXki6EwVbUdcQ8Ng'],
  ['TF1 INFO',                         'UCsrPUA0ZSDCNZC6wyRlR7ZA'],
  ['Valouzz',                          'UCNGq4mP3Ds5OUGjPo8IJOcw'],
  ['CodFamilya',                       'UCbjN965MfRvLTYB0aoKzK_Q'],
  ['Golden Moustache',                 'UCJruTcTs7Gn2Tk7YC-ENeHQ'],
  ['Booska-P',                         'UCczuNg-bajJgZLYhrY7FpfA'],
  ['WildBrain Enfants',                'UCxa1aSLYVSb_yl6uCbZRQKw'],
  ['Cléopâtre',                        'UCIZ576juGNes2oNxuhTHjbg'],
  ['Les Anges',                        'UCpW9o_uVp9k2W46HBcXba7Q'],
  ['Cute Roblox TV',                   'UCUtGeBjufNZbnZvgW1f5u0A'],
  ['Astuces du Panda',                 'UCWrtcU1OId_PQ_YoBN6lIRA'],
  ['Poisson Fécond',                   'UC4ii4_aeS8iOFzsHuhJTq2w'],
  ['Hugoposé',                         'UCByWJsWPztkY3Rta2B62tgg'],
  ['Rzm64',                            'UC1cqMendY9E3Nl0WHkut1NQ'],
  ['Les Patapons',                     'UCSpE7jrokfnEaVb7Ujf-hYQ'],
  ["Le Monde à l'Envers",             'UCeqsLJGWhZXEerY5JWvwLkg'],
  ['Sora',                             'UCoY9dSehUOccMeV06OGmuQA'],
  ['Ninjaxx',                          'UCDB1PaqiausfXbVI2Jjk0iQ'],
  ['Levilone Family',                  'UCuR31TD-TrbjOrEZ0m0TQkg'],
  ['Skyrroz',                          'UCP4wIoy9W9WdAfVIN2sVmEw'],
  ['Natoo',                            'UCtihF1ZtlYVzoaj_bKLQZ-Q'],
]

// ─── Progress ─────────────────────────────────────────────────────────────────
function loadProgress(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    return new Set(data.done || [])
  } catch {
    return new Set()
  }
}

function saveProgress(done: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ done: Array.from(done) }, null, 2))
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

function checkQuota() {
  if (apiUnitsUsed >= MAX_API_UNITS) {
    console.log(`\n⚠️  Quota atteint (${apiUnitsUsed} unités).`)
    console.log('Progression sauvegardée — relance demain.')
    process.exit(0)
  }
}

// ─── Importer les vidéos d'une chaîne ────────────────────────────────────────
async function importChannel(channelId: string, channelName: string): Promise<number> {
  checkQuota()

  let uploadsId: string | null = null
  let channelThumb: string | null = null

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
  } catch { return 0 }

  if (!uploadsId) return 0

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
  console.log('🇫🇷 Notly — Seed 143 chaînes françaises (IDs hardcodés)')
  console.log('============================================================')
  console.log(`Max vidéos par chaîne : ${MAX_VIDEOS_PER_CHANNEL}`)
  console.log(`Quota API max : ${MAX_API_UNITS} unités/run`)
  console.log('')

  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'placeholder') {
    console.error('❌ YOUTUBE_API_KEY manquant dans .env.local')
    process.exit(1)
  }

  const doneSet = loadProgress()
  const remaining = CHANNELS.filter(([name]) => !doneSet.has(name))
  console.log(`📊 ${CHANNELS.length} chaînes — ${doneSet.size} déjà traitées — ${remaining.length} restantes\n`)

  for (let i = 0; i < remaining.length; i++) {
    const [name, channelId] = remaining[i]
    checkQuota()

    process.stdout.write(`[${i + 1}/${remaining.length}] ${name} (${channelId}) ... `)

    const count = await importChannel(channelId, name)
    totalVideos += count
    doneSet.add(name)

    console.log(`✅ ${count} vidéos | API: ${apiUnitsUsed} | Total: ${totalVideos}`)

    if (i % 5 === 0) saveProgress(doneSet)
    await sleep(150)
  }

  saveProgress(doneSet)

  console.log('\n============================================================')
  console.log('✅ Terminé !')
  console.log(`   Chaînes traitées : ${doneSet.size}/${CHANNELS.length}`)
  console.log(`   Vidéos importées : ${totalVideos.toLocaleString()}`)
  console.log(`   Unités API utilisées : ${apiUnitsUsed} / 10,000`)
  if (doneSet.size < CHANNELS.length) {
    console.log('\n   Relance demain pour continuer.')
  }
}

main().catch(err => {
  console.error('\n❌ Erreur fatale :', err.message)
  process.exit(1)
})

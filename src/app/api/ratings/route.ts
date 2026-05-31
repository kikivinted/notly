import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: in-memory store (use Redis in production)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const window = 60_000 // 1 minute
  const maxRequests = 10

  const entry = rateLimit.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  const body = await request.json()
  const { videoId, score } = body

  if (!videoId || !score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Upsert rating
  const { data, error } = await admin
    .from('ratings')
    .upsert(
      { user_id: user.id, video_id: videoId, score: Math.round(score) },
      { onConflict: 'user_id,video_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get updated video stats
  const { data: video } = await admin
    .from('videos')
    .select('avg_rating, total_votes')
    .eq('id', videoId)
    .single()

  return NextResponse.json({ rating: data, video })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ratings')
    .delete()
    .eq('user_id', user.id)
    .eq('video_id', videoId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  const query = supabase.from('ratings').select('*').eq('user_id', user.id)
  if (videoId) query.eq('video_id', videoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ratings: data })
}

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Compute monthly top
  const currentPeriod = new Date().toISOString().slice(0, 7)
  await admin.rpc('compute_monthly_tops', { p_period: currentPeriod })

  // Compute semester top
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() < 6 ? 'S1' : 'S2'
  await admin.rpc('compute_semester_tops', { p_period: `${year}-${semester}` })

  return NextResponse.json({ success: true, period: currentPeriod })
}

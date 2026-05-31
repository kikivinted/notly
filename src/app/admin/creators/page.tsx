import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatDate, formatNumber } from '@/lib/utils'

export const metadata = { title: 'Creators — Admin' }

export default async function AdminCreatorsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userData } = await admin.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') redirect('/')

  const { data: creators } = await admin
    .from('creators')
    .select('*, users(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Creators ({creators?.length || 0})</h1>

        <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {['Channel', 'Subscribers', 'Status', 'Subscription', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {creators?.map((c) => (
                <tr key={c.id} className="hover:bg-surface-3 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/creator/${c.id}`} className="text-sm text-white font-medium hover:text-accent transition-colors">
                      {c.channel_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatNumber(c.subscriber_count)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.subscription_status === 'active' ? 'bg-accent/10 text-accent' :
                      c.subscription_status === 'past_due' ? 'bg-red-500/10 text-red-400' :
                      'bg-surface-3 text-text-secondary'
                    }`}>{c.subscription_status || 'none'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

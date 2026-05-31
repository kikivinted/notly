import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userData } = await admin.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') redirect('/')

  const { data: users } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Users ({users?.length || 0})</h1>

        <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {['Username', 'Email', 'Role', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-surface-3 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                      u.role === 'creator' ? 'bg-accent/10 text-accent' :
                      'bg-surface-3 text-text-secondary'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

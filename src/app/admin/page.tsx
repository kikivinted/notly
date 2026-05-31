import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, Video, Star, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export const metadata = { title: 'Admin — Notly' }

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userData } = await admin.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') redirect('/')

  const [
    { count: userCount },
    { count: creatorCount },
    { count: videoCount },
    { count: ratingCount },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('creators').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('videos').select('*', { count: 'exact', head: true }),
    admin.from('ratings').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Admin</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: formatNumber(userCount || 0), icon: <Users className="w-5 h-5" /> },
            { label: 'Active Creators', value: formatNumber(creatorCount || 0), icon: <Star className="w-5 h-5" /> },
            { label: 'Videos', value: formatNumber(videoCount || 0), icon: <Video className="w-5 h-5" /> },
            { label: 'Ratings', value: formatNumber(ratingCount || 0), icon: <TrendingUp className="w-5 h-5" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-2 border border-border rounded-xl p-5">
              <div className="text-accent mb-3">{stat.icon}</div>
              <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/users" className="bg-surface-2 border border-border hover:border-border-hover rounded-xl p-6 transition-colors group">
            <Users className="w-6 h-6 text-accent mb-3" />
            <h2 className="font-display font-bold text-white group-hover:text-accent transition-colors">User Management</h2>
            <p className="text-sm text-text-secondary mt-1">View and manage all registered users</p>
          </Link>
          <Link href="/admin/creators" className="bg-surface-2 border border-border hover:border-border-hover rounded-xl p-6 transition-colors group">
            <Star className="w-6 h-6 text-accent mb-3" />
            <h2 className="font-display font-bold text-white group-hover:text-accent transition-colors">Creator Management</h2>
            <p className="text-sm text-text-secondary mt-1">Manage creator accounts and subscriptions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { PlayCircle, RefreshCw, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChannelPage() {
  const [creator, setCreator] = useState<any>(null)
  const [channelId, setChannelId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ imported: number; total: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('creators').select('*').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (!data) { router.push('/creator/dashboard'); return }
          setCreator(data)
          if (data.youtube_channel_id !== 'pending') {
            setChannelId(data.youtube_channel_id)
          }
        })
    })
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelId.trim()) return
    setConnecting(true)
    try {
      const res = await fetch('/api/youtube/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channelId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Channel connected! ${data.videosImported} videos imported.`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect channel')
    } finally {
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/youtube/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult({ imported: data.imported, total: data.total })
      toast.success(`Sync complete! ${data.imported} videos updated.`)
    } catch (err: any) {
      toast.error(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (!creator) return <div className="pt-24 px-4 text-center text-text-secondary">Loading...</div>

  const isConnected = creator.youtube_channel_id && creator.youtube_channel_id !== 'pending'

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-8">YouTube Channel</h1>

        {isConnected ? (
          <div className="space-y-6">
            <div className="bg-surface-2 border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Check className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold text-white">Channel connected</h2>
              </div>
              <div className="space-y-2 text-sm text-text-secondary">
                <p><span className="text-white">Name:</span> {creator.channel_name}</p>
                <p><span className="text-white">Channel ID:</span> {creator.youtube_channel_id}</p>
                <p><span className="text-white">Subscribers:</span> {creator.subscriber_count?.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-2">Manual sync</h2>
              <p className="text-sm text-text-secondary mb-4">Videos sync automatically every 24h. You can also trigger a manual sync.</p>
              <Button onClick={handleSync} loading={syncing} variant="secondary" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Sync now
              </Button>
              {syncResult && (
                <p className="text-sm text-green-400 mt-3">
                  ✓ {syncResult.imported} / {syncResult.total} videos synced
                </p>
              )}
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-2">Change channel</h2>
              <p className="text-sm text-text-secondary mb-4">Enter a new YouTube Channel ID to change your connected channel.</p>
              <form onSubmit={handleConnect} className="flex gap-3">
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UCxxxxxxxxxxxxx"
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent"
                />
                <Button type="submit" loading={connecting} size="sm">Update</Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-surface-2 border border-border rounded-2xl p-8">
            <div className="text-center mb-8">
              <PlayCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-white mb-2">Connect your YouTube channel</h2>
              <p className="text-text-secondary text-sm">Enter your YouTube Channel ID to import your videos and start receiving ratings.</p>
            </div>

            <div className="bg-surface-3 rounded-xl p-4 mb-6 text-sm text-text-secondary">
              <p className="font-medium text-white mb-1">How to find your Channel ID:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your YouTube channel</li>
                <li>Click on your profile → Settings</li>
                <li>Under "Advanced settings", find your Channel ID</li>
                <li>It starts with "UC" followed by letters/numbers</li>
              </ol>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary block mb-1.5">YouTube Channel ID</label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UCxxxxxxxxxxxxx"
                  required
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-accent"
                />
              </div>
              <Button type="submit" loading={connecting} className="w-full" size="lg">
                Connect & Import Videos
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

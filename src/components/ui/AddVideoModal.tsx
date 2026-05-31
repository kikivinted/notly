'use client'

import { useState } from 'react'
import { X, Link, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface AddVideoModalProps {
  onClose: () => void
}

export function AddVideoModal({ onClose }: AddVideoModalProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      if (data.alreadyExists) {
        toast('This video is already on Notly!', { icon: 'ℹ️' })
      } else {
        toast.success('Video added to Notly!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add video')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToVideo = () => {
    if (result?.video?.id) {
      router.push(`/video/${result.video.id}`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-white">Add a YouTube video</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary block mb-1.5">YouTube URL or video ID</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  autoFocus
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1.5">Paste any YouTube URL or video ID</p>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Importing...' : 'Add video'}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="font-semibold text-white mb-1">{result.video.title}</p>
            <p className="text-sm text-text-secondary mb-6">
              {result.alreadyExists ? 'Already on Notly' : 'Successfully added'}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
              <Button onClick={handleGoToVideo} className="flex-1">Rate it →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

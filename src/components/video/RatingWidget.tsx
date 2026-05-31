'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface RatingWidgetProps {
  videoId: string
  initialRating: number | null
}

export function RatingWidget({ videoId, initialRating }: RatingWidgetProps) {
  const [rating, setRating] = useState(initialRating)
  const [pending, setPending] = useState(false)
  const [user, setUser] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(!!data.user)
    })
  })

  const handleRate = async (score: number) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      toast.error('Sign in to rate videos')
      return
    }
    setPending(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, score }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRating(score)
      toast.success(initialRating ? 'Rating updated!' : 'Video rated!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to rate')
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async () => {
    setPending(true)
    try {
      const res = await fetch(`/api/ratings?videoId=${videoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setRating(null)
      toast.success('Rating removed')
      router.refresh()
    } catch {
      toast.error('Failed to remove rating')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-text-secondary mb-3 text-center">
        {rating ? 'Your rating' : 'Rate this video'}
      </p>
      <div className="flex justify-center mb-4">
        <StarRating
          score={rating || 0}
          interactive
          onRate={handleRate}
          size="lg"
        />
      </div>
      {rating && (
        <div className="text-center space-y-2">
          <p className="text-xs text-text-secondary">You rated this video <strong className="text-accent">{rating}/5</strong></p>
          <Button variant="ghost" size="sm" onClick={handleDelete} loading={pending} className="text-text-secondary hover:text-red-400">
            Remove rating
          </Button>
        </div>
      )}
      {!rating && (
        <p className="text-center text-xs text-text-secondary">
          Click a star to rate · <Link href="/login" className="text-accent hover:underline">Sign in</Link> required
        </p>
      )}
    </div>
  )
}

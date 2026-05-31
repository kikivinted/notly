'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to confirm.')
      if (plan) {
        router.push('/creator/dashboard/billing')
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-bold text-white">
            Not<span className="text-accent">ly</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mt-6 mb-2">
            {plan ? 'Join as a Creator' : 'Create your account'}
          </h1>
          <p className="text-text-secondary">
            {plan ? 'Set up your account, then connect your channel' : 'Rate videos, discover creators'}
          </p>
        </div>

        {plan && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-6 text-sm text-accent text-center">
            You selected the <strong>{plan === 'annual' ? 'Annual' : 'Monthly'}</strong> Creator Pro plan
          </div>
        )}

        <div className="bg-surface-2 border border-border rounded-2xl p-8">
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 bg-surface-3 hover:bg-border border border-border rounded-xl py-3 text-sm font-medium text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                minLength={3}
                maxLength={30}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="yourusername"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import { Menu, X, Search, Bell, ChevronDown, LogOut, Settings, LayoutDashboard, Plus } from 'lucide-react'
import { AddVideoModal } from '@/components/ui/AddVideoModal'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [addVideoOpen, setAddVideoOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
        setUser(data)
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setDropdownOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { href: '/discover', label: 'Discover' },
    { href: '/top/monthly', label: 'Monthly Top' },
    { href: '/top/semester', label: 'Semester Top' },
    { href: '/pricing', label: 'For Creators' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-surface/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-display text-2xl font-bold text-white">
              Not<span className="text-accent">ly</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-white',
                  pathname === link.href ? 'text-white' : 'text-text-secondary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search + Auth */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-accent w-48 transition-all focus:w-64"
              />
            </form>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAddVideoOpen(true)}
                  className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add video
                </button>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-surface-2 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-white">{user.username}</span>
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface-2 border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-border">
                      <p className="text-xs text-text-secondary">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    {user.role === 'creator' || user.role === 'admin' ? (
                      <Link
                        href="/creator/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    ) : null}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Admin
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
                    >
                      <Bell className="w-4 h-4" /> My Ratings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-surface-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-text-secondary hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-text-secondary hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-accent"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-sm text-text-secondary hover:text-white py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-sm text-text-secondary hover:text-white py-2">My Ratings</Link>
                {(user.role === 'creator' || user.role === 'admin') && (
                  <Link href="/creator/dashboard" onClick={() => setIsOpen(false)} className="block text-sm text-text-secondary hover:text-white py-2">Dashboard</Link>
                )}
                <button onClick={handleSignOut} className="text-sm text-red-400 py-2">Sign out</button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center border border-border rounded-lg py-2 text-sm text-text-secondary hover:text-white transition-colors">Sign in</Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center bg-accent text-white rounded-lg py-2 text-sm font-medium hover:bg-accent-hover transition-colors">Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
      {addVideoOpen && <AddVideoModal onClose={() => setAddVideoOpen(false)} />}
    </nav>
  )
}

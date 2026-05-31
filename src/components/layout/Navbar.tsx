'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import { Menu, X, Search, ChevronDown, LogOut, Settings, LayoutDashboard, Plus, Star, Loader2 } from 'lucide-react'
import { AddVideoModal } from '@/components/ui/AddVideoModal'

interface SearchResult {
  notlyId: string | null
  youtubeId: string
  title: string
  thumbnail: string
  channelName: string
  channelId?: string
  duration: string
  avgRating: number
  totalVotes: number
  inNotly: boolean
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [addVideoOpen, setAddVideoOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<NodeJS.Timeout>()
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

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (searchQuery.length < 2) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
        setSearchOpen(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery])

  const handleSelectResult = async (result: SearchResult) => {
    setSearchOpen(false)
    setSearchQuery('')

    if (result.notlyId) {
      // Already in Notly, go directly
      router.push(`/video/${result.notlyId}`)
    } else {
      // Auto-import from YouTube then navigate
      try {
        const res = await fetch('/api/videos/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.youtubeId }),
        })
        const data = await res.json()
        if (data.video?.id) {
          router.push(`/video/${data.video.id}`)
        } else {
          // Not logged in or error, go to YouTube search page
          router.push(`/discover?q=${encodeURIComponent(result.title)}`)
        }
      } catch {
        router.push(`/discover?q=${encodeURIComponent(result.title)}`)
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setDropdownOpen(false)
  }

  const navLinks = [
    { href: '/discover', label: 'Discover' },
    { href: '/top/monthly', label: 'Top Monthly' },
    { href: '/top/semester', label: 'Top Semester' },
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

          {/* Desktop nav links */}
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
          <div className="hidden md:flex items-center gap-3">
            {/* Live search */}
            <div ref={searchRef} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary z-10" />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary animate-spin z-10" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search any YouTube video..."
                className="bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-accent w-56 transition-all focus:w-72"
              />

              {/* Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-[420px] bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-border">
                    <p className="text-xs text-text-secondary px-2">
                      {searchResults.filter(r => r.inNotly).length > 0
                        ? `${searchResults.filter(r => r.inNotly).length} on Notly · ${searchResults.filter(r => !r.inNotly).length} from YouTube`
                        : `${searchResults.length} results from YouTube`
                      }
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.youtubeId}
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-3 transition-colors text-left group"
                      >
                        <div className="relative w-16 h-9 rounded overflow-hidden flex-shrink-0 bg-surface-3">
                          {result.thumbnail && (
                            <Image src={result.thumbnail} alt={result.title} fill className="object-cover" sizes="64px" />
                          )}
                          {result.duration && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                              {result.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-accent transition-colors">
                            {result.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-text-secondary truncate">{result.channelName}</span>
                            {result.inNotly && result.totalVotes > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-accent flex-shrink-0">
                                <Star className="w-3 h-3 fill-accent" />
                                {result.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {result.inNotly ? (
                            <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded-full">Notly</span>
                          ) : (
                            <span className="text-[10px] bg-surface-3 text-text-secondary border border-border px-1.5 py-0.5 rounded-full">YouTube</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border">
                    <Link
                      href={`/discover?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors py-1"
                    >
                      <Search className="w-3 h-3" /> See all results for "{searchQuery}"
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddVideoOpen(true)}
                  className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-surface-2 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
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
                      {(user.role === 'creator' || user.role === 'admin') && (
                        <Link href="/creator/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors">
                          <Settings className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors">
                        <Star className="w-4 h-4" /> My Ratings
                      </Link>
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-surface-3 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-text-secondary hover:text-white transition-colors">Sign in</Link>
                <Link href="/register" className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-text-secondary hover:text-white transition-colors">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-4 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any YouTube video..."
                className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-accent"
              />
            </div>
            {/* Mobile search results */}
            {searchOpen && searchResults.length > 0 && (
              <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
                {searchResults.slice(0, 5).map((result) => (
                  <button key={result.youtubeId} onClick={() => { setIsOpen(false); handleSelectResult(result) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border last:border-0">
                    <div className="relative w-14 h-8 rounded overflow-hidden flex-shrink-0 bg-surface-3">
                      {result.thumbnail && <Image src={result.thumbnail} alt={result.title} fill className="object-cover" sizes="56px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium line-clamp-1">{result.title}</p>
                      <p className="text-xs text-text-secondary">{result.channelName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="block text-sm text-text-secondary hover:text-white py-2 transition-colors">
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

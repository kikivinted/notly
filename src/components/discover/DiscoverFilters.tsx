'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

interface Props {
  defaultQuery?: string
  defaultSort?: string
  defaultMinRating?: string
}

export function DiscoverFilters({ defaultQuery, defaultSort, defaultMinRating }: Props) {
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState(defaultSort || 'trending')
  const [minRating, setMinRating] = useState(defaultMinRating || '')

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams()
    if (defaultQuery) params.set('q', defaultQuery)
    if (newParams.sort) params.set('sort', newParams.sort)
    if (newParams.minRating) params.set('minRating', newParams.minRating)
    router.push(`/discover?${params.toString()}`)
  }

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'top_rated', label: 'Top Rated' },
    { value: 'most_voted', label: 'Most Voted' },
    { value: 'newest', label: 'Newest' },
  ]

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSort(opt.value)
                applyFilters({ sort: opt.value, minRating })
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-white border border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-secondary hover:text-white transition-colors ml-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>
      {showFilters && (
        <div className="bg-surface-2 border border-border rounded-xl p-4 flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Min. Rating</label>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value)
                applyFilters({ sort, minRating: e.target.value })
              }}
              className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

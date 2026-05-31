import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatDuration(duration: string): string {
  return duration || '0:00'
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`
  return `${Math.floor(seconds / 31536000)}y ago`
}

export function calculateScore(avgRating: number, totalVotes: number, publishedAt: string): number {
  const daysSincePublished = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  const recencyFactor = daysSincePublished < 7 ? 1 : Math.max(0, 1 - daysSincePublished / 365)
  const logVotes = totalVotes > 0 ? Math.log(totalVotes) : 0
  return avgRating * 0.6 + logVotes * 0.3 + recencyFactor * 0.1
}

export function getCurrentPeriod(): { month: string; semester: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const semester = now.getMonth() < 6 ? 'S1' : 'S2'
  return {
    month: `${year}-${month}`,
    semester: `${year}-${semester}`,
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

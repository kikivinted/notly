import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-bold text-white">
              Not<span className="text-accent">ly</span>
            </Link>
            <p className="mt-3 text-sm text-text-secondary">
              Community ratings for YouTube. Discover quality content.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/discover" className="text-sm text-text-secondary hover:text-white transition-colors">Discover</Link></li>
              <li><Link href="/top/monthly" className="text-sm text-text-secondary hover:text-white transition-colors">Monthly Top</Link></li>
              <li><Link href="/top/semester" className="text-sm text-text-secondary hover:text-white transition-colors">Semester Top</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Creators</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-sm text-text-secondary hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/register" className="text-sm text-text-secondary hover:text-white transition-colors">Join Now</Link></li>
              <li><Link href="/creator/dashboard" className="text-sm text-text-secondary hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-text-secondary hover:text-white transition-colors">About</Link></li>
              <li><Link href="/pricing" className="text-sm text-text-secondary hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-secondary">© {new Date().getFullYear()} Notly. All rights reserved.</p>
          <p className="text-xs text-text-secondary">Built for YouTube creators who care about quality.</p>
        </div>
      </div>
    </footer>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'Notly — Rate YouTube Videos',
    template: '%s | Notly',
  },
  description: 'Notly is the platform where YouTube videos are rated by the community. Discover quality content from independent creators.',
  keywords: ['youtube', 'ratings', 'videos', 'creators', 'community'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Notly',
    images: [{ url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@notlyapp',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1A1A1A', color: '#fff', border: '1px solid #2A2A2A' },
            success: { iconTheme: { primary: '#FF4757', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}

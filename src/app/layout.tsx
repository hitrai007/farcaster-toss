import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'A simple coin toss betting game on Base',
  metadataBase: new URL('https://farcaster-toss.vercel.app'),
  openGraph: {
    title: 'Coin Toss Game',
    description: 'A simple coin toss betting game on Base',
    url: 'https://farcaster-toss.vercel.app',
    siteName: 'Coin Toss Game',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coin Toss Game',
    description: 'A simple coin toss betting game on Base',
    images: ['/og-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/api/frame`,
    'fc:frame:button:1': 'Heads',
    'fc:frame:button:2': 'Tails',
    'fc:frame:post_url': `${APP_URL}/api/frame`,
    'fc:frame:image:aspect_ratio': '1.91:1',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content={`${APP_URL}/api/frame`} />
        <meta property="fc:frame:button:1" content="Heads" />
        <meta property="fc:frame:button:2" content="Tails" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

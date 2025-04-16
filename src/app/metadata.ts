import { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'Play a simple coin toss game on Farcaster',
  openGraph: {
    title: 'Coin Toss Game',
    description: 'Play a simple coin toss game on Farcaster',
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:post_url': `${APP_URL}/api/frame`,
    'fc:frame:button:1': 'Heads',
    'fc:frame:button:2': 'Tails',
  },
} 
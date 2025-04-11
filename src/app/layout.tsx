import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
  ],
  openGraph: {
    title: 'Coin Toss Game',
    description: 'Simple Coin Toss Betting Game',
    images: [`${APP_URL}/api/frame`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/api/frame`,
    'fc:frame:button:1': 'Flip Coin',
    'fc:frame:input:text': 'Place your bet (in ETH)',
    'fc:frame:post_url': `${APP_URL}/api/validate`,
    'fc:frame:image:aspect_ratio': '1.91:1',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${APP_URL}/api/frame`} />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content={`${APP_URL}/api/validate`} />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      </head>
      <body>
        <WalletProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </WalletProvider>
      </body>
    </html>
  )
}

import './globals.css'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export const metadata = {
  title: 'Coin Toss Game',
  description: 'Play a simple coin toss game on Farcaster',
  openGraph: {
    title: 'Coin Toss Game',
    description: 'Play a simple coin toss game on Farcaster',
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:post_url': `${APP_URL}/api/frame`,
    'fc:frame:button:1': 'Start Game',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content={`${APP_URL}/api/frame`} />
        <meta property="fc:frame:button:1" content="Start Game" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          <FarcasterProvider>
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
          </FarcasterProvider>
        </WalletProvider>
      </body>
    </html>
  )
}

import './globals.css'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/api/frame`,
  button: {
    title: "Flip Coin",
    action: {
      type: "launch_frame",
      url: `${APP_URL}/api/frame`,
      name: "Coin Toss Game",
      splashImageUrl: `${APP_URL}/coin-toss-frame.png`,
      splashBackgroundColor: "#ffffff"
    }
  }
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'A simple coin toss betting game on Farcaster',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
  ],
  openGraph: {
    title: 'Coin Toss Game',
    description: 'Simple Coin Toss Betting Game',
    images: [`${APP_URL}/api/frame`],
  },
  other: {
    'fc:frame': JSON.stringify(frame),
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

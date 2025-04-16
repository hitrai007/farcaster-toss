import './globals.css'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import { metadata } from './metadata'
import { Inter } from 'next/font/google'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

const inter = Inter({ subsets: ['latin'] })

export { metadata }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content={`${APP_URL}/api/frame`} />
        <meta property="fc:frame:button:1" content="Heads" />
        <meta property="fc:frame:button:2" content="Tails" />
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

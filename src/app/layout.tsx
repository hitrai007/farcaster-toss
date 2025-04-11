import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'icon', url: '/coin-toss-frame.png', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/coin-toss-frame.png' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </WalletProvider>
      </body>
    </html>
  )
}

import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
  icons: {
    icon: '/coin-toss-frame.png',
    shortcut: '/coin-toss-frame.png',
    apple: '/coin-toss-frame.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/coin-toss-frame.png" />
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

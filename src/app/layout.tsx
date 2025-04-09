import type { Metadata } from 'next'
import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
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

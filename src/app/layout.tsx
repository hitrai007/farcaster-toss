import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { Toaster } from 'react-hot-toast'

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

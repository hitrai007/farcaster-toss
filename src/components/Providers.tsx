'use client'

import React from 'react'
import { WalletProvider } from './WalletProvider'
import { FarcasterProvider } from './FarcasterProvider'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <FarcasterProvider>
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      </FarcasterProvider>
    </WalletProvider>
  )
} 
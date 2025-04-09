'use client'

import React from 'react'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia } from 'wagmi/chains'

const projectId = 'c6498ce93c0624d4dd61c1d4d59b846a'

const metadata = {
  name: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
  url: 'https://your-coin-toss-game.app',
  icons: ['https://your-coin-toss-game.app/icon.png']
}

const wagmiConfig = defaultWagmiConfig({
  chains: [baseSepolia],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: false,
})

// Create query client
const queryClient = new QueryClient()

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  featuredWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'], // MetaMask
  includeWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'], // MetaMask
})

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

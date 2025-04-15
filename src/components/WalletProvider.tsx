'use client'

import React from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base } from 'wagmi/chains'
import { farcasterFrame } from '@farcaster/frame-wagmi-connector'

// Export token addresses and bet amounts for use in other components
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
export const USDT_ADDRESS = '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // Base USDT
export const BET_AMOUNT_USD = 0.1 // Bet amounts in USD (0.1 USD)
export const COINGECKO_API = 'https://api.coingecko.com/api/v3'
export const ETH_PRICE_INTERVAL = 30000 // 30 seconds

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || ''

const metadata = {
  name: 'Coin Toss Game',
  description: 'Simple Coin Toss Betting Game',
  url: 'https://farcaster-toss.vercel.app',
  icons: ['https://farcaster-toss.vercel.app/icon.svg']
}

const wagmiConfig = defaultWagmiConfig({
  chains: [base],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: false,
  connectors: [
    farcasterFrame() // Add Farcaster Frame connector
  ]
})

// Create query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ],
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

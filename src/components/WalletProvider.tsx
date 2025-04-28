'use client'

import React, { ReactNode, useEffect } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia } from 'wagmi/chains' // Keep Base Sepolia
import { http } from 'viem'
// import { eip6963, safe } from '@web3modal/wagmi/connectors' // Remove old connectors
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector' // Import Farcaster connector

// Define Base Sepolia chain
const baseSepoliaChain = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
} as const;

// Export token addresses and bet amounts for use in other components
// Allow override of USDC contract address via env for testnets (e.g., Sepolia)
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
export const USDT_ADDRESS = '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // Base USDT
export const BET_AMOUNT_USD = 0.1 // Bet amounts in USD (0.1 USD)
export const COINGECKO_API = 'https://api.coingecko.com/api/v3'
export const ETH_PRICE_INTERVAL = 30000 // 30 seconds

// 1. Get projectId at https://cloud.walletconnect.com
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || '3bae4909230c04c3a0a75e08b69b5ec9' // Example hardcoded project ID
// Only use explicit RPC URL if it's not a placeholder
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL &&
  !process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL.includes('your_api_key_here') ?
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL :
  'https://rpc.sepolia.org'
// Define default transport with custom timeout
const defaultTransport = http(undefined, { timeout: 60000, retryCount: 2 })
// Use SEPOLIA_RPC_URL only if provided
const sepoliaTransport = SEPOLIA_RPC_URL
  ? http(SEPOLIA_RPC_URL, { timeout: 60000, retryCount: 2 })
  : defaultTransport
// Base Sepolia transport
const baseSepoliaTransport = http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.base.org', {
  timeout: 60000,
  retryCount: 2
})

// 2. Create wagmiConfig
const metadata = {
  name: 'Coin Toss Game',
  description: 'A fun coin toss game on Farcaster',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

// Only include Base Sepolia as the chain for the Frame app
const chains = [baseSepoliaChain] as const

const config = defaultWagmiConfig({
  chains,
  projectId: PROJECT_ID,
  metadata,
  transports: {
    // Only define transport for Base Sepolia
    [baseSepoliaChain.id]: baseSepoliaTransport
  },
  // Use only the Farcaster Frame connector
  connectors: [
    miniAppConnector()
  ],
  // These might not be needed or work differently with the Frame connector
  // enableWalletConnect: true,
  // enableInjected: true,
  // enableCoinbase: true,
  ssr: true
})

const queryClient = new QueryClient()

export function WalletProvider({ children }: { children: ReactNode }) {
  console.log('WalletProvider initialized with Project ID:', PROJECT_ID);
  console.log('WalletProvider initialized with chains:', chains.map(chain => `${chain.name} (${chain.id})`));

  // Initialize Web3Modal inside the component to ensure it runs on the client side
  useEffect(() => {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      console.log('Initializing Web3Modal with projectId:', PROJECT_ID);
      try {
        createWeb3Modal({
          wagmiConfig: config,
          projectId: PROJECT_ID,
          enableAnalytics: true,
          themeMode: 'light',
          themeVariables: {
            '--w3m-color-mix': '#4F46E5',
            '--w3m-color-mix-strength': 20,
            '--w3m-accent': '#4F46E5',
            '--w3m-border-radius-master': '12px',
          },
          // No need for featured wallets if using the Frame connector primarily
          // featuredWalletIds: [
          //   'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          //   'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd722aa'  // Coinbase Wallet
          // ]
        });
        console.log('Web3Modal initialized successfully');
      } catch (error) {
        console.error('Error initializing Web3Modal:', error);
      }
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

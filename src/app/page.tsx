'use client';

import { useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { CoinTossGame } from '@/components/CoinTossGame';
import { WalletProvider } from '@/components/WalletProvider';
import { FarcasterProvider } from '@/components/FarcasterProvider';

function HomeContent() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Coin Toss Game</h1>
        <p className="text-xl text-center mb-8">
          A simple coin toss betting game on Base
        </p>
        
        {!isConnected ? (
          <div className="flex justify-center">
            <button
              onClick={() => open()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={() => disconnect()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4"
            >
              Disconnect Wallet
            </button>
            <CoinTossGame />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <FarcasterProvider>
        <main className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
          <div className="container mx-auto px-4 py-8">
            <CoinTossGame />
          </div>
        </main>
      </FarcasterProvider>
    </WalletProvider>
  );
}

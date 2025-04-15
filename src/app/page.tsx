'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import CoinTossGame from '@/components/CoinTossGame';

export default function Home() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Coin Toss Game</h1>
        
        {!isConnected ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">Connect your wallet to start playing</p>
            <button
              onClick={() => open()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <CoinTossGame />
        )}
      </div>
    </main>
  );
}

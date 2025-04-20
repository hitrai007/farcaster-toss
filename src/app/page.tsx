'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import CoinTossGame from '@/components/CoinTossGame';

function HomeContent() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Coin Toss Game</h1>
        <p className="text-xl mb-4">Play a simple coin toss game on Farcaster</p>
      </div>
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
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

export default function Home() {
  return <HomeContent />;
}

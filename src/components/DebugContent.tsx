'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { WalletProvider } from './WalletProvider';

function DebugContentInner() {
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Coin Toss Game Debug</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Wallet Status</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p>Address: {address || 'Not connected'}</p>
            <button 
              onClick={() => {
                console.log('Debug page wallet connect button clicked');
                open();
              }}
              className="mt-2 bg-blue-600 text-white py-2 px-4 rounded"
            >
              {isConnected ? 'Switch Wallet' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Frame Flow Test</h2>
          <div className="flex space-x-4 mb-4">
            <button 
              onClick={() => setChoice('heads')}
              className={`flex-1 py-2 px-4 rounded ${choice === 'heads' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Heads
            </button>
            <button 
              onClick={() => setChoice('tails')}
              className={`flex-1 py-2 px-4 rounded ${choice === 'tails' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Tails
            </button>
          </div>
          <div className="flex justify-center">
            <Link 
              href={`/direct?choice=${choice}&action=placeBet`}
              className="bg-indigo-600 text-white py-2 px-6 rounded"
            >
              Test Direct Route with {choice.charAt(0).toUpperCase() + choice.slice(1)}
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-8">
          <h3 className="font-medium mb-1">Debug Information</h3>
          <p>App URL: {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</p>
          <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}</p>
          <p>Project ID: {process.env.NEXT_PUBLIC_PROJECT_ID || 'Not set'}</p>
          <p>Modal function: {typeof open}</p>
        </div>
      </div>
    </div>
  );
}

export default function DebugContent() {
  // Client-side only code
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <WalletProvider>
      <DebugContentInner />
    </WalletProvider>
  );
} 
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import CoinTossGame from '@/components/CoinTossGame';

// Loading component to display while the page is loading
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">
          Coin Toss Game
        </h1>
        <p className="text-gray-600 mb-6">
          Loading...
        </p>
        <div className="animate-pulse flex justify-center">
          <div className="h-12 w-32 bg-indigo-300 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

// Main page content
function DirectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [hasTriedToConnect, setHasTriedToConnect] = useState(false);
  
  const choice = searchParams.get('choice');
  const action = searchParams.get('action');

  // Debug log
  useEffect(() => {
    console.log('Direct page loaded with params:', { 
      choice, 
      action,
      isConnected,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });
  }, [choice, action, isConnected]);

  // Automatically try to connect wallet when page loads
  useEffect(() => {
    if (!isConnected && !hasTriedToConnect) {
      setHasTriedToConnect(true);
      console.log('Attempting to open wallet connection modal');
      // Small delay to ensure the modal works properly
      setTimeout(() => {
        open();
      }, 500);
    }
  }, [isConnected, open, hasTriedToConnect]);

  // Redirect to home page if connected or no valid parameters
  useEffect(() => {
    if (!choice || !action) {
      router.push('/');
    }
  }, [choice, action, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">
          Coin Toss Game
        </h1>
        
        {!isConnected ? (
          <div className="space-y-4 text-center">
            <p className="text-gray-600 mb-6">
              Connect your wallet to place your bet on {choice}
            </p>
            <button
              onClick={() => open()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <p className="text-green-600 font-medium text-center mb-8">
              Wallet connected! You can now place your bet on {choice}.
            </p>
            <CoinTossGame initialChoice={choice as 'heads' | 'tails'} />
          </>
        )}
      </div>
    </div>
  );
}

// Export the main component with Suspense
export default function DirectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DirectPageContent />
    </Suspense>
  );
} 
'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
// Remove unused imports if TestWalletContent is defined elsewhere
// import { useAccount } from 'wagmi';
// import { useWeb3Modal } from '@web3modal/wagmi/react';
// import { WalletProvider } from '@/components/WalletProvider';

// Create a loading component
function LoadingWallet() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Wallet Connection Test</h1>
      <p>Loading wallet connection...</p>
    </div>
  );
}

// Dynamically import the TestWalletContent component with ssr disabled
const TestWalletWithNoSSR = dynamicImport(
  () => import('@/components/TestWalletContent'), // Assuming TestWalletContent is now in its own file
  { ssr: false }
);

// Remove the local definition if it's imported
/*
function TestWalletContent() {
  const { isConnected, address } = useAccount();
  const { open } = useWeb3Modal();

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Wallet Connection Test</h1>
      
      <div className="mb-4">
        <p><strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Not Connected'}</p>
        {isConnected && <p><strong>Address:</strong> {address}</p>}
      </div>
      
      <button
        onClick={() => {
          console.log('Open wallet modal button clicked');
          open();
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Open Wallet Modal
      </button>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Debugging Info:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({
            isConnected,
            address,
            modalFn: typeof open
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
*/

export default function TestWalletPage() {
  return (
    <Suspense fallback={<LoadingWallet />}>
      <TestWalletWithNoSSR />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic'; 
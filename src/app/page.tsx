'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

// Create a loading component
function LoadingContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Coin Toss Game</h1>
        <p className="text-xl text-center mb-8">
          A simple coin toss betting game on Base
        </p>
        <div className="text-center">Loading...</div>
      </div>
      </div>
  );
}

// Dynamically import the content component with ssr disabled
const HomeContentNoSSR = dynamicImport(
  () => import('@/components/HomeContent'),
  { ssr: false }
  );

export default function Home() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <HomeContentNoSSR />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';

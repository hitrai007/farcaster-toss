'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

// Loading component
function LoadingDebug() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Coin Toss Game Debug</h1>
        <p>Loading debug interface...</p>
      </div>
    </div>
  );
}

// Dynamically import the debug content with SSR disabled
const DebugContentNoSSR = dynamicImport(
  () => import('@/components/DebugContent'),
  { ssr: false }
);

export default function DebugPage() {
  return (
    <Suspense fallback={<LoadingDebug />}>
      <DebugContentNoSSR />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic'; 
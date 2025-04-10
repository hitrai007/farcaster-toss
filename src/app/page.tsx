import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'A simple coin toss betting game on Farcaster',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Coin Toss Game',
    description: 'A simple coin toss betting game on Farcaster',
    images: ['/api/frame'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/api/frame`,
    'fc:frame:button:1': 'Flip Coin',
    'fc:frame:input:text': 'Place your bet (in ETH)',
    'fc:frame:post_url': `${APP_URL}/api/frame`,
    'fc:frame:image:aspect_ratio': '1.91:1',
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Coin Toss Game</h1>
        <p className="text-xl mb-8">A simple coin toss betting game on Farcaster</p>
        <p className="text-lg">
          Share this URL on Farcaster to play: {APP_URL}
        </p>
      </div>
    </main>
  );
}

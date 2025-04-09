import CoinTossGame from '@/components/CoinTossGame';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coin Toss Game',
  description: 'A simple coin toss betting game on Farcaster',
  openGraph: {
    title: 'Coin Toss Game',
    description: 'A simple coin toss betting game on Farcaster',
    images: ['https://farcaster-toss.vercel.app/api/image'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://farcaster-toss.vercel.app/api/image',
    'fc:frame:post_url': 'https://farcaster-toss.vercel.app/api/flip',
    'fc:frame:button:1': 'Flip Coin',
    'fc:frame:input:text': 'Place your bet (in ETH)',
  },
};

export default function Home() {
  return <CoinTossGame />;
}

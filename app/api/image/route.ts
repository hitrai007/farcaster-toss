import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    React.createElement('div', {
      style: {
        display: 'flex',
        background: '#1a1a1a',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
      children: [
        React.createElement('h1', {
          style: {
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
          },
          children: 'Coin Toss Game',
        }),
        React.createElement('p', {
          style: {
            color: '#ffffff',
            fontSize: '36px',
            textAlign: 'center',
            marginBottom: '20px',
          },
          children: 'Place your bet and flip the coin!',
        }),
        React.createElement('p', {
          style: {
            color: '#ffffff',
            fontSize: '48px',
            textAlign: 'center',
          },
          children: 'Waiting for your bet...',
        }),
      ],
    }),
    {
      width: 1200,
      height: 630,
    }
  );
} 
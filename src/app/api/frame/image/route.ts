import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    React.createElement('div', {
      style: {
        display: 'flex',
        background: '#f6f6f6',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
      children: React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        },
        children: [
          React.createElement('h1', {
            style: {
              fontSize: '60px',
              background: 'linear-gradient(to right, #000000, #434343)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem',
            },
            children: 'Coin Toss Game',
          }),
          React.createElement('p', {
            style: {
              fontSize: '30px',
              color: '#666',
              textAlign: 'center',
            },
            children: 'Place your bet and flip the coin!',
          }),
        ],
      }),
    }),
    {
      width: 1200,
      height: 630,
    }
  );
} 
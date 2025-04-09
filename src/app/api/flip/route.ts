import { NextResponse } from 'next/server';
import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

async function createImageResponse(text: string, betAmount: string = '0') {
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
            children: text,
          }),
          React.createElement('p', {
            style: {
              fontSize: '30px',
              color: '#666',
              textAlign: 'center',
            },
            children: `Bet Amount: ${betAmount} ETH`,
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

export async function GET() {
  const imageResponse = await createImageResponse('Ready to Play');
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  return NextResponse.json({
    image: `data:image/png;base64,${base64Image}`,
    buttons: [
      {
        label: 'Flip Coin',
        action: 'post',
      },
    ],
    input: {
      text: 'Place your bet (in ETH)',
    },
  });
}

export async function POST(request: Request) {
  const { betAmount } = await request.json();
  
  // Validate bet amount
  if (!betAmount || isNaN(parseFloat(betAmount)) || parseFloat(betAmount) <= 0) {
    return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
  }

  // Simulate coin flip
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  const imageResponse = await createImageResponse(result, betAmount);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  return NextResponse.json({
    image: `data:image/png;base64,${base64Image}`,
    buttons: [
      {
        label: 'Play Again',
        action: 'post',
      },
    ],
    input: {
      text: 'Place your bet (in ETH)',
    },
  });
} 
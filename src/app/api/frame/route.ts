import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

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

export async function GET(req: NextRequest) {
  // Check if this is a request for the image
  const searchParams = req.nextUrl.searchParams;
  const isImage = searchParams.get('type') === 'image';

  if (isImage) {
    const imageResponse = await createImageResponse('Ready to Play');
    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Return frame HTML response
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${APP_URL}/api/frame?type=image" />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <title>Coin Toss Game</title>
      </head>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { untrustedData } = body;
    const { inputText } = untrustedData;
    
    const betAmount = inputText || '0';
    if (isNaN(parseFloat(betAmount)) || parseFloat(betAmount) <= 0) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame?type=image" />
            <meta property="fc:frame:button:1" content="Try Again" />
            <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <title>Invalid Bet Amount</title>
          </head>
        </html>`,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const imageResponse = await createImageResponse(result, betAmount);
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${APP_URL}/api/frame?type=image&result=${result}&bet=${betAmount}" />
          <meta property="fc:frame:button:1" content="Play Again" />
          <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
          <title>Coin Toss Result</title>
        </head>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Frame processing error:', error);
    return new NextResponse('Failed to process frame', { status: 500 });
  }
} 
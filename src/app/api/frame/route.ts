import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(req: NextRequest) {
  const imageResponse = await createImageResponse('Ready to Play');
  
  // If the request is for the image (has ?image=true query param)
  if (req.nextUrl.searchParams.get('image') === 'true') {
    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Otherwise, return the frame metadata
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="data:image/png;base64,${base64Image}" />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
        <meta property="fc:frame:state" content="initial" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="og:image" content="data:image/png;base64,${base64Image}" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="A simple coin toss betting game on Farcaster" />
      </head>
      <body>
        <img src="data:image/png;base64,${base64Image}" />
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { untrustedData } = body;
    const { inputText } = untrustedData;
    
    const betAmount = inputText || '0';
    if (isNaN(parseFloat(betAmount)) || parseFloat(betAmount) <= 0) {
      return new NextResponse('Invalid bet amount', { status: 400 });
    }

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const imageResponse = await createImageResponse(result, betAmount);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="data:image/png;base64,${base64Image}" />
          <meta property="fc:frame:button:1" content="Play Again" />
          <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
          <meta property="fc:frame:state" content="result" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="og:image" content="data:image/png;base64,${base64Image}" />
          <meta property="og:title" content="Coin Toss Game" />
          <meta property="og:description" content="A simple coin toss betting game on Farcaster" />
        </head>
        <body>
          <img src="data:image/png;base64,${base64Image}" />
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Frame processing error:', error);
    return new NextResponse('Failed to process frame', { status: 500 });
  }
} 
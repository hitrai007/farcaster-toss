import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

const headers = {
  'Content-Type': 'text/html',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function createImageResponse(text: string, betAmount: string = '0') {
  try {
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
  } catch (error) {
    console.error('Error creating image response:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const result = url.searchParams.get('result');

    // If type is image, return the image response
    if (type === 'image') {
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
            padding: '40px',
          },
          children: [
            React.createElement('h1', {
              style: {
                fontSize: 60,
                marginBottom: 20,
              },
              children: result ? `Result: ${result}` : '🎲 Coin Toss Game',
            }),
            React.createElement('p', {
              style: {
                fontSize: 30,
              },
              children: 'Place your bet!',
            }),
          ],
        }),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Otherwise, return the frame HTML
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${APP_URL}/api/frame?type=image" />
          <meta property="fc:frame:button:1" content="Heads" />
          <meta property="fc:frame:button:2" content="Tails" />
          <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
          <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
          <title>Coin Toss Game</title>
        </head>
        <body>
          <h1>Coin Toss Game</h1>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (e) {
    console.error('Error in GET route:', e);
    return new NextResponse('Failed to process request', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { untrustedData } = body;
    const { inputText, buttonIndex } = untrustedData;
    
    const choice = buttonIndex === 1 ? 'Heads' : 'Tails';
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const won = choice === result;
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${APP_URL}/api/frame?type=image&result=${result}" />
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

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, { headers });
} 
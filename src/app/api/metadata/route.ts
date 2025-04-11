import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

export async function GET(req: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Coin Toss Game</title>
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="A simple coin toss betting game on Farcaster" />
        <meta property="og:image" content="${APP_URL}/api/frame" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${APP_URL}/api/frame" />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
        <meta property="fc:frame:state" content="initial" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      </head>
      <body>
        <h1>Coin Toss Game</h1>
        <p>A simple coin toss betting game on Farcaster</p>
      </body>
    </html>
  `.trim();

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 
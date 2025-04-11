import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
        <meta property="fc:frame:state" content="initial" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="og:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="A simple coin toss betting game on Farcaster" />
      </head>
      <body>
        <h1>Coin Toss Game</h1>
        <p>A simple coin toss betting game on Farcaster</p>
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
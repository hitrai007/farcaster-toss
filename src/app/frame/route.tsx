import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
      <meta property="fc:frame:button:1" content="Start Game" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
    </head></html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  )
} 
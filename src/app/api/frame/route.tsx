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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { untrustedData } = body

  if (!untrustedData) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const { buttonIndex } = untrustedData

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
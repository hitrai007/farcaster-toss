import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image" />
      <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
      <meta property="fc:frame:button:1" content="Heads" />
      <meta property="fc:frame:button:2" content="Tails" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
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
  const result = Math.random() < 0.5 ? 'heads' : 'tails'
  const isWinner = (buttonIndex === 1 && result === 'heads') || (buttonIndex === 2 && result === 'tails')

  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?result=${result}&winner=${isWinner}" />
      <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
      <meta property="fc:frame:button:1" content="Play Again" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    </head></html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  )
} 
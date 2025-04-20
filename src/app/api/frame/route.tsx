import { NextRequest, NextResponse } from 'next/server'

// Game state management
let gameState = {
  player1: null,
  player2: null,
  player1Choice: null,
  player2Choice: null,
  betAmount: 0.1,
  status: 'waiting', // waiting, betting, complete
  winner: null,
  timer: null
}

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

  const { buttonIndex, fid } = untrustedData

  // Handle game states
  if (gameState.status === 'waiting') {
    // First player choosing heads/tails
    if (!gameState.player1) {
      gameState.player1 = fid
      gameState.player1Choice = buttonIndex === 1 ? 'heads' : 'tails'
      gameState.status = 'betting'
      
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=betting&player=1" />
          <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
          <meta property="fc:frame:button:1" content="Connect Wallet" />
          <meta property="fc:frame:button:2" content="Place Bet" />
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
  } else if (gameState.status === 'betting') {
    if (fid === gameState.player1 && !gameState.player2) {
      // Player 1 placing bet
      if (buttonIndex === 1) {
        // Connect wallet
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=connect" />
            <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
            <meta property="fc:frame:button:1" content="Place Bet" />
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
      } else if (buttonIndex === 2) {
        // Place bet
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=bet&amount=0.1" />
            <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
            <meta property="fc:frame:button:1" content="USDC" />
            <meta property="fc:frame:button:2" content="ETH" />
            <meta property="fc:frame:button:3" content="USDT" />
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
    } else if (fid !== gameState.player1 && !gameState.player2) {
      // Player 2 joining
      gameState.player2 = fid
      gameState.player2Choice = buttonIndex === 1 ? 'heads' : 'tails'
      
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=betting&player=2" />
          <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
          <meta property="fc:frame:button:1" content="Connect Wallet" />
          <meta property="fc:frame:button:2" content="Place Bet" />
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
  } else if (gameState.status === 'complete') {
    // Reset game after 5 seconds
    if (buttonIndex === 1) {
      gameState = {
        player1: null,
        player2: null,
        player1Choice: null,
        player2Choice: null,
        betAmount: 0.1,
        status: 'waiting',
        winner: null,
        timer: null
      }
      
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=waiting" />
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
  }

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
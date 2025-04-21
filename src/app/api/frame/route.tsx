import { NextRequest, NextResponse } from 'next/server'

// Game state management
let gameState = {
  player1: null,
  player2: null,
  player1Choice: null,
  player2Choice: null,
  betAmount: 0.1,
  status: 'initial', // initial, betting, token, confirm, complete
  winner: null,
  timer: null,
  player1Wallet: null,
  player2Wallet: null,
  selectedToken: null,
  tokenAmount: null
}

// Helper function to get token amount in USD
async function getTokenAmount(token: string, amountUSD: number) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`)
    const data = await response.json()
    const price = data[token].usd
    return (amountUSD / price).toFixed(6)
  } catch (error) {
    console.error('Error fetching token price:', error)
    return '0.000000'
  }
}

export async function GET(req: NextRequest) {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=initial" />
      <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
      <meta property="fc:frame:button:1" content="Bet on Heads" />
      <meta property="fc:frame:button:2" content="Bet on Tails" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Bet on heads or tails and win!" />
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
  if (gameState.status === 'initial') {
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
          <meta property="og:description" content="Connect wallet to place your bet" />
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
        gameState.player1Wallet = 'connected'
        gameState.status = 'token'
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=bet&amount=0.1" />
            <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
            <meta property="fc:frame:button:1" content="USDC" />
            <meta property="fc:frame:button:2" content="ETH" />
            <meta property="fc:frame:button:3" content="USDT" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Choose your token to bet with" />
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
  } else if (gameState.status === 'token') {
    if (fid === gameState.player1) {
      // Player 1 selecting token
      gameState.selectedToken = buttonIndex === 1 ? 'usdc' : buttonIndex === 2 ? 'ethereum' : 'tether'
      gameState.status = 'confirm'
      const tokenAmount = await getTokenAmount(gameState.selectedToken, gameState.betAmount)
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=confirm&amount=0.1" />
          <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
          <meta property="fc:frame:button:1" content="Confirm Bet" />
          <meta property="fc:frame:button:2" content="Cancel" />
          <meta property="og:title" content="Coin Toss Game" />
          <meta property="og:description" content="Confirm your bet" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        </head></html>`,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
  } else if (gameState.status === 'confirm') {
    if (fid === gameState.player1) {
      // Player 1 confirming bet
      gameState.status = 'complete'
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=complete&winner=${gameState.winner}" />
          <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
          <meta property="fc:frame:button:1" content="Play Again" />
          <meta property="fc:frame:button:2" content="Return to Wallet" />
          <meta property="og:title" content="Coin Toss Game" />
          <meta property="og:description" content="Game complete. You ${gameState.winner === 'heads' ? 'won' : 'lost'}!" />
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
        status: 'initial',
        winner: null,
        timer: null,
        player1Wallet: null,
        player2Wallet: null,
        selectedToken: null,
        tokenAmount: null
      }
      
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://farcaster-toss.vercel.app/api/frame/image?state=initial" />
          <meta property="fc:frame:post_url" content="https://farcaster-toss.vercel.app/api/frame" />
          <meta property="fc:frame:button:1" content="Bet on Heads" />
          <meta property="fc:frame:button:2" content="Bet on Tails" />
          <meta property="og:title" content="Coin Toss Game" />
          <meta property="og:description" content="Bet on heads or tails and win!" />
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
import { NextRequest, NextResponse } from 'next/server'

// Game state management
type Choice = 'heads' | 'tails' | null;
type Status = 'initial' | 'wallet' | 'token' | 'confirm' | 'complete';

let gameState = {
  player1: null as string | null,
  player2: null as string | null,
  player1Choice: null as Choice,
  player2Choice: null as Choice,
  betAmount: 0.1,
  status: 'initial' as Status,
  winner: null as string | null,
  timer: null,
  player1Wallet: null as string | null,
  player2Wallet: null as string | null,
  selectedToken: null as string | null,
  tokenAmount: null as string | null
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

const headers = {
  'Content-Type': 'text/html',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

const handleError = (error: string) => {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=error" />
      <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
      <meta property="fc:frame:button:1" content="Try Again" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="An error occurred. Please try again." />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    </head></html>`,
    { headers }
  )
}

export async function GET(req: NextRequest) {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=initial" />
      <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
      <meta property="fc:frame:button:1" content="Connect Wallet" />
      <meta property="fc:frame:button:2" content="About" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Bet on heads or tails and win!" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    </head></html>`,
    { headers }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { untrustedData } = body
    
    if (!untrustedData) {
      return handleError('Invalid request')
    }

    const { buttonIndex, fid } = untrustedData

    // Handle game states
    if (gameState.status === 'initial') {
      if (buttonIndex === 1) {
        // User clicked "Connect Wallet"
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=wallet" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Heads" />
            <meta property="fc:frame:button:2" content="Tails" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Choose Heads or Tails to place your bet" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      } else {
        // User clicked "About"
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=about" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Back" />
            <meta property="og:title" content="About Coin Toss Game" />
            <meta property="og:description" content="A fun betting game on Base" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    } else if (gameState.status === 'wallet') {
      // User has selected their choice (Heads/Tails)
      gameState.player1 = fid
      gameState.player1Choice = buttonIndex === 1 ? 'heads' : 'tails'
      gameState.status = 'token'
      
      return new NextResponse(
        `<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=token&amount=0.1" />
          <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
          <meta property="fc:frame:button:1" content="Confirm Bet" />
          <meta property="fc:frame:button:2" content="Cancel" />
          <meta property="og:title" content="Coin Toss Game" />
          <meta property="og:description" content="Confirm your bet of 0.1 USDC" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${APP_URL}" />
        </head></html>`,
        { headers }
      )
    } else if (gameState.status === 'token') {
      if (fid === gameState.player1) {
        // Player 1 selecting token
        gameState.selectedToken = buttonIndex === 1 ? 'usdc' : buttonIndex === 2 ? 'ethereum' : 'tether'
        gameState.status = 'confirm'
        const tokenAmount = await getTokenAmount(gameState.selectedToken, gameState.betAmount)
        gameState.tokenAmount = tokenAmount
        
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=confirm&amount=0.1&token=${gameState.selectedToken}" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Confirm Bet" />
            <meta property="fc:frame:button:2" content="Cancel" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Confirm your bet of $0.1" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    } else if (gameState.status === 'confirm') {
      if (fid === gameState.player1) {
        // Player 1 confirming bet
        gameState.status = 'complete'
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=complete&winner=${gameState.winner}" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Play Again" />
            <meta property="fc:frame:button:2" content="Return to Wallet" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Game complete. You ${gameState.winner === 'heads' ? 'won' : 'lost'}!" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
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
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=initial" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Bet on Heads" />
            <meta property="fc:frame:button:2" content="Bet on Tails" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Bet on heads or tails and win!" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    }

    return new NextResponse(
      `<!DOCTYPE html><html><head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${APP_URL}/api/frame/image" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
        <meta property="fc:frame:button:1" content="Heads" />
        <meta property="fc:frame:button:2" content="Tails" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      </head></html>`,
      { headers }
    )
  } catch (error) {
    console.error('Error in frame route:', error)
    return handleError('Internal server error')
  }
} 
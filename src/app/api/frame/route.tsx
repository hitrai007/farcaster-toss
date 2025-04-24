import { NextRequest, NextResponse } from 'next/server'

// Game state management
type Choice = 'heads' | 'tails' | null;
type Status = 'initial' | 'betting' | 'confirm' | 'error';

// Base Sepolia Mock USDC address
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x8267cF9254734C85044632146B8B674470A97Eb3';
const COIN_TOSS_GAME_ADDRESS = process.env.NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS || '0x8267cF9254734C85044632146B8B674470A97Eb3';

let gameState = {
  player1: null as string | null,
  player1Choice: null as Choice,
  betAmount: 0.1,
  status: 'initial' as Status,
  chainId: 84532, // Base Sepolia
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
      if (buttonIndex === 1) { // User clicked "Heads"
        gameState.player1 = fid
        gameState.player1Choice = 'heads'
        gameState.status = 'betting'
        
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=betting&choice=heads" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Connect Wallet" />
            <meta property="fc:frame:button:2" content="Cancel" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Connect wallet to bet on Heads" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      } else if (buttonIndex === 2) { // User clicked "Tails"
        gameState.player1 = fid
        gameState.player1Choice = 'tails'
        gameState.status = 'betting'
        
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=betting&choice=tails" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Connect Wallet" />
            <meta property="fc:frame:button:2" content="Cancel" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Connect wallet to bet on Tails" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    } else if (gameState.status === 'betting') {
      if (buttonIndex === 1) { // User clicked "Connect Wallet"
        gameState.status = 'confirm'
        
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=confirm&choice=${gameState.player1Choice}" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Approve USDC" />
            <meta property="fc:frame:button:2" content="Cancel" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Approve USDC to place bet" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      } else if (buttonIndex === 2) { // User clicked "Cancel"
        // Reset game state
        gameState = {
          player1: null,
          player1Choice: null,
          betAmount: 0.1,
          status: 'initial',
          chainId: 84532,
        }
        
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=initial" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Heads" />
            <meta property="fc:frame:button:2" content="Tails" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="Choose Heads or Tails to bet" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    } else if (gameState.status === 'confirm') {
      if (buttonIndex === 1) { // User clicked "Approve USDC"
        // Here we would handle the USDC approval
        // For now, just show success state
        return new NextResponse(
          `<!DOCTYPE html><html><head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=success&choice=${gameState.player1Choice}" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
            <meta property="fc:frame:button:1" content="Place Bet" />
            <meta property="fc:frame:button:2" content="Cancel" />
            <meta property="og:title" content="Coin Toss Game" />
            <meta property="og:description" content="USDC approved, ready to bet!" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          </head></html>`,
          { headers }
        )
      }
    }

    // Default response (initial state)
    return new NextResponse(
      `<!DOCTYPE html><html><head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${APP_URL}/api/frame/image?state=initial" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
        <meta property="fc:frame:button:1" content="Heads" />
        <meta property="fc:frame:button:2" content="Tails" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Choose Heads or Tails to bet" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      </head></html>`,
      { headers }
    )
  } catch (error) {
    console.error('Error in frame route:', error)
    return handleError('Internal server error')
  }
} 
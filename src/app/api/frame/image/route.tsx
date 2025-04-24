import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const headers = {
  'Content-Type': 'image/png',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get('state')
    const amount = searchParams.get('amount')

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1200px',
            height: '630px',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: '48px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          {state === 'initial' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                🪙
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Welcome to Coin Toss Game
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Connect your wallet to start playing
              </div>
            </div>
          )}
          
          {state === 'wallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                🎲
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Choose Your Side
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Heads or Tails?
              </div>
            </div>
          )}
          
          {state === 'token' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                💰
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Ready to Place Your Bet
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Bet Amount: {amount} USDC
              </div>
            </div>
          )}

          {state === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                ℹ️
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                About Coin Toss Game
              </div>
              <div style={{ fontSize: '24px', width: '100%', maxWidth: '800px', lineHeight: '1.4' }}>
                A decentralized betting game on Base. Bet 0.1 USDC on heads or tails and double your money!
              </div>
            </div>
          )}

          {state === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                ❌
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                An Error Occurred
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Please try again
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: await fetch(
              new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2')
            ).then((res) => res.arrayBuffer()),
            weight: 400,
            style: 'normal',
          },
        ],
      }
    )
  } catch (error) {
    console.error('Error generating frame image:', error)
    return new Response('Error generating image', { 
      status: 500,
      headers
    })
  }
} 
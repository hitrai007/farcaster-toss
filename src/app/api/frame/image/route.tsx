import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const headers = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=3600',
  'Pragma': 'public'
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get('state')
    const choice = searchParams.get('choice')

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
            backgroundColor: '#111827',
            color: '#fff',
            fontSize: '40px',
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'Inter'
          }}
        >
          {state === 'initial' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                🪙
              </div>
              <div style={{ marginBottom: '20px' }}>
                Choose Your Side
              </div>
              <div style={{ fontSize: '24px' }}>
                Heads or Tails?
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF', marginTop: '10px' }}>
                On Base Sepolia Testnet
              </div>
            </div>
          )}
          
          {state === 'betting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                {choice === 'heads' ? '👑' : '🔄'}
              </div>
              <div style={{ marginBottom: '20px' }}>
                You chose {choice?.toUpperCase()}
              </div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                Connect wallet to bet 0.1 USDC
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
                On Base Sepolia Testnet
              </div>
            </div>
          )}
          
          {state === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                💫
              </div>
              <div style={{ marginBottom: '20px' }}>
                Approve USDC to Place Bet
              </div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                0.1 USDC on {choice?.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
                On Base Sepolia Testnet
              </div>
            </div>
          )}
          
          {state === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                ✅
              </div>
              <div style={{ marginBottom: '20px' }}>
                USDC Approved!
              </div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                Ready to place your bet on {choice?.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
                Click to finalize bet
              </div>
            </div>
          )}

          {state === 'placing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                🎲
              </div>
              <div style={{ marginBottom: '20px' }}>
                Placing Your Bet...
              </div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                0.1 USDC on {choice?.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
                Click to view on web app
              </div>
            </div>
          )}

          {state === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                ❌
              </div>
              <div style={{ marginBottom: '20px' }}>
                An Error Occurred
              </div>
              <div style={{ fontSize: '24px' }}>
                Please try again
              </div>
            </div>
          )}
          
          {!state && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                🪙
              </div>
              <div style={{ marginBottom: '20px' }}>
                Coin Toss Game
              </div>
              <div style={{ fontSize: '24px' }}>
                Bet on Heads or Tails
              </div>
              <div style={{ fontSize: '18px', color: '#9CA3AF', marginTop: '10px' }}>
                On Base Sepolia Testnet
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
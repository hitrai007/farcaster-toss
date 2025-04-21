import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const headers = {
  'Content-Type': 'image/png',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get('state')
    const player = searchParams.get('player')
    const amount = searchParams.get('amount')
    const token = searchParams.get('token')

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
                Bet on Heads or Tails
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Click a button to start
              </div>
            </div>
          )}
          
          {state === 'wallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                🔗
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Connect Your Wallet
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Bet Amount: ${amount}
              </div>
            </div>
          )}
          
          {state === 'token' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                💰
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Choose Your Token
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Bet Amount: ${amount}
              </div>
            </div>
          )}
          
          {state === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                ✅
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Confirm Your Bet
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                Amount: ${amount} in {token?.toUpperCase()}
              </div>
            </div>
          )}
          
          {state === 'complete' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px', width: '100px', height: '100px' }}>
                🎉
              </div>
              <div style={{ marginBottom: '20px', width: '100%' }}>
                Game Complete!
              </div>
              <div style={{ fontSize: '24px', width: '100%' }}>
                New game starts in 5s
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
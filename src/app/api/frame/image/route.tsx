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
            <>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                🪙
              </div>
              <div style={{ marginBottom: '20px' }}>
                Bet on Heads or Tails
              </div>
              <div style={{ fontSize: '24px' }}>
                Click a button to start
              </div>
            </>
          )}
          
          {state === 'betting' && (
            <>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                💰
              </div>
              <div style={{ marginBottom: '20px' }}>
                Player {player} - Place Your Bet
              </div>
              <div style={{ fontSize: '24px' }}>
                Connect wallet and bet $0.1
              </div>
            </>
          )}
          
          {state === 'bet' && (
            <>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                💵
              </div>
              <div style={{ marginBottom: '20px' }}>
                Choose Token to Bet With
              </div>
              <div style={{ fontSize: '24px' }}>
                Amount: ${amount}
              </div>
            </>
          )}
          
          {state === 'confirm' && (
            <>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                ✅
              </div>
              <div style={{ marginBottom: '20px' }}>
                Confirm Your Bet
              </div>
              <div style={{ fontSize: '24px' }}>
                Amount: ${amount}
              </div>
            </>
          )}
          
          {state === 'complete' && (
            <>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>
                🎉
              </div>
              <div style={{ marginBottom: '20px' }}>
                Game Complete!
              </div>
              <div style={{ fontSize: '24px' }}>
                New game starts in 5s
              </div>
            </>
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
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
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
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: 48,
          padding: 20,
        }}
      >
        {state === 'waiting' && (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              🪙
            </div>
            <div style={{ marginBottom: 20 }}>
              Choose Heads or Tails
            </div>
            <div style={{ fontSize: 24 }}>
              Click a button to play
            </div>
          </>
        )}
        
        {state === 'betting' && (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              💰
            </div>
            <div style={{ marginBottom: 20 }}>
              Player {player} - Place Your Bet
            </div>
            <div style={{ fontSize: 24 }}>
              Connect wallet and bet $0.1
            </div>
          </>
        )}
        
        {state === 'connect' && (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              🔗
            </div>
            <div style={{ marginBottom: 20 }}>
              Connect Your Wallet
            </div>
            <div style={{ fontSize: 24 }}>
              Click to connect and place bet
            </div>
          </>
        )}
        
        {state === 'bet' && (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              💵
            </div>
            <div style={{ marginBottom: 20 }}>
              Place Bet: ${amount}
            </div>
            <div style={{ fontSize: 24 }}>
              Choose token to bet with
            </div>
          </>
        )}
        
        {state === 'complete' && (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              🎉
            </div>
            <div style={{ marginBottom: 20 }}>
              Game Complete!
            </div>
            <div style={{ fontSize: 24 }}>
              New game starts in 5s
            </div>
          </>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
} 
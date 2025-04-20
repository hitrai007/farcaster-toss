import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const result = searchParams.get('result')
  const winner = searchParams.get('winner')

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
        {result ? (
          <>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              {result === 'heads' ? '🪙' : '🪙'}
            </div>
            <div style={{ marginBottom: 20 }}>
              {winner ? 'You won! 🎉' : 'You lost! 😢'}
            </div>
            <div style={{ fontSize: 24 }}>
              Click "Play Again" to try again
            </div>
          </>
        ) : (
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
} 
import { NextResponse } from 'next/server'
import { ImageResponse } from '@vercel/og'
import React from 'react'

export const runtime = 'edge'

// Helper function to create the image response
async function createImageResponse(result: string, bet: string, win: boolean) {
  return new ImageResponse(
    React.createElement('div', {
      style: {
        display: 'flex',
        background: '#1a1a1a',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
      children: [
        React.createElement('h1', {
          style: {
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
          },
          children: 'Coin Toss Result',
        }),
        React.createElement('h2', {
          style: {
            color: '#ffffff',
            fontSize: '48px',
            textAlign: 'center',
            marginBottom: '20px',
          },
          children: `Result: ${result}`,
        }),
        React.createElement('h2', {
          style: {
            color: '#ffffff',
            fontSize: '48px',
            textAlign: 'center',
            marginBottom: '20px',
          },
          children: `Bet: ${bet} ETH`,
        }),
        React.createElement('h2', {
          style: {
            color: win ? '#4CAF50' : '#F44336',
            fontSize: '48px',
            textAlign: 'center',
          },
          children: `You ${win ? 'Won!' : 'Lost!'}`,
        }),
      ],
    }),
    {
      width: 1200,
      height: 630,
    }
  )
}

// GET handler for initial frame state
export async function GET() {
  try {
    const imageResponse = await createImageResponse('Ready to Play', '0', false)
    
    // Return the image directly
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// POST handler for frame interactions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { untrustedData } = body
    const betAmount = untrustedData?.inputText || '0'

    // Validate bet amount
    const bet = parseFloat(betAmount)
    if (isNaN(bet) || bet <= 0) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid bet amount'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Simulate coin flip (50/50 chance)
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails'
    const win = result === 'Heads' // For simplicity, heads always wins

    // Create result image
    const imageResponse = await createImageResponse(result, betAmount, win)
    
    // Return the image directly
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 
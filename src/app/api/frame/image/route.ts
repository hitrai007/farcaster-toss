import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const state = searchParams.get('state') || 'start'

  // Create a simple SVG image
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#ffffff"/>
      <text x="600" y="200" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="#000000">
        ${state === 'start' ? 'Welcome to Coin Toss!' : 
          state === 'heads' ? 'You chose Heads!' : 
          'You chose Tails!'}
      </text>
      <text x="600" y="300" font-family="Arial" font-size="36" text-anchor="middle" fill="#000000">
        ${state === 'start' ? 'Choose Heads or Tails' : 'Waiting for opponent...'}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
    },
  })
} 
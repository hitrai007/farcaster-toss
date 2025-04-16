import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from 'canvas'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const state = searchParams.get('state') || 'start'

  // Create canvas
  const canvas = createCanvas(1200, 630)
  const ctx = canvas.getContext('2d')

  // Set background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1200, 630)

  // Add text based on state
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  
  if (state === 'start') {
    ctx.fillText('Welcome to Coin Toss!', 600, 200)
    ctx.font = '36px Arial'
    ctx.fillText('Choose Heads or Tails', 600, 300)
  } else if (state === 'heads') {
    ctx.fillText('You chose Heads!', 600, 200)
    ctx.font = '36px Arial'
    ctx.fillText('Waiting for opponent...', 600, 300)
  } else if (state === 'tails') {
    ctx.fillText('You chose Tails!', 600, 200)
    ctx.font = '36px Arial'
    ctx.fillText('Waiting for opponent...', 600, 300)
  }

  // Convert to PNG
  const buffer = canvas.toBuffer('image/png')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
} 
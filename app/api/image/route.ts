import { NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'

export async function GET() {
  try {
    // Create a canvas
    const canvas = createCanvas(1200, 630)
    const ctx = canvas.getContext('2d')

    // Set background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 1200, 630)

    // Add title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 72px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Coin Toss Game', 600, 200)

    // Add instructions
    ctx.font = '36px Arial'
    ctx.fillText('Place your bet and flip the coin!', 600, 300)

    // Add current state
    ctx.font = '48px Arial'
    ctx.fillText('Waiting for your bet...', 600, 400)

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png')

    // Return the image
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 
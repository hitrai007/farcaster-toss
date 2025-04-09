import { NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'

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
    const canvas = createCanvas(1200, 630)
    const ctx = canvas.getContext('2d')

    // Set background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 1200, 630)

    // Add title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 72px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Coin Toss Result', 600, 200)

    // Add result
    ctx.font = '48px Arial'
    ctx.fillText(`Result: ${result}`, 600, 300)
    ctx.fillText(`Bet: ${bet} ETH`, 600, 380)
    ctx.fillText(`You ${win ? 'Won!' : 'Lost!'}`, 600, 460)

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png')

    // Return the new frame state
    return new NextResponse(JSON.stringify({
      type: 'frame',
      frame: {
        image: `data:image/png;base64,${buffer.toString('base64')}`,
        buttons: [
          {
            label: 'Play Again',
            action: 'post'
          }
        ],
        input: {
          text: 'Place your bet (in ETH)'
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error processing flip:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 
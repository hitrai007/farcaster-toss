import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = parseInt(searchParams.get('result') || '0');
    const win = searchParams.get('win') === 'true';

    // Create a canvas
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 1200, 630);

    // Set text style
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';

    // Draw result text
    const resultText = result === 0 ? 'HEADS' : 'TAILS';
    ctx.fillText(resultText, 600, 300);

    // Draw win/lose text
    const outcomeText = win ? 'YOU WIN!' : 'YOU LOSE!';
    ctx.fillText(outcomeText, 600, 400);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Return the image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 
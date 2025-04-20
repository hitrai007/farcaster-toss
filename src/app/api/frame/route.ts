import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

const BET_AMOUNT_USD = 0.1; // Bet amounts in USD (0.1 USD)

// Mock game state for development
let gameState = {
  player1: null as string | null,
  player2: null as string | null,
  player1Choice: null as boolean | null, // true for heads, false for tails
  player2Choice: null as boolean | null,
  winner: null as string | null,
  toss: null as boolean | null,
};

function getFrameHtmlResponse({
  title,
  description,
  buttons,
}: {
  title: string;
  description: string;
  buttons: string[];
}): NextResponse {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
        ${buttons.map((button, index) => `
          <meta property="fc:frame:button:${index + 1}" content="${button}" />
        `).join('')}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
      </head>
      <body>
        <h1>${title}</h1>
        <p>${description}</p>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${APP_URL}/api/frame/image" />
      <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
      <meta property="fc:frame:button:1" content="Heads" />
      <meta property="fc:frame:button:2" content="Tails" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta property="og:title" content="Coin Toss Game" />
      <meta property="og:description" content="Choose Heads or Tails to play!" />
      <meta property="og:image" content="${APP_URL}/api/frame/image" />
    </head></html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { untrustedData } = body;

  if (!untrustedData) {
    return new NextResponse('Invalid request', { status: 400 });
  }

  const { buttonIndex } = untrustedData;

  // Simple response based on button click
  const response = {
    name: 'Coin Toss Game',
    description: 'Play a simple coin toss game on Farcaster',
    image: 'https://farcaster-toss.vercel.app/coin.png',
    post_url: 'https://farcaster-toss.vercel.app/api/frame',
    buttons: [
      {
        label: 'Start Game',
        action: 'post',
      },
    ],
  };

  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${response.image}" />
        <meta property="fc:frame:post_url" content="${response.post_url}" />
        <meta property="fc:frame:button:1" content="${response.buttons[0].label}" />
        <meta property="og:title" content="${response.name}" />
        <meta property="og:description" content="${response.description}" />
        <meta property="og:image" content="${response.image}" />
      </head>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export const dynamic = 'force-dynamic'; 
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
  const searchParams = req.nextUrl.searchParams;
  const state = searchParams.get('state') || 'start';

  // Generate frame image based on state
  const imageUrl = `${APP_URL}/api/frame/image?state=${state}`;

  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${imageUrl}" />
      <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
      <meta property="fc:frame:button:1" content="Heads" />
      <meta property="fc:frame:button:2" content="Tails" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
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
  const { buttonIndex } = untrustedData;

  // Handle button actions
  let state = 'start';
  if (buttonIndex === 1) {
    state = 'heads';
  } else if (buttonIndex === 2) {
    state = 'tails';
  }

  // Generate frame image based on state
  const imageUrl = `${APP_URL}/api/frame/image?state=${state}`;

  return new NextResponse(
    `<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${imageUrl}" />
      <meta property="fc:frame:post_url" content="${APP_URL}/api/frame" />
      <meta property="fc:frame:button:1" content="Heads" />
      <meta property="fc:frame:button:2" content="Tails" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    </head></html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    }
  );
}

export const dynamic = 'force-dynamic'; 
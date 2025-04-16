import { NextRequest, NextResponse } from 'next/server';

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
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
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
  // Reset game state for new game
  gameState = {
    player1: null,
    player2: null,
    player1Choice: null,
    player2Choice: null,
    winner: null,
    toss: null,
  };

  return getFrameHtmlResponse({
    title: 'Welcome to COIN TOSS',
    description: 'Choose your side',
    buttons: ['Heads', 'Tails'],
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { buttonIndex, fid } = body.untrustedData || {};
    
    console.log('Frame request:', { buttonIndex, fid });

    // Handle initial choice (Heads/Tails)
    if (!gameState.player1) {
      gameState.player1 = fid;
      gameState.player1Choice = buttonIndex === 1; // true for heads, false for tails
      return getFrameHtmlResponse({
        title: 'Bet Placed!',
        description: `Waiting for opponent to bet on ${!gameState.player1Choice ? 'Heads' : 'Tails'}`,
        buttons: ['View Status'],
      });
    } 
    
    // Handle second player's bet
    else if (!gameState.player2) {
      gameState.player2 = fid;
      gameState.player2Choice = buttonIndex === 1;
      
      // Simulate coin toss (50:50 chance)
      gameState.toss = Math.random() < 0.5;
      gameState.winner = gameState.toss === gameState.player1Choice ? gameState.player1 : gameState.player2;
      
      return getFrameHtmlResponse({
        title: 'Tossing the coin...',
        description: `${gameState.toss ? 'Heads' : 'Tails'} wins!\nSending $${BET_AMOUNT_USD * 2} to ${gameState.winner}`,
        buttons: ['Start New Game'],
      });
    }

    // Default state - show game options
    return getFrameHtmlResponse({
      title: 'Welcome to COIN TOSS',
      description: 'Choose your side',
      buttons: ['Heads', 'Tails'],
    });
  } catch (error) {
    console.error('Frame error:', error);
    return getFrameHtmlResponse({
      title: 'Error',
      description: 'An error occurred. Please try again.',
      buttons: ['Try Again'],
    });
  }
}

export const dynamic = 'force-dynamic'; 
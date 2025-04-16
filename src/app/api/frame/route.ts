import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CoinTossGameABI from '@/abis/CoinTossGame_ABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '';

// Constants for bet amounts (0.1 USD worth)
const ETH_BET_AMOUNT = ethers.parseEther('0.0001'); // Approx 0.1 USD worth of ETH
const USDC_BET_AMOUNT = ethers.parseUnits('0.1', 6); // 0.1 USDC (6 decimals)
const USDT_BET_AMOUNT = ethers.parseUnits('0.1', 6); // 0.1 USDT (6 decimals)

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
  text,
}: {
  title: string;
  description: string;
  buttons: string[];
  text?: string;
}): NextResponse {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        ${buttons.map((button, index) => `
          <meta property="fc:frame:button:${index + 1}" content="${button}" />
        `).join('')}
        ${text ? `<meta property="fc:frame:input:text" content="${text}" />` : ''}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
      </head>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  });
}

async function getGameState(contract: ethers.Contract) {
  const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
  return {
    player1: p1,
    player2: p2,
    player1Choice: p1Choice,
    player2Choice: p2Choice,
    winner: winAddr,
    toss: toss,
  };
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
    const { buttonIndex, inputText, state } = body;
    const fid = body.untrustedData?.fid;

    console.log('Frame request:', { buttonIndex, inputText, state, fid });

    // Handle token selection
    if (state === 'choose_token') {
      const choice = buttonIndex === 1; // true for heads, false for tails
      return getFrameHtmlResponse({
        title: 'Choose Token',
        description: `Select token for your ${choice ? 'Heads' : 'Tails'} bet (${0.1} USD worth)`,
        buttons: ['ETH', 'USDC', 'USDT'],
      });
    }

    // Handle bet placement
    if (state === 'place_bet') {
      const token = inputText.toUpperCase();
      const choice = gameState.player1Choice;
      
      if (!gameState.player1) {
        gameState.player1 = fid;
        gameState.player1Choice = buttonIndex === 1;
        return getFrameHtmlResponse({
          title: 'Bet Placed!',
          description: `Waiting for opponent to bet on ${!choice ? 'Heads' : 'Tails'}`,
          buttons: ['View Status'],
        });
      } else if (!gameState.player2) {
        gameState.player2 = fid;
        gameState.player2Choice = buttonIndex === 1;
        
        // Simulate coin toss (50:50 chance)
        gameState.toss = Math.random() < 0.5;
        gameState.winner = gameState.toss === gameState.player1Choice ? gameState.player1 : gameState.player2;
        
        return getFrameHtmlResponse({
          title: 'Tossing the coin...',
          description: `${gameState.toss ? 'Heads' : 'Tails'} wins!\nSending $${0.1 * 2} to ${gameState.winner}`,
          buttons: ['Start New Game'],
        });
      }
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
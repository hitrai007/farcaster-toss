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

function getFrameHtmlResponse({
  buttons,
  image,
  post_url,
  text,
}: {
  buttons: { label: string; action: string }[];
  image: string;
  post_url: string;
  text?: string;
}) {
  const absoluteImageUrl = image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_BASE_URL}${image}`;

  // Debug logging
  console.log('Frame response:', {
    image: absoluteImageUrl,
    post_url,
    buttons,
    text,
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${absoluteImageUrl}" />
        <meta property="fc:frame:post_url" content="${post_url}" />
        ${text ? `<meta property="fc:frame:input:text" content="${text}" />` : ''}
        ${buttons.map((button, index) => `
          <meta property="fc:frame:button:${index + 1}" content="${button.label}" />
          <meta property="fc:frame:button:${index + 1}:action" content="${button.action}" />
        `).join('')}
        <meta property="og:image" content="${absoluteImageUrl}" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
      </head>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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

async function getResponse(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const buttonIndex = body.untrustedData?.buttonIndex || 0;
    const inputText = body.untrustedData?.inputText || '';
    const fid = body.untrustedData?.fid;

    // Initialize contract
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider);

    // Get current game state
    const gameState = await getGameState(contract);

    // Handle different button actions
    switch (buttonIndex) {
      case 1: // Start Game
        return getFrameHtmlResponse({
          buttons: [
            {
              label: 'Choose Token',
              action: 'post',
            },
          ],
          image: '/coin-toss-frame.png',
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          text: 'Choose your token (USDC, USDT, or ETH)',
        });

      case 2: // Choose Token
        const selectedToken = inputText.toUpperCase();
        if (!['USDC', 'USDT', 'ETH'].includes(selectedToken)) {
          return getFrameHtmlResponse({
            buttons: [
              {
                label: 'Try Again',
                action: 'post',
              },
            ],
            image: '/coin-toss-frame.png',
            post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            text: 'Invalid token. Choose USDC, USDT, or ETH',
          });
        }

        return getFrameHtmlResponse({
          buttons: [
            {
              label: 'Place Bet',
              action: 'post',
            },
          ],
          image: '/coin-toss-frame.png',
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          text: `Choose heads or tails (Betting with ${selectedToken})`,
        });

      case 3: // Place Bet
        const isHeads = inputText.toLowerCase() === 'heads';
        const betToken = inputText.split(' ')[0].toUpperCase();
        const tokenAddress = betToken === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
        const betAmount = betToken === 'ETH' ? ETH_BET_AMOUNT : (betToken === 'USDC' ? USDC_BET_AMOUNT : USDT_BET_AMOUNT);
        
        try {
          let tx;
          if (betToken === 'ETH') {
            tx = await contract.placeBetWithEth(isHeads, { value: betAmount });
          } else {
            tx = await contract.placeBetWithToken(isHeads, tokenAddress, betAmount);
          }
          
          // Get updated game state
          const newGameState = await getGameState(contract);
          const isPlayer1 = newGameState.player1.toLowerCase() === fid?.toLowerCase();
          const message = isPlayer1 
            ? `Player 1: Bet placed! Waiting for Player 2 to bet on ${isHeads ? 'TAILS' : 'HEADS'}`
            : `Player 2: Bet placed! Waiting for coin toss...`;
          
          return getFrameHtmlResponse({
            buttons: [
              {
                label: 'View Transaction',
                action: 'link',
              },
              {
                label: 'View Game State',
                action: 'post',
              },
            ],
            image: '/coin-toss-frame.png',
            post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            text: `${message}\nTx: ${tx.hash}`,
          });
        } catch (error) {
          console.error('Error placing bet:', error);
          return getFrameHtmlResponse({
            buttons: [
              {
                label: 'Try Again',
                action: 'post',
              },
            ],
            image: '/coin-toss-frame.png',
            post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            text: 'Error placing bet. Please try again.',
          });
        }

      default:
        // Show current game state
        let stateMessage = 'Game not started';
        if (gameState.player1 !== ethers.ZeroAddress) {
          if (gameState.player2 === ethers.ZeroAddress) {
            stateMessage = `Player 1 bet on ${gameState.player1Choice ? 'HEADS' : 'TAILS'}. Waiting for Player 2...`;
          } else if (gameState.winner === ethers.ZeroAddress) {
            stateMessage = 'Both bets placed! Coin toss in progress...';
          } else {
            stateMessage = `Winner: ${gameState.winner} (${gameState.toss ? 'HEADS' : 'TAILS'})`;
          }
        }

        return getFrameHtmlResponse({
          buttons: [
            {
              label: 'Start Game',
              action: 'post',
            },
          ],
          image: '/coin-toss-frame.png',
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          text: stateMessage,
        });
    }
  } catch (error) {
    console.error('Frame error:', error);
    return getFrameHtmlResponse({
      buttons: [
        {
          label: 'Try Again',
          action: 'post',
        },
      ],
      image: '/coin-toss-frame.png',
      post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
      text: 'An error occurred. Please try again.',
    });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Debug request
    console.log('Frame request received:', {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    const body = await req.json();
    console.log('Frame request body:', body);

    const buttonIndex = body.untrustedData?.buttonIndex || 0;
    const inputText = body.untrustedData?.inputText || '';
    const fid = body.untrustedData?.fid;

    // For testing, return a simple frame with just one button
    return getFrameHtmlResponse({
      buttons: [
        {
          label: 'Start Game',
          action: 'post',
        },
      ],
      image: '/coin-toss-frame.png',
      post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
    });
  } catch (error) {
    console.error('Frame error:', error);
    return getFrameHtmlResponse({
      buttons: [
        {
          label: 'Try Again',
          action: 'post',
        },
      ],
      image: '/coin-toss-frame.png',
      post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
    });
  }
}

export const dynamic = 'force-dynamic'; 
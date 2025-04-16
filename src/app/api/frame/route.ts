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
  imageUrl,
  postUrl,
  buttons,
  text,
}: {
  imageUrl: string;
  postUrl: string;
  buttons: string[];
  text?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:post_url" content="${postUrl}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        ${buttons.map((button, index) => `
          <meta property="fc:frame:button:${index + 1}" content="${button}" />
        `).join('')}
        ${text ? `<meta property="fc:frame:input:text" content="${text}" />` : ''}
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="Play a simple coin toss game on Farcaster" />
      </head>
    </html>
  `;
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
          imageUrl: '/coin-toss-frame.png',
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          buttons: ['Start Game'],
        });

      case 2: // Choose Token
        const selectedToken = inputText.toUpperCase();
        if (!['USDC', 'USDT', 'ETH'].includes(selectedToken)) {
          return getFrameHtmlResponse({
            imageUrl: '/coin-toss-frame.png',
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            buttons: ['Try Again'],
            text: 'Invalid token. Choose USDC, USDT, or ETH',
          });
        }

        return getFrameHtmlResponse({
          imageUrl: '/coin-toss-frame.png',
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          buttons: ['Place Bet'],
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
            imageUrl: '/coin-toss-frame.png',
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            buttons: ['View Transaction', 'View Game State'],
            text: `${message}\nTx: ${tx.hash}`,
          });
        } catch (error) {
          console.error('Error placing bet:', error);
          return getFrameHtmlResponse({
            imageUrl: '/coin-toss-frame.png',
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
            buttons: ['Try Again'],
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
          imageUrl: '/coin-toss-frame.png',
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          buttons: ['Start Game'],
          text: stateMessage,
        });
    }
  } catch (error) {
    console.error('Frame error:', error);
    return getFrameHtmlResponse({
      imageUrl: '/coin-toss-frame.png',
      postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
      buttons: ['Try Again'],
      text: 'An error occurred. Please try again.',
    });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const state = searchParams.get('state');
  
  // Initial state - show start screen
  if (!state) {
    return new NextResponse(
      getFrameHtmlResponse({
        imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
        postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
        buttons: ['Start Game'],
      }),
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // Handle different states
  switch (state) {
    case 'choose_token':
      return new NextResponse(
        getFrameHtmlResponse({
          imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          buttons: ['ETH', 'USDC', 'USDT'],
        }),
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        }
      );
    case 'place_bet':
      const token = searchParams.get('token');
      return new NextResponse(
        getFrameHtmlResponse({
          imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          buttons: ['Place Bet'],
          text: `Enter ${token} amount`,
        }),
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        }
      );
    case 'flip_coin':
      return new NextResponse(
        getFrameHtmlResponse({
          imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          buttons: ['Flip Coin'],
        }),
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        }
      );
    default:
      return new NextResponse(
        getFrameHtmlResponse({
          imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          buttons: ['Start Game'],
        }),
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        }
      );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buttonIndex, inputText, state } = body;

    console.log('Frame request:', { buttonIndex, inputText, state });

    switch (buttonIndex) {
      case 1: // Start Game
        return new NextResponse(
          getFrameHtmlResponse({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame?state=choose_token`,
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            buttons: ['ETH', 'USDC', 'USDT'],
          }),
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          }
        );
      case 2: // Choose Token
        const selectedToken = inputText.toUpperCase();
        return new NextResponse(
          getFrameHtmlResponse({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame?state=place_bet&token=${selectedToken}`,
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            buttons: ['Place Bet'],
            text: `Enter ${selectedToken} amount`,
          }),
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          }
        );
      case 3: // Place Bet
        const betToken = inputText.split(' ')[0].toUpperCase();
        const betAmount = inputText.split(' ')[1];
        return new NextResponse(
          getFrameHtmlResponse({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame?state=flip_coin&token=${betToken}&amount=${betAmount}`,
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            buttons: ['Flip Coin'],
          }),
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          }
        );
      default:
        return new NextResponse(
          getFrameHtmlResponse({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            buttons: ['Start Game'],
          }),
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          }
        );
    }
  } catch (error) {
    console.error('Frame error:', error);
    return new NextResponse(
      getFrameHtmlResponse({
        imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
        postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
        buttons: ['Try Again'],
        text: 'An error occurred. Please try again.',
      }),
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export const dynamic = 'force-dynamic'; 
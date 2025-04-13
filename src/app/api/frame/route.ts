import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CoinTossGame } from '../../../../contracts/CoinTossGame.sol';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: process.env.NEYNAR_API_KEY });

  if (!isValid) {
    return new NextResponse('Invalid frame request', { status: 400 });
  }

  const buttonIndex = message.button;
  const inputText = message.input || '';
  const fid = message.interactor.fid;

  // Initialize contract
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGame.abi, provider);

  // Handle different button actions
  switch (buttonIndex) {
    case 1: // Connect Wallet
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'Connect Farcaster Wallet',
              action: 'post',
            },
            {
              label: 'Connect EVM Wallet',
              action: 'post',
            },
          ],
          image: `${process.env.NEXT_PUBLIC_BASE_URL}/connect-wallet.png`,
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
        })
      );

    case 2: // Choose Currency
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'USDC',
              action: 'post',
            },
            {
              label: 'USDT',
              action: 'post',
            },
            {
              label: 'ETH',
              action: 'post',
            },
          ],
          image: `${process.env.NEXT_PUBLIC_BASE_URL}/choose-currency.png`,
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
        })
      );

    case 3: // Place Bet
      const isHeads = inputText.toLowerCase() === 'heads';
      const tokenAddress = message.input === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
      
      try {
        if (message.input === 'ETH') {
          await contract.placeBetWithEth(isHeads, { value: ethers.parseEther('0.0001') });
        } else {
          await contract.placeBetWithToken(isHeads, tokenAddress);
        }
        
        return new NextResponse(
          getFrameHtmlResponse({
            buttons: [
              {
                label: 'View Result',
                action: 'post',
              },
            ],
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/bet-placed.png`,
            post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          })
        );
      } catch (error) {
        console.error('Error placing bet:', error);
        return new NextResponse(
          getFrameHtmlResponse({
            buttons: [
              {
                label: 'Try Again',
                action: 'post',
              },
            ],
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/error.png`,
            post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
          })
        );
      }

    default:
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'Start Game',
              action: 'post',
            },
          ],
          image: `${process.env.NEXT_PUBLIC_BASE_URL}/coin-toss-frame.png`,
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
        })
      );
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic'; 
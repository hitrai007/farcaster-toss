import { NextRequest, NextResponse } from 'next/server';
import {
  FrameRequest,
  getFrameMessage,
  getFrameHtmlResponse,
  FrameTransactionResponse,
} from '@farcaster/frame-sdk';
import { ethers } from 'ethers'; // Using ethers v6 syntax if available, else adapt
import { COIN_TOSS_GAME_ABI, COIN_TOSS_GAME_ADDRESS, ERC20_ABI, USDC_ADDRESS } from '../../../contracts/constants'; // Adjust path if needed

const USDC_DECIMALS = 6;
const BET_AMOUNT_UNITS = ethers.parseUnits('0.1', USDC_DECIMALS);
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Ensure this is set

// Helper to create ABI interface
function createInterface(abi: any): ethers.Interface {
    return new ethers.Interface(abi);
}

const erc20Interface = createInterface(ERC20_ABI);
const gameInterface = createInterface(COIN_TOSS_GAME_ABI);


async function getResponse(req: NextRequest): Promise<NextResponse> {
  let accountAddress: string | undefined = '';
  let buttonIndex: number | undefined;
  let choice: number | undefined; // 0 for heads, 1 for tails
  let state: { stage: 'initial' | 'approve' | 'play' } = { stage: 'initial' }; // Default state

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    // TODO: Add neynarApiKey: 'NEYNAR_API_KEY' for better validation in production
  });

  if (isValid && message) {
    accountAddress = message.interactor.verified_accounts[0]; // Use the first verified account
    buttonIndex = message.button;

    // Decode state if present
    try {
        if (message.state) {
            state = JSON.parse(decodeURIComponent(message.state));
        }
    } catch (e) {
        console.error("Error parsing state:", e);
        // Keep default state on error
    }

    console.log("Received Frame Message:", { accountAddress, buttonIndex, currentState: state });

    // --- State Machine ---

    // 1. User made a choice (coming from initial frame) -> Ask for Approval
    if (state.stage === 'initial' && buttonIndex) {
        choice = buttonIndex === 1 ? 0 : 1; // Button 1 = Heads (0), Button 2 = Tails (1)
        console.log(`Choice made: ${choice === 0 ? 'Heads' : 'Tails'}`);

        const approveCalldata = erc20Interface.encodeFunctionData('approve', [
            COIN_TOSS_GAME_ADDRESS,
            BET_AMOUNT_UNITS
        ]);

        const newState = JSON.stringify({ stage: 'play', choice });

        const frameTx: FrameTransactionResponse = {
            chainId: `eip155:${84532}`, // Base Sepolia Chain ID
            method: 'eth_sendTransaction',
            params: {
              abi: ERC20_ABI as any, // ABI is required by Frame spec
              to: USDC_ADDRESS as `0x${string}`,
              data: approveCalldata,
              value: '0', // No ETH value for approve
            },
        };

        console.log("Generating Approval Frame:", frameTx);

        return new NextResponse(
            getFrameHtmlResponse({
                buttons: [
                    {
                        label: `Transaction Ready: Approve 0.1 USDC`,
                        action: 'tx',
                        target: `${NEXT_PUBLIC_URL}/api/frame`, // Target for the *next* step (play)
                        postUrl: `${NEXT_PUBLIC_URL}/api/tx-success?action=approved&choice=${choice}`, // Optional: URL to hit after TX success
                    },
                    {
                        label: `Back`, // Go back to initial choice
                        action: 'post',
                        target: `${NEXT_PUBLIC_URL}/api/frame`, // Target initial state
                    }
                ],
                image: {
                    src: `${NEXT_PUBLIC_URL}/images/approve-usdc.png`, // Replace with your image URL
                    aspectRatio: '1.91:1',
                },
                input: { // Optional input example
                    text: 'Approve USDC Spend'
                },
                postUrl: `${NEXT_PUBLIC_URL}/api/frame`, // The post_url for the transaction frame itself
                state: newState, // Pass the next stage and choice in state
            })
        );
    }

    // 2. User submitted Approval TX (coming from approve frame) -> Ask to Play Game
    if (state.stage === 'play' && message?.transactionId) {
         choice = state.choice; // Get choice from state
         console.log(`Approval TX submitted: ${message.transactionId}, proceeding to play choice: ${choice === 0 ? 'Heads' : 'Tails'}`);

         // TODO: Add logic to actually check if approval succeeded on-chain before offering `joinGame`
         // This might involve a separate polling mechanism or checking allowance in this step.
         // For now, we assume approval will succeed.

         // Assuming a game is always running or can be started. Need logic to handle game states (start vs join)
         // Let's assume we are *joining* an existing game for now, using gameId 0 (needs adjustment)
         // NOTE: The contract requires player 2's choice to be different from player 1.
         //       This simple example doesn't fetch player 1's choice. A real implementation MUST do this.
         //       Forcing choice = false (tails) if player 1 chose heads (true) for now.
         const joinChoice = choice === 0; // true for heads, false for tails
         const gameId = '0'; // Needs dynamic fetching or starting logic

         const joinGameCalldata = gameInterface.encodeFunctionData('joinGame', [
             gameId, // Placeholder Game ID - NEEDS to be dynamic
             joinChoice, // Use the user's choice (needs check against player 1)
             USDC_ADDRESS
         ]);

         const frameTx: FrameTransactionResponse = {
             chainId: `eip155:${84532}`, // Base Sepolia Chain ID
             method: 'eth_sendTransaction',
             params: {
               abi: COIN_TOSS_GAME_ABI as any,
               to: COIN_TOSS_GAME_ADDRESS as `0x${string}`,
               data: joinGameCalldata,
               value: '0', // No ETH value for joinGame
             },
         };

         console.log("Generating Join Game Frame:", frameTx);

         return new NextResponse(
             getFrameHtmlResponse({
                 buttons: [
                     {
                         label: `Confirmed: Join Game (${choice === 0 ? 'Heads' : 'Tails'})`,
                         action: 'tx',
                         target: `${NEXT_PUBLIC_URL}/api/frame`, // Target for next step (e.g., show result)
                         postUrl: `${NEXT_PUBLIC_URL}/api/tx-success?action=joined`, // Optional: URL after TX success
                     },
                      {
                        label: `Tx Submitted! View Result`, // View result after tx
                        action: 'post',
                        target: `${NEXT_PUBLIC_URL}/api/frame`, // Go to results state
                     }
                 ],
                 image: {
                     src: `${NEXT_PUBLIC_URL}/images/join-game.png`, // Replace with your image URL
                     aspectRatio: '1.91:1',
                 },
                  postUrl: `${NEXT_PUBLIC_URL}/api/frame`,
                 state: JSON.stringify({ stage: 'result' }) // Move to result stage
             })
         );
    }

     // TODO: Add 'result' stage logic here (e.g., show game outcome)
  }

  // --- Default Initial Frame ---
  console.log("Generating Initial Frame");
  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: 'Heads',
          action: 'post', // Will trigger the 'approve' stage
          target: `${NEXT_PUBLIC_URL}/api/frame`,
        },
        {
          label: 'Tails',
          action: 'post', // Will trigger the 'approve' stage
          target: `${NEXT_PUBLIC_URL}/api/frame`,
        },
      ],
      image: {
        src: `${NEXT_PUBLIC_URL}/images/select-choice.png`, // Replace with your image URL
        aspectRatio: '1.91:1',
      },
      postUrl: `${NEXT_PUBLIC_URL}/api/frame`, // Post back to self
      state: JSON.stringify({ stage: 'initial' }), // Set initial state
    })
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

// Fallback GET (optional, for direct access or debugging)
export async function GET(req: NextRequest): Promise<Response> {
   return getResponse(req); // Serve initial frame for GET requests
}

export const dynamic = 'force-dynamic'; // Ensure fresh execution 
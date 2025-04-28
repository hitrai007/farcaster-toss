import { NextRequest, NextResponse } from 'next/server';
import {
  getFrameMessage,
  getFrameHtmlResponse,
  FrameTransactionResponse,
  FrameValidationData // Import specific type
} from '@farcaster/frame-sdk';
import { ethers } from 'ethers'; // Using ethers v6 syntax if available, else adapt
import { COIN_TOSS_GAME_ABI, COIN_TOSS_GAME_ADDRESS, ERC20_ABI, USDC_ADDRESS } from '../../../contracts/constants'; // Adjust path if needed

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Ensure this is set

// Helper to create ABI interface
function createInterface(abi: any): ethers.Interface {
    return new ethers.Interface(abi);
}

const erc20Interface = createInterface(ERC20_ABI);
const gameInterface = createInterface(COIN_TOSS_GAME_ABI);

// Setup provider for reading contract state
// Ensure RPC_URL is set in your environment variables (.env.local or Vercel)
const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
  throw new Error("Missing RPC_URL environment variable");
}
const provider = new ethers.JsonRpcProvider(RPC_URL);

const gameContractReader = new ethers.Contract(COIN_TOSS_GAME_ADDRESS, COIN_TOSS_GAME_ABI, provider);
const USDC_DECIMALS = 6;
const BET_AMOUNT_UNITS = ethers.parseUnits('0.1', USDC_DECIMALS);

// Define the state object type
type State = {
  stage: 'initial' | 'approve' | 'play' | 'result' | 'check_result' | 'error';
  choice?: number; // 1 for Heads, 2 for Tails
  txHash?: string; // To store tx hash between steps if needed
  error?: string; // To store error messages
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let accountAddress: string | undefined = '';
  let message: FrameValidationData | undefined; // Use FrameValidationData type
  let state: State = { stage: 'initial' }; // Default state

  const body = await req.json();

  // TODO: Add Neynar validation in production
  const { isValid, message: frameMessage } = await getFrameMessage(body, {
    // neynarApiKey: 'NEYNAR_API_DOCS', // Uncomment and replace in production
    // allowFramegear: true,
  });

  if (isValid && frameMessage) {
    message = frameMessage; // Assign validated message
    accountAddress = message.interactor.verified_accounts[0] ?? message.interactor.custody_address;

    // Deserialize state if present
    if (message.state) {
      try {
        state = JSON.parse(decodeURIComponent(message.state)) as State;
      } catch (e) {
        console.error("Failed to parse state:", e);
        state = { stage: 'error', error: 'Invalid state' }; // Reset to error state
      }
    }
  } else {
     // If message is invalid or missing, potentially show an error or default frame
     // For simplicity, we'll proceed but ideally handle this case robustly
     console.warn("Frame message validation failed or message missing");
     // Keep default initial state
  }

  const buttonIndex = message?.button;
  const transactionId = message?.transaction?.hash; // Correctly access tx hash if available

  console.log("Current State:", state);
  console.log("Button Index:", buttonIndex);
  console.log("Transaction ID:", transactionId);

  const imageUrl = `${NEXT_PUBLIC_URL}/images/placeholder.png`; // Use the placeholder

  // --- State Machine Logic ---

  // 1. Initial State or Error Recovery
  if (state.stage === 'initial' || state.stage === 'error') {
    const messageText = state.stage === 'error' ? `Error: ${state.error}. Try again:` : "Choose Heads or Tails to start/join (1 USDC)";
    const nextState: State = { stage: 'approve' }; // Next stage is approval after choice
    return new NextResponse(getFrameHtmlResponse({
      buttons: [
        { label: 'Heads (1)', action: 'post' },
        { label: 'Tails (2)', action: 'post' },
      ],
      image: imageUrl,
      post_url: `${NEXT_PUBLIC_URL}/api/frame`,
      state: encodeURIComponent(JSON.stringify(nextState)),
    }));
  }

  // 2. User Makes Initial Choice -> Prepare for Approval
  if (state.stage === 'approve' && buttonIndex) {
    const userChoice = buttonIndex; // 1 for Heads, 2 for Tails

    // Check if a game is already started
    let player1Choice = 0;
    try {
      const currentGame = await gameContractReader.currentGame();
      if (currentGame.player1 !== ethers.ZeroAddress) {
        player1Choice = Number(currentGame.player1Choice); // Convert BigInt to number
      }
    } catch (err) {
      console.error("Error reading contract state:", err);
      const errorState: State = { stage: 'error', error: 'Could not read game state.' };
      return new NextResponse(getFrameHtmlResponse({
        buttons: [{ label: 'Try Again', action: 'post' }],
        image: imageUrl,
        post_url: `${NEXT_PUBLIC_URL}/api/frame`,
        state: encodeURIComponent(JSON.stringify({ stage: 'initial' })), // Go back to start
      }));
    }

    // If a game exists and user chose the *same* as player 1, show error/info
    if (player1Choice !== 0 && userChoice === player1Choice) {
      const opponentChoice = player1Choice === 1 ? 'Heads' : 'Tails';
      const requiredChoice = player1Choice === 1 ? 'Tails' : 'Heads';
      const infoState: State = { stage: 'initial' }; // Go back to initial choice
      return new NextResponse(getFrameHtmlResponse({
        buttons: [{ label: 'Choose Again', action: 'post' }],
        image: { src: imageUrl, aspectRatio: '1:1' }, // Keep image ratio consistent
        post_url: `${NEXT_PUBLIC_URL}/api/frame`,
        state: encodeURIComponent(JSON.stringify(infoState)),
      }));
    }

    const approveCalldata = erc20Interface.encodeFunctionData("approve", [
      COIN_TOSS_GAME_ADDRESS,
      BET_AMOUNT_UNITS
    ]);

    const nextState: State = { stage: 'play', choice: userChoice }; // Prepare for the play (start/join) step

    return new NextResponse(getFrameHtmlResponse({
      buttons: [{ label: `Approve 0.1 USDC`, action: 'tx' /*, target: `${NEXT_PUBLIC_URL}/api/tx?function=approve`*/ }], // Target removed temporarily for tx action
      image: imageUrl,
      post_url: `${NEXT_PUBLIC_URL}/api/frame`, // Post back here after tx broadcast
      state: encodeURIComponent(JSON.stringify(nextState)),
      // Specify transaction details directly for FrameTransactionResponse
      // The tx route is primarily for calldata generation if needed, but we can construct here
      tx: {
        to: USDC_ADDRESS as `0x${string}`,
        chainId: `eip155:84532`,
        abi: ERC20_ABI as any,
        data: approveCalldata,
        value: '0'
      }
    }));
  }

  // 3. Approval Transaction Submitted -> Prepare for Start/Join Game
   if (state.stage === 'play' && transactionId && state.choice) {
    // Approval presumably submitted (we don't know if it succeeded yet!)
    // Now determine if starting or joining based on contract state *again* (in case it changed)

    let player1Address = ethers.ZeroAddress;
    let player1Choice = 0; // 0 = No game, 1 = Heads, 2 = Tails
    try {
      const currentGame = await gameContractReader.currentGame();
      player1Address = currentGame.player1;
      if (player1Address !== ethers.ZeroAddress) {
        player1Choice = Number(currentGame.player1Choice);
      }
    } catch (err) {
       console.error("Error reading contract state before play:", err);
       const errorState: State = { stage: 'error', error: 'Could not read game state.' };
       return new NextResponse(getFrameHtmlResponse({
         buttons: [{ label: 'Try Again', action: 'post' }],
         image: imageUrl,
         post_url: `${NEXT_PUBLIC_URL}/api/frame`,
         state: encodeURIComponent(JSON.stringify({ stage: 'initial' })),
       }));
    }

    let gameCalldata: string;
    let targetFunction: string;
    const userChoice = state.choice; // 1 or 2

    if (player1Address === ethers.ZeroAddress) {
      // Start Game
      console.log(`User ${accountAddress} starting game with choice ${userChoice}`);
      gameCalldata = gameInterface.encodeFunctionData("startGame", [userChoice]);
      targetFunction = "startGame";
    } else {
      // Join Game - double check choice validity
      if (userChoice === player1Choice) {
         console.error(`User ${accountAddress} attempted to join with same choice ${userChoice} as player 1`);
         const errorState: State = { stage: 'error', error: `Cannot join with ${userChoice === 1 ? 'Heads' : 'Tails'}, opponent already chose that.` };
         return new NextResponse(getFrameHtmlResponse({
           buttons: [{ label: 'Choose Again', action: 'post' }],
           image: imageUrl,
           post_url: `${NEXT_PUBLIC_URL}/api/frame`,
           state: encodeURIComponent(JSON.stringify({ stage: 'initial' })),
         }));
      }
      console.log(`User ${accountAddress} joining game with choice ${userChoice} against player 1's choice ${player1Choice}`);
      gameCalldata = gameInterface.encodeFunctionData("joinGame", [userChoice]);
      targetFunction = "joinGame";
    }

    const nextState: State = { stage: 'result', choice: userChoice }; // Move to result stage after tx

    return new NextResponse(getFrameHtmlResponse({
        buttons: [{ label: `${targetFunction === 'startGame' ? 'Start Game' : 'Join Game'}`, action: 'tx' }],
        image: imageUrl,
        post_url: `${NEXT_PUBLIC_URL}/api/frame`, // Post back here after game tx
        state: encodeURIComponent(JSON.stringify(nextState)),
        // Specify transaction details directly
        tx: {
           to: COIN_TOSS_GAME_ADDRESS as `0x${string}`,
           chainId: `eip155:84532`,
           abi: COIN_TOSS_GAME_ABI as any,
           data: gameCalldata,
           value: '0'
         }
      }));
  }

   // 4. Game Transaction Submitted -> Show Intermediate Result/Check Button
   if (state.stage === 'result' && transactionId) {
     // Game transaction submitted (start or join)
     const nextState: State = { stage: 'check_result', choice: state.choice, txHash: transactionId }; // Add txHash if needed later
     return new NextResponse(getFrameHtmlResponse({
       buttons: [
         { label: '⏳ Processing... Check Result', action: 'post' },
       ],
       image: imageUrl,
       post_url: `${NEXT_PUBLIC_URL}/api/frame`,
       state: encodeURIComponent(JSON.stringify(nextState)),
     }));
   }

   // 5. User Clicks "Check Result"
   if (state.stage === 'check_result') {
     console.log(`Checking result for user ${accountAddress}, choice ${state.choice}`);
     let winnerAddress = ethers.ZeroAddress;
     let gameResultText = "Game outcome pending...";
     let buttons: any[] = [{ label: 'Check Again', action: 'post' }]; // Default button
     let resultImageUrl = imageUrl; // Default image

     try {
        const currentGame = await gameContractReader.currentGame();
        winnerAddress = currentGame.winner;

        if (winnerAddress !== ethers.ZeroAddress) {
            if (winnerAddress === accountAddress) {
                gameResultText = "🎉 You Won!";
                resultImageUrl = `${NEXT_PUBLIC_URL}/images/win.png`; // Win image
            } else if (winnerAddress === ethers.getAddress('0x000000000000000000000000000000000000dEaD')) { // Check for draw address
                 gameResultText = "🤝 It's a Draw!";
                 resultImageUrl = `${NEXT_PUBLIC_URL}/images/draw.png`; // Draw image
            }
             else {
                gameResultText = "😢 You Lost.";
                resultImageUrl = `${NEXT_PUBLIC_URL}/images/lose.png`; // Lose image
            }
            // Game finished, offer to play again
            buttons = [{ label: 'Play Again?', action: 'post' }];
            state = { stage: 'initial' }; // Reset state for Play Again button
        } else if (currentGame.player1 !== ethers.ZeroAddress && currentGame.player2 !== ethers.ZeroAddress) {
            // Both players joined, but no winner yet (shouldn't happen with auto-resolve)
            gameResultText = "Game in progress, result not yet determined.";
             buttons = [{ label: 'Check Again', action: 'post' }]; // Keep check again button
             state = { stage: 'check_result', choice: state.choice }; // Keep state for checking again
        } else if (currentGame.player1 !== ethers.ZeroAddress) {
             gameResultText = "Waiting for opponent to join...";
             buttons = [{ label: 'Check Again', action: 'post' }]; // Keep check again button
             state = { stage: 'check_result', choice: state.choice }; // Keep state for checking again
        }
          else {
             // Should not happen if we reached here, implies game was reset somehow
             gameResultText = "Game seems to have ended or reset.";
              buttons = [{ label: 'Play Again?', action: 'post' }];
              state = { stage: 'initial' };
          }

     } catch (err) {
       console.error("Error reading final game state:", err);
       gameResultText = "Error checking result.";
       buttons = [{ label: 'Try Checking Again', action: 'post' }];
       state = { stage: 'check_result', choice: state.choice }; // Keep state for retry
     }


     return new NextResponse(getFrameHtmlResponse({
       buttons: buttons,
       image: { src: resultImageUrl, aspectRatio: '1:1' }, // Use dynamic result image
       post_url: `${NEXT_PUBLIC_URL}/api/frame`,
       state: encodeURIComponent(JSON.stringify(state)), // Use updated state for next action
       // Add text input to display the result text
       input: { text: gameResultText }
     }));
   }


  // --- Fallback or Unhandled State ---
  console.warn("Reached fallback state for state:", state);
  const fallbackState: State = { stage: 'initial' };
  return new NextResponse(getFrameHtmlResponse({
    buttons: [{ label: 'Start Over', action: 'post' }],
    image: imageUrl,
    post_url: `${NEXT_PUBLIC_URL}/api/frame`,
    state: encodeURIComponent(JSON.stringify(fallbackState)),
  }));
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

// Add a GET handler to serve the initial frame
export async function GET(req: NextRequest): Promise<Response> {
    // Serve the initial frame state via GET request to the endpoint
    const initialState: State = { stage: 'initial' };
    const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const imageUrl = `${NEXT_PUBLIC_APP_URL}/images/placeholder.png`;

    return new NextResponse(getFrameHtmlResponse({
      buttons: [
        { label: 'Heads (1)', action: 'post' },
        { label: 'Tails (2)', action: 'post' },
      ],
      image: imageUrl,
      post_url: `${NEXT_PUBLIC_APP_URL}/api/frame`,
      state: encodeURIComponent(JSON.stringify(initialState)), // Start with initial state
    }));
}

export const dynamic = 'force-dynamic'; 
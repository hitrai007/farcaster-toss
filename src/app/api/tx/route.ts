import { NextRequest, NextResponse } from 'next/server';
import * as frameSdk from '@farcaster/frame-sdk';
import { ethers } from 'ethers';
import { ERC20_ABI, COIN_TOSS_GAME_ABI } from '../../../contracts/constants'; // Adjust path as needed

// Define the chain ID (Base Sepolia)
const CHAIN_ID = 'eip155:84532';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const contractAddress = searchParams.get('contractAddress');
  const calldata = searchParams.get('calldata');
  const value = searchParams.get('value') ?? '0'; // Default value to '0' if not provided
  const functionName = searchParams.get('function'); // e.g., 'approve', 'startGame', 'joinGame'

  if (!contractAddress || !calldata) {
    return NextResponse.json({ error: 'Missing required query parameters: contractAddress or calldata' }, { status: 400 });
  }

  // Validate address and calldata format (basic check)
  if (!ethers.isAddress(contractAddress) || !ethers.isHexString(calldata)) {
      return NextResponse.json({ error: 'Invalid contractAddress or calldata format' }, { status: 400 });
  }

  // Determine ABI based on function or contract address if needed (more robust approach)
  // For simplicity, we might rely on the calldata being correct, but ideally validate
  let abi = [];
  if (functionName === 'approve') {
    abi = ERC20_ABI;
  } else if (functionName === 'startGame' || functionName === 'joinGame') {
    abi = COIN_TOSS_GAME_ABI;
  } else {
     // Optional: Add a default or throw error if function type is unknown/needed
     console.warn(`Unknown function type: ${functionName}. Returning transaction without specific ABI.`);
     // You might need a generic ABI or handle this case based on your frame's logic
  }


  const txResponse: frameSdk.FrameTransactionResponse = {
    chainId: CHAIN_ID,
    method: 'eth_sendTransaction',
    params: {
      abi: abi as any, // Providing the ABI for the specific function
      to: contractAddress as `0x${string}`,
      data: calldata as `0x${string}`,
      value: value, // Use the parsed value (string '0' is valid)
    },
  };

  console.log('Generated Transaction Frame Response:', txResponse);

  return NextResponse.json(txResponse);
}

// Optional: Add a GET handler for testing or information, though typically not used for tx frames
// export async function GET(req: NextRequest): Promise<Response> {
//   return NextResponse.json({ message: 'Send POST request with contractAddress, calldata, and value query params.' });
// }

export const dynamic = 'force-dynamic'; 
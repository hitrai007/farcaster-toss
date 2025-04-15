import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CoinTossGameABI from '@/abis/CoinTossGame_ABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || '';

export async function GET(req: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider);
    
    const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
    
    return NextResponse.json({
      player1: p1,
      player2: p2,
      player1Choice: p1Choice,
      player2Choice: p2Choice,
      winner: winAddr,
      toss: toss,
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json({ error: 'Failed to fetch game state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, address, choice } = body;

    if (!action || !address) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider);

    switch (action) {
      case 'placeBet':
        if (!choice) {
          return NextResponse.json({ error: 'Missing choice parameter' }, { status: 400 });
        }
        const isHeads = choice.toLowerCase() === 'heads';
        const tx = await contract.placeBet(isHeads);
        return NextResponse.json({ transactionHash: tx.hash });

      case 'getState':
        const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
        return NextResponse.json({
          player1: p1,
          player2: p2,
          player1Choice: p1Choice,
          player2Choice: p2Choice,
          winner: winAddr,
          toss: toss,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 
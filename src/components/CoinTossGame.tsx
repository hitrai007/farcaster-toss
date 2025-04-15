'use client';

import React, { useState, useEffect } from 'react';
import { useFarcaster } from './FarcasterProvider';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import CoinTossGameABI from '@/abis/CoinTossGame_ABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export default function CoinTossGame() {
  const { isConnected: isFarcasterConnected, user: farcasterUser, isReady } = useFarcaster();
  const { address, isConnected: isWalletConnected } = useAccount();
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && isFarcasterConnected && isWalletConnected) {
      fetchGameState();
    }
  }, [isReady, isFarcasterConnected, isWalletConnected]);

  const fetchGameState = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider);
      const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
      
      setGameState({
        player1: p1,
        player2: p2,
        player1Choice: p1Choice,
        player2Choice: p2Choice,
        winner: winAddr,
        toss: toss,
      });
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const handleBet = async (isHeads: boolean) => {
    if (!isFarcasterConnected || !isWalletConnected) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, signer);
      
      const tx = await contract.placeBet(isHeads);
      await tx.wait();
      
      // Refresh game state
      await fetchGameState();
      
      // Send notification to the other player
      if (gameState?.player1 && !gameState?.player2) {
        await sdk.sendNotification({
          recipient: gameState.player1,
          message: 'Player 2 has placed their bet!',
        });
      }
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isFarcasterConnected || !isWalletConnected) {
    return (
      <div className="text-center p-4">
        <p className="mb-4">Please connect your Farcaster account and wallet to play</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Coin Toss Game</h2>
      
      {gameState && (
        <div className="mb-4">
          <p>Player 1: {gameState.player1}</p>
          <p>Player 2: {gameState.player2 || 'Waiting...'}</p>
          {gameState.winner && <p>Winner: {gameState.winner}</p>}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => handleBet(true)}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Heads'}
        </button>
        <button
          onClick={() => handleBet(false)}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Tails'}
        </button>
      </div>
    </div>
  );
}
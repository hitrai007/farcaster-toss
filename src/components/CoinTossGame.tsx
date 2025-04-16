'use client';

import React, { useState, useEffect } from 'react';
import { useFarcaster } from './FarcasterProvider';
import { useAccount, useDisconnect } from 'wagmi';
import { ethers } from 'ethers';
import { USDC_ADDRESS, USDT_ADDRESS, BET_AMOUNT_USD, COINGECKO_API, ETH_PRICE_INTERVAL } from './WalletProvider';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Image from 'next/image';

// Mock game state for UI development
const MOCK_GAME_STATE = {
  player1: '0x0000000000000000000000000000000000000000',
  player2: '0x0000000000000000000000000000000000000000',
  player1Choice: false,
  player2Choice: false,
  winner: '0x0000000000000000000000000000000000000000',
  toss: false,
};

interface GameState {
  betAmount: number;
  selectedToken: string;
  gameStatus: 'idle' | 'betting' | 'flipping' | 'result';
  result: 'heads' | 'tails' | null;
  winAmount: number | null;
  player1: {
    address: string;
    toss: boolean;
  };
  player2: {
  address: string;
    toss: boolean;
  };
  winner: string | null;
}

export default function CoinTossGame() {
  const { isConnected: isFarcasterConnected, user: farcasterUser, isReady, error: farcasterError } = useFarcaster();
  const { address, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const [gameState, setGameState] = useState<GameState>({
    betAmount: 0.01,
    selectedToken: 'ETH',
    gameStatus: 'idle',
    result: null,
    winAmount: null,
    player1: {
      address: '',
      toss: false,
    },
    player2: {
      address: '',
      toss: false,
    },
    winner: null,
  });
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'ETH'>('ETH');
  const [ethPrice, setEthPrice] = useState<number>(2000); // Default to $2000

  // Fetch ETH price from CoinGecko
  const { data: priceData } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await fetch(`${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`);
      const data = await response.json();
      return data.ethereum.usd;
    },
    refetchInterval: ETH_PRICE_INTERVAL,
  });

  useEffect(() => {
    if (priceData) {
      setEthPrice(priceData);
    }
  }, [priceData]);

  const handleBet = async (isHeads: boolean) => {
    if (!isFarcasterConnected || !isWalletConnected) {
      toast.error('Please connect your Farcaster account and wallet');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Processing your bet...');

      // Mock transaction for UI development
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update mock game state
      setGameState(prev => ({
        ...prev,
        player1: {
          address: address || prev.player1.address,
          toss: isHeads,
        },
      }));

      toast.success('Bet placed successfully!');
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  const getTokenAmount = () => {
    if (selectedToken === 'ETH') {
      return (BET_AMOUNT_USD / ethPrice).toFixed(6);
    }
    return BET_AMOUNT_USD.toFixed(2);
  };

  const handleDisconnect = () => {
    if (isWalletConnected) {
      disconnectWallet();
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Coin Toss Game</h2>
        {(isWalletConnected || isFarcasterConnected) && (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Disconnect
          </button>
        )}
      </div>
      
      {(!isFarcasterConnected || !isWalletConnected) ? (
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="w-64 h-64 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-8xl">🪙</span>
          </div>
          <p className="mb-4 text-gray-700">
            {!isFarcasterConnected && !isWalletConnected
              ? "Please connect your wallet to play"
              : !isFarcasterConnected
              ? "No Farcaster account found for this wallet"
              : "Please connect your wallet"}
          </p>
          <div className="space-x-4">
            {!isWalletConnected && (
              <w3m-button />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Token:</label>
              <div className="grid grid-cols-3 gap-2">
                {['ETH', 'USDC', 'USDT'].map((token) => (
                  <button
                    key={token}
                    onClick={() => setSelectedToken(token as 'USDC' | 'USDT' | 'ETH')}
                    className={`p-3 rounded-lg border ${
                      selectedToken === token
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Bet Amount:</p>
              <p className="text-lg font-semibold">
                {getTokenAmount()} {selectedToken}
                <span className="text-sm text-gray-500 ml-2">(${BET_AMOUNT_USD})</span>
              </p>
              {selectedToken === 'ETH' && (
                <p className="text-xs text-gray-500 mt-1">
                  ETH Price: ${ethPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Game Status</h3>
            <div className="space-y-2">
              <p className="text-sm">
                Player 1: {gameState.player1.address === address ? 'You' : gameState.player1.address}
              </p>
              <p className="text-sm">
                Player 2: {gameState.player2.address === address ? 'You' : (gameState.player2.address || 'Waiting...')}
              </p>
              {gameState.winner !== null && (
                <p className="text-sm font-semibold text-green-600">
                  Winner: {gameState.winner === address ? 'You' : gameState.winner}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleBet(true)}
              disabled={loading}
              className={`p-4 rounded-lg text-white font-bold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Processing...' : 'Heads'}
            </button>
            <button
              onClick={() => handleBet(false)}
              disabled={loading}
              className={`p-4 rounded-lg text-white font-bold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? 'Processing...' : 'Tails'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
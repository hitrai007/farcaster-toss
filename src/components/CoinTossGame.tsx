'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { COIN_TOSS_GAME_ABI, COIN_TOSS_GAME_ADDRESS, ERC20_ABI, USDC_ADDRESS } from '../contracts/constants';
import toast, { Toaster } from 'react-hot-toast';
import { useWeb3Modal } from '@web3modal/wagmi/react';

interface GameState {
  player1: string;
  player2: string;
  player1Choice: boolean;
  player2Choice: boolean;
  token: string;
  isComplete: boolean;
  winner: string;
}

// Define a transaction type
type TransactionResponse = {
  hash: `0x${string}`;
  wait: () => Promise<any>;
};

export default function CoinTossGame() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [balanceUSDC, setBalanceUSDC] = useState<string>('0');
  const [manualBalanceOverride, setManualBalanceOverride] = useState<string>('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [bypassApproval, setBypassApproval] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [testGameState, setTestGameState] = useState<'none' | 'player1' | 'player2' | 'complete'>('none');
  const [testWinner, setTestWinner] = useState<string | null>(null);
  const { open } = useWeb3Modal();
  const [gameState, setGameState] = useState<'initial' | 'started' | 'joined' | 'complete'>('initial');
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(null);

  // Check if on Base Sepolia
  const isBaseSepoliaNetwork = chainId === 84532;

  // Log values for debugging
  console.log('Connected wallet:', isConnected ? 'Yes' : 'No', address);
  console.log('Chain ID:', chainId);
  console.log('Using USDC address:', USDC_ADDRESS);
  console.log('Using Game address:', COIN_TOSS_GAME_ADDRESS);

  // Contract reads
  const { data: gameStateData } = useReadContract({
    abi: COIN_TOSS_GAME_ABI,
    address: COIN_TOSS_GAME_ADDRESS,
    functionName: 'getGameState',
  }) as { data: GameState | undefined };

  // Get USDC balance
  const { data: balance, isError: balanceError, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    abi: ERC20_ABI,
    address: USDC_ADDRESS,
    functionName: 'balanceOf',
    args: [address || '0x0000000000000000000000000000000000000000'],
  });

  // Transaction receipt handling
  const { data: receipt, isError, isLoading: isConfirming } = useWaitForTransactionReceipt({ 
    hash: txHash 
  });

  // Contract writes
  const { writeContract: startGame } = useWriteContract();
  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: joinGame } = useWriteContract();

  // Force refresh balance
  const handleRefreshBalance = () => {
    refetchBalance();
    setRefreshKey(prev => prev + 1);
  };

  // Update USDC balance when available
  useEffect(() => {
    if (balance) {
      // Assuming 6 decimals for USDC
      setBalanceUSDC(((Number(balance) / 1000000)).toFixed(2));
    }
  }, [balance, refreshKey]);

  // Apply manual balance override if provided
  useEffect(() => {
    if (manualBalanceOverride && !isNaN(parseFloat(manualBalanceOverride))) {
      setBalanceUSDC(manualBalanceOverride);
    }
  }, [manualBalanceOverride]);

  // Clear transaction hash when confirmed
  useEffect(() => {
    if (receipt) {
      setTxHash(undefined);
    }
  }, [receipt]);

  // Debug info update
  useEffect(() => {
    const info = `
      Wallet connected: ${isConnected}
      Address: ${address || 'Not connected'}
      Chain ID: ${chainId}
      Is Base Sepolia: ${isBaseSepoliaNetwork}
      Balance loading: ${balanceLoading}
      Balance error: ${balanceError ? 'Yes' : 'No'}
      USDC Balance: ${balanceUSDC}
      Manual Override: ${manualBalanceOverride || 'None'}
      isLoading: ${isLoading}
      isConfirming: ${isConfirming}
      Balance < 0.1: ${parseFloat(balanceUSDC) < 0.1}
      USDC Address: ${USDC_ADDRESS}
      Game Address: ${COIN_TOSS_GAME_ADDRESS}
      Error: ${errorMessage || 'None'}
    `;
    setDebugInfo(info);
    console.log(info);
  }, [isConnected, address, chainId, isBaseSepoliaNetwork, balanceUSDC, isLoading, isConfirming, balanceLoading, balanceError, USDC_ADDRESS, COIN_TOSS_GAME_ADDRESS, manualBalanceOverride, errorMessage]);

  const notifyError = (message: string) => {
    setErrorMessage(message);
    toast.error(message, {
      duration: 15000, // 15 seconds
      style: {
        border: '1px solid #ff4b4b',
        padding: '16px',
        color: '#ff4b4b',
        maxWidth: '500px',
      },
      icon: '⚠️',
    });
    console.error(message);
  };

  const notifySuccess = (message: string) => {
    toast.success(message, {
      duration: 10000, // 10 seconds
      style: {
        border: '1px solid #4CAF50',
        padding: '16px',
        color: '#4CAF50',
        maxWidth: '500px',
      },
      icon: '✅',
    });
    console.log(message);
  };

  const clearError = () => {
    setErrorMessage('');
    toast.dismiss(); // Dismiss any active toasts
  };

  const handleStartGame = async (choice: boolean) => {
    // Clear any previous errors
    clearError();
    
    if (!isConnected) {
      await open();
      return;
    }

    if (!isBaseSepoliaNetwork) {
      notifyError('Please connect to Base Sepolia network (Chain ID: 84532)');
      return;
    }

    // Check for valid contract address
    if (!COIN_TOSS_GAME_ADDRESS || COIN_TOSS_GAME_ADDRESS === '0xUndefined' || 
        COIN_TOSS_GAME_ADDRESS.includes('your_deployed')) {
      notifyError('Game contract address is not configured');
      console.error('Invalid game contract address:', COIN_TOSS_GAME_ADDRESS);
      return;
    }

    // Check USDC balance
    if (parseFloat(balanceUSDC) < 0.1) {
      notifyError('Insufficient USDC balance. You need at least 0.1 USDC to play.');
      console.error('USDC balance too low:', balanceUSDC);
      return;
    }

    try {
      setIsLoading(true);
      const loadingToast = toast.loading('Processing transaction...', { duration: 60000 });
      
      // First approve USDC - 0.1 USDC (with 6 decimals)
      console.log('Approving USDC tokens...');
      try {
        if (!bypassApproval) {
          const hash = await approveToken({
            abi: ERC20_ABI,
            address: USDC_ADDRESS,
            functionName: 'approve',
            args: [COIN_TOSS_GAME_ADDRESS, BigInt(100000)], // 0.1 USDC with 6 decimals
          });
          
          if (hash === undefined) {
            toast.dismiss(loadingToast);
            throw new Error('Token approval transaction failed');
          }
          
          setTxHash(hash);
          toast.dismiss(loadingToast);
          notifySuccess(`Approval transaction submitted! Check wallet for confirmation.`);
          
          // Wait for transaction confirmation
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for confirmation
        } else {
          // Skip approval in testing mode
          notifySuccess("Bypassing token approval for testing");
          // Skip waiting in testing mode
        }
        
        // Now start the game
        console.log('Starting game...');
        const startGameToast = toast.loading('Starting game...', { duration: 60000 });
        
        // Log more details for debugging
        console.log('Game parameters:', {
          abi: COIN_TOSS_GAME_ABI,
          address: COIN_TOSS_GAME_ADDRESS,
          functionName: 'startGame',
          args: [choice, USDC_ADDRESS],
          bypassApproval
        });

        try {
          const startHash = await startGame({
            abi: COIN_TOSS_GAME_ABI,
            address: COIN_TOSS_GAME_ADDRESS,
            functionName: 'startGame',
            args: [choice, USDC_ADDRESS],
          });
          
          if (startHash === undefined) {
            toast.dismiss(startGameToast);
            throw new Error('Start game transaction failed');
          }
          setTxHash(startHash);
          toast.dismiss(startGameToast);
          notifySuccess(`Game started successfully! Check wallet for confirmation.`);
        } catch (err: any) {
          toast.dismiss(startGameToast);
          console.error('Game start error:', err);
          notifyError(`Game start failed: ${err.message || 'Unknown error'}`);
          return;
        }
      } catch (err: any) {
        toast.dismiss(loadingToast);
        console.error('Token approval error:', err);
        notifyError(`Token approval failed: ${err.message || 'Unknown error'}`);
        return;
      }
    } catch (err: any) {
      console.error('General error:', err);
      notifyError(`An error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (choice: boolean) => {
    if (!isConnected) {
      await open();
      return;
    }

    try {
      setIsLoading(true);
      setSelectedChoice(choice ? 'heads' : 'tails');

      const approvalHash = await approveToken({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS as `0x${string}`, BigInt(100000)],
      });

      if (approvalHash) {
        setTxHash(approvalHash);
        toast.success('Token approval submitted!');
        
        const joinHash = await joinGame({
          address: process.env.NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS as `0x${string}`,
          abi: COIN_TOSS_GAME_ABI,
          functionName: 'joinGame',
          args: [choice ? 0 : 1],
        });

        if (joinHash) {
          setTxHash(joinHash);
          setGameState('joined');
          toast.success('Game join submitted!');
        }
      }
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceClick = (choice: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void handleJoinGame(choice);
  };

  const handleTestStartGame = (choice: boolean) => {
    if (testMode) {
      setTestGameState('player1');
      notifySuccess(`Test game started with choice: ${choice ? 'Heads' : 'Tails'}`);
    }
  };

  const handleTestJoinGame = (choice: boolean) => {
    if (testMode && testGameState === 'player1') {
      setTestGameState('complete');
      setTestWinner(choice ? 'Heads' : 'Tails');
      notifySuccess(`Test game joined with choice: ${choice ? 'Heads' : 'Tails'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">
          Coin Toss Game
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Bet 0.1 USDC on heads or tails and test your luck!
        </p>

        {!isConnected ? (
          <div className="text-center">
            <button
              onClick={() => open()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {gameState === 'complete' ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                  Game Complete!
                </h2>
                <button
                  onClick={() => setGameState('initial')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center text-gray-800">
                  Choose Heads or Tails
                </h2>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleChoiceClick(true)}
                    disabled={isLoading || isConfirming}
                    className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Heads
                  </button>
                  <button
                    onClick={handleChoiceClick(false)}
                    disabled={isLoading || isConfirming}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Tails
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
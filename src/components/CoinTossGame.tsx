'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { COIN_TOSS_GAME_ABI, COIN_TOSS_GAME_ADDRESS, ERC20_ABI, USDC_ADDRESS } from '../contracts/constants';
import toast, { Toaster } from 'react-hot-toast';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { parseEther } from 'ethers';

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

interface CoinTossGameProps {
  initialChoice?: 'heads' | 'tails';
}

export default function CoinTossGame({ initialChoice }: CoinTossGameProps) {
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
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(initialChoice || null);
  const [activeGameId, setActiveGameId] = useState<string>('0');

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
  const { writeContract, writeContractAsync, data: txData } = useWriteContract();

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

  const handleStartGame = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Approve token first
      toast.loading('Approving USDC...');
      
      // Use writeContractAsync for the token approval
      const approveTxHash = await writeContractAsync({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [COIN_TOSS_GAME_ADDRESS, parseEther('0.1')],
      });
      
      if (approveTxHash) {
        setTxHash(approveTxHash);
        
        // Wait for the receipt
        const approveReceiptStatus = await new Promise(resolve => {
          const checkReceipt = setInterval(() => {
            if (!isConfirming) {
              clearInterval(checkReceipt);
              resolve(true);
            }
          }, 1000);
          
          // Timeout after 60 seconds
          setTimeout(() => {
            clearInterval(checkReceipt);
            resolve(false);
          }, 60000);
        });
        
        if (approveReceiptStatus) {
          toast.success('USDC approved successfully');
          
          // Then start the game
          toast.loading('Starting game...');
          
          // Use regular writeContract for starting the game
          await writeContractAsync({
            address: COIN_TOSS_GAME_ADDRESS,
            abi: COIN_TOSS_GAME_ABI,
            functionName: 'startGame',
            args: [true, USDC_ADDRESS],
          },
          {
            onSuccess: (data: `0x${string}`) => {
              setTxHash(data);
              toast.success('Game starting...');
              setGameState('started');
              
              // Extract the gameId when the transaction is confirmed
              const checkGameId = setInterval(() => {
                if (!isConfirming && receipt) {
                  clearInterval(checkGameId);
                  if (receipt?.logs?.length > 0) {
                    setActiveGameId(receipt.logs[0]?.topics?.[1] || '0');
                  }
                  toast.success('Game started successfully');
                }
              }, 1000);
              
              // Timeout after 60 seconds
              setTimeout(() => clearInterval(checkGameId), 60000);
            },
            onError: (error: Error) => {
              console.error('Start Game Error:', error);
              notifyError(`Failed to start game: ${error.message}`);
              setIsLoading(false);
              toast.dismiss(); 
            },
          });
        } else {
          toast.error('USDC approval timed out');
        }
      }
    } catch (error: any) {
      console.error('Error during game start process:', error);
      notifyError(`An error occurred: ${error.message}`);
      setIsLoading(false);
      toast.dismiss(); 
    }
  };

  // Add check for URL parameters on component mount
  useEffect(() => {
    const handleFrameRedirect = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const choice = searchParams.get('choice');
        const action = searchParams.get('action');
        
        if (action === 'placeBet' && choice) {
          const choiceNum = choice === 'heads' ? 0 : 1;
          toast.loading('Placing your bet...', { id: 'bet-toast' });
          await handleJoinGame(activeGameId || '0', choiceNum);
        }
      } catch (error) {
        console.error('Error handling frame redirect:', error);
        toast.error('Failed to place bet automatically');
      }
    };

    if (typeof window !== 'undefined') {
      handleFrameRedirect();
    }
  }, [address]); // Add address as dependency to ensure wallet is connected

  const handleJoinGame = async (gameId: string, choice: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Approve token first
      toast.loading('Approving token...', { id: 'approveToken' });
      
      // Use writeContractAsync for token approval
      const approveTxHash = await writeContractAsync({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [COIN_TOSS_GAME_ADDRESS, parseEther('0.1')],
      });
      
      if (!approveTxHash) {
        toast.error('Token approval failed', { id: 'approveToken' });
        setIsLoading(false);
        return;
      }
      
      setTxHash(approveTxHash);
      
      // Wait for approval to be confirmed
      const approveReceiptStatus = await new Promise(resolve => {
        const checkReceipt = setInterval(() => {
          if (!isConfirming) {
            clearInterval(checkReceipt);
            resolve(true);
          }
        }, 1000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkReceipt);
          resolve(false);
        }, 30000);
      });
      
      if (!approveReceiptStatus) {
        toast.error('Approval confirmation timed out', { id: 'approveToken' });
        setIsLoading(false);
        return;
      }
      
      toast.success('Token approved!', { id: 'approveToken' });
      toast.loading('Joining game...', { id: 'joinGame' });
      
      // Use writeContract for joining the game
      writeContract({
        address: COIN_TOSS_GAME_ADDRESS as `0x${string}`,
        abi: COIN_TOSS_GAME_ABI,
        functionName: 'joinGame',
        args: [choice === 0, USDC_ADDRESS],
      }, {
        onSuccess(data) {
          setTxHash(data);
          toast.success('Joining game...', { id: 'joinGame' });
          
          // Check for transaction confirmation
          const checkJoinStatus = setInterval(() => {
            if (!isConfirming) {
              clearInterval(checkJoinStatus);
              toast.success('Joined game successfully!', { id: 'joinGame' });
              setGameState('joined');
              setSelectedChoice(choice === 0 ? 'heads' : 'tails');
            }
          }, 1000);
          
          // Timeout after 60 seconds
          setTimeout(() => clearInterval(checkJoinStatus), 60000);
        },
        onError(error) {
          console.error('Error joining game:', error);
          toast.error(`Failed to join game: ${error.message}`, { id: 'joinGame' });
        }
      });
    } catch (error: any) {
      console.error('Error in transaction:', error);
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Find where the handleChoiceClick function is defined and update it
  const handleChoiceClick = (choice: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const gameId = activeGameId || '0'; // Use activeGameId if available or default to '0'
    handleJoinGame(gameId, choice);
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

  // Handle initialChoice if provided
  useEffect(() => {
    if (initialChoice && isConnected && gameState === 'initial' && !isLoading) {
      console.log(`Automatically placing bet on ${initialChoice}`);
      const choiceNum = initialChoice === 'heads' ? 0 : 1;
      handleJoinGame(activeGameId || '0', choiceNum);
    }
  }, [initialChoice, isConnected, gameState, isLoading]);

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
                    onClick={() => handleJoinGame(activeGameId || '0', 0)}
                    disabled={isLoading || isConfirming}
                    className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Heads
                  </button>
                  <button
                    onClick={() => handleJoinGame(activeGameId || '0', 1)}
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
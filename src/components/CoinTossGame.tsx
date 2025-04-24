'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { COIN_TOSS_GAME_ABI, COIN_TOSS_GAME_ADDRESS, ERC20_ABI, USDC_ADDRESS } from '../contracts/constants';
import toast, { Toaster } from 'react-hot-toast';

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

  // Check if on Base Sepolia
  const isBaseSepoliaNetwork = chainId === 84532;

  // Log values for debugging
  console.log('Connected wallet:', isConnected ? 'Yes' : 'No', address);
  console.log('Chain ID:', chainId);
  console.log('Using USDC address:', USDC_ADDRESS);
  console.log('Using Game address:', COIN_TOSS_GAME_ADDRESS);

  // Contract reads
  const { data: gameState } = useReadContract({
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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash: txHash });

  // Contract writes
  const { writeContract: startGame } = useWriteContract();
  const { writeContract: joinGame } = useWriteContract();
  const { writeContract: approveToken } = useWriteContract();

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
    if (isConfirmed) {
      setTxHash(undefined);
    }
  }, [isConfirmed]);

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
      notifyError('Please connect your wallet');
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
        console.error('Transaction error:', err);
        notifyError(`Transaction failed: ${err.message || 'Unknown error'}`);
        return;
      }
    } catch (error: any) {
      console.error('Error in game flow:', error);
      if (error.message?.includes('User denied')) {
        notifyError('Transaction was rejected by user');
      } else if (error.message?.includes('already processing')) {
        notifyError('Please complete the previous transaction first');
      } else {
        notifyError('Failed to complete action: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (choice: boolean) => {
    // Clear any previous errors
    clearError();
    
    if (!isConnected) {
      notifyError('Please connect your wallet');
      return;
    }

    if (!isBaseSepoliaNetwork) {
      notifyError('Please connect to Base Sepolia network (Chain ID: 84532)');
      return;
    }

    if (!gameState?.player1) {
      notifyError('No game to join');
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
        
        // Now join the game
        console.log('Joining game...');
        const joinGameToast = toast.loading('Joining game...', { duration: 60000 });
        
        // Log more details for debugging
        console.log('Join Game parameters:', {
          abi: COIN_TOSS_GAME_ABI,
          address: COIN_TOSS_GAME_ADDRESS,
          functionName: 'joinGame',
          args: [choice, USDC_ADDRESS],
          bypassApproval
        });

        try {
          const joinHash = await joinGame({
            abi: COIN_TOSS_GAME_ABI,
            address: COIN_TOSS_GAME_ADDRESS,
            functionName: 'joinGame',
            args: [choice, USDC_ADDRESS],
          });
          
          if (joinHash === undefined) {
            toast.dismiss(joinGameToast);
            throw new Error('Join game transaction failed');
          }
          setTxHash(joinHash);
          toast.dismiss(joinGameToast);
          notifySuccess(`Joined game successfully! Check wallet for confirmation.`);
        } catch (err: any) {
          toast.dismiss(joinGameToast);
          console.error('Join game error:', err);
          notifyError(`Join game failed: ${err.message || 'Unknown error'}`);
          return;
        }
      } catch (err: any) {
        console.error('Transaction error:', err);
        notifyError(`Transaction failed: ${err.message || 'Unknown error'}`);
        return;
      }
    } catch (error: any) {
      console.error('Error in game flow:', error);
      if (error.message?.includes('User denied')) {
        notifyError('Transaction was rejected by user');
      } else if (error.message?.includes('already processing')) {
        notifyError('Please complete the previous transaction first');
      } else {
        notifyError('Failed to complete action: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestStartGame = (choice: boolean) => {
    clearError();
    notifySuccess(`Test Mode: Started game with choice: ${choice ? 'Heads' : 'Tails'}`);
    
    // Simulate a successful game start
    setTimeout(() => {
      notifySuccess("Test Mode: Game created successfully!");
    }, 2000);
  };

  const handleTestJoinGame = (choice: boolean) => {
    clearError();
    notifySuccess(`Test Mode: Joined game with choice: ${choice ? 'Heads' : 'Tails'}`);
    
    // Simulate a successful game join and result
    setTimeout(() => {
      notifySuccess("Test Mode: Game completed successfully!");
    }, 2000);
  };

  // Create a mock game state based on test settings
  const mockGameState = testMode && testGameState !== 'none' ? {
    player1: testGameState === 'player1' || testGameState === 'player2' || testGameState === 'complete' ? address || '0x123' : '',
    player2: testGameState === 'player2' || testGameState === 'complete' ? '0x456' : '',
    player1Choice: true,
    player2Choice: false,
    token: USDC_ADDRESS,
    isComplete: testGameState === 'complete',
    winner: testGameState === 'complete' ? (testWinner || address || '0x123') : '',
  } : undefined;

  // Use the mock game state when in test mode
  const effectiveGameState = testMode ? mockGameState : gameState;

  return (
    <div className="space-y-6">
      {/* Toast container */}
      <Toaster position="top-center" />
      
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Coin Toss Game</h2>
        <p className="text-gray-600 mb-4">Bet 0.1 USDC on Heads or Tails</p>
        
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded">
          <label className="flex items-center justify-center space-x-2">
            <input 
              type="checkbox" 
              checked={testMode} 
              onChange={(e) => setTestMode(e.target.checked)}
              className="form-checkbox h-5 w-5 text-yellow-600"
            />
            <span className="text-yellow-800 font-medium">Testing Mode (Bypass Smart Contract Calls)</span>
          </label>
        </div>
        
        {!isBaseSepoliaNetwork && isConnected && (
          <p className="text-red-500 mb-2">Please connect to Base Sepolia network (Chain ID: 84532)</p>
        )}
        {isConnected && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Your USDC Balance: {balanceUSDC}</p>
            <button 
              onClick={handleRefreshBalance}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mb-2">
              Refresh Balance
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4 flex justify-between items-center">
          <div>Error: {errorMessage}</div>
          <button 
            onClick={clearError}
            className="bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-2 rounded text-xs">
            Clear
          </button>
        </div>
      )}

      {!effectiveGameState?.player1 ? (
        <div className="space-y-4">
          <p className="text-center">Start a new game by choosing Heads or Tails</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={testMode ? () => handleTestStartGame(true) : () => handleStartGame(true)}
              disabled={!testMode && (isLoading || isConfirming || parseFloat(balanceUSDC) < 0.1 || !isBaseSepoliaNetwork)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Heads {testMode && '(Test)'}
            </button>
            <button
              onClick={testMode ? () => handleTestStartGame(false) : () => handleStartGame(false)}
              disabled={!testMode && (isLoading || isConfirming || parseFloat(balanceUSDC) < 0.1 || !isBaseSepoliaNetwork)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Tails {testMode && '(Test)'}
            </button>
          </div>
        </div>
      ) : effectiveGameState.player2 ? (
        <div className="text-center">
          <p className="text-lg font-semibold">
            {effectiveGameState.isComplete
              ? `Winner: ${effectiveGameState.winner === address ? 'You' : 'Opponent'}`
              : 'Waiting for toss result...'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center">Join the game by choosing Heads or Tails</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={testMode ? () => handleTestJoinGame(true) : () => handleJoinGame(true)}
              disabled={!testMode && (isLoading || isConfirming || parseFloat(balanceUSDC) < 0.1 || !isBaseSepoliaNetwork)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Heads {testMode && '(Test)'}
            </button>
            <button
              onClick={testMode ? () => handleTestJoinGame(false) : () => handleJoinGame(false)}
              disabled={!testMode && (isLoading || isConfirming || parseFloat(balanceUSDC) < 0.1 || !isBaseSepoliaNetwork)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Tails {testMode && '(Test)'}
            </button>
          </div>
        </div>
      )}

      {isConfirming && (
        <div className="text-center text-yellow-600">
          Confirming transaction...
        </div>
      )}
      
      {/* Debug information section */}
      <div className="mt-8 text-xs text-left border border-gray-300 rounded p-2 whitespace-pre-wrap bg-gray-50">
        <details>
          <summary className="font-medium text-gray-700 cursor-pointer">Debug Information</summary>
          {debugInfo}
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="font-medium">Manual Balance Override (for testing):</p>
            <input 
              type="text" 
              value={manualBalanceOverride} 
              onChange={(e) => setManualBalanceOverride(e.target.value)}
              placeholder="Enter balance (e.g. 10.0)" 
              className="border border-gray-300 rounded px-2 py-1 mt-1 w-full"
            />
            <button 
              onClick={() => setManualBalanceOverride('')}
              className="mt-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
              Clear Override
            </button>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="font-medium">Testing Options:</p>
            <div className="flex items-center mt-2">
              <input 
                type="checkbox" 
                id="bypassApproval" 
                checked={bypassApproval}
                onChange={(e) => setBypassApproval(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="bypassApproval" className="mr-4">Bypass Token Approval</label>
              
              <button 
                onClick={clearError}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-xs ml-2">
                Clear Errors
              </button>
              
              <button 
                onClick={handleRefreshBalance}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-xs ml-2">
                Refresh Data
              </button>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="font-medium">Test Game State:</p>
            <div className="flex flex-wrap items-center mt-1 gap-2">
              <button 
                onClick={() => setTestGameState('none')}
                className={`text-xs px-2 py-1 rounded ${testGameState === 'none' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                No Game
              </button>
              <button 
                onClick={() => setTestGameState('player1')}
                className={`text-xs px-2 py-1 rounded ${testGameState === 'player1' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                Player 1 Only
              </button>
              <button 
                onClick={() => setTestGameState('player2')}
                className={`text-xs px-2 py-1 rounded ${testGameState === 'player2' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                Player 1 & 2
              </button>
              <button 
                onClick={() => {
                  setTestGameState('complete');
                  setTestWinner(address || '0x123');
                }}
                className={`text-xs px-2 py-1 rounded ${testGameState === 'complete' && testWinner === address ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                You Win
              </button>
              <button 
                onClick={() => {
                  setTestGameState('complete');
                  setTestWinner('0x456');
                }}
                className={`text-xs px-2 py-1 rounded ${testGameState === 'complete' && testWinner !== address ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                You Lose
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ethers } from 'ethers';
import CoinTossGameABI from '@/abis/CoinTossGame_ABI.json';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import toast, { Toaster } from 'react-hot-toast';

// Import CoinTossGame type as a type-only import
import type { CoinTossGame } from '../types'; // Fix for import conflict

// Contract address
export const CONTRACT_ADDRESS = '0x34A9785D18e9a15d2d60C2ac99D3535041111A56';
const CONTRACT_OWNER = '0xe6DE23FF0664F79F38dC068147CFE15c61755f3c'.toLowerCase();

// Add RPC URL constant
const RPC_URL = "https://base-sepolia.publicnode.com";

// Add USDT token address and ABI
const USDT_ADDRESS = '0xEF37f57D8a64Fd6EdF2184Ad4b2c4Cd718ec4538';
const USDT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Add MockUSDT ABI with mint function
const MOCK_USDT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Add bet amount constant to match contract
const BET_AMOUNT = ethers.parseUnits("0.1", 6); // 0.1 mUSDT with 6 decimals (100,000 units)

// Utility function to shorten address
const shortenAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

// Get provider from browser
function getBrowserProvider(): ethers.BrowserProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const eth = (window as any).ethereum;
  if (!eth || typeof eth.request !== 'function') {
    return null;
  }
  return new ethers.BrowserProvider(eth, {
    name: "Base Sepolia",
    chainId: 84532
  });
}

// Helper function to handle toast notifications for transactions
async function handleTxToast(tx: ethers.ContractTransactionResponse, actionLabel: string) {
  const explorerLink = `https://sepolia.basescan.org/tx/${tx.hash}`;
  
  // Show pending toast
  const pendingToast = toast.loading(
    <span>
      ⏳ {actionLabel} (Pending)<br />
      <a
        href={explorerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600 hover:text-blue-800"
      >
        View on BaseScan ↗
      </a>
    </span>
  );

  try {
    await tx.wait();
    toast.success(
      <span>
        ✅ {actionLabel}<br />
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 hover:text-blue-800"
        >
          View on BaseScan ↗
        </a>
      </span>,
      { 
        id: pendingToast,
        duration: 5000 
      }
    );
  } catch (err) {
    console.error(err);
    toast.error(`❌ ${actionLabel} failed`, { 
      id: pendingToast,
      duration: 5000 
    });
  }
}

// Helper function to get contract with signer
async function getContractWithSigner(): Promise<CoinTossGame | null> {
  const provider = getBrowserProvider();
  if (!provider) return null;
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, signer) as CoinTossGame;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function CoinTossGame() {
  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Component state hooks - all declared unconditionally at the top
  const [mounted, setMounted] = useState(false);
  const [tossNumber, setTossNumber] = useState(1);
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [sideToShow, setSideToShow] = useState<'heads' | 'tails'>('heads');
  const [statusMessage, setStatusMessage] = useState('Choose your side');
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add new state for local winner determination
  const [localWinner, setLocalWinner] = useState<string | null>(null);
  const [localWinningSide, setLocalWinningSide] = useState<'heads' | 'tails' | null>(null);

  // Derived state
  const isWinner = address && winner && address.toLowerCase() === winner.toLowerCase();
  const isOwner = address && address.toLowerCase() === CONTRACT_OWNER;

  // Define fetchGameState at component scope
  const fetchGameState = async () => {
    if (!isConnected) return;
    
    try {
      const provider = getBrowserProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider) as CoinTossGame;
      const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
      
      const p1Data = p1 !== ethers.ZeroAddress ? { address: p1, choice: p1Choice ? 'heads' : 'tails' } : null;
      const p2Data = p2 !== ethers.ZeroAddress ? { address: p2, choice: p2Choice ? 'heads' : 'tails' } : null;
      
      setPlayer1(p1Data);
      setPlayer2(p2Data);
      setWinner(winAddr === ethers.ZeroAddress ? null : winAddr);
      setTossNumber(Number(toss));

      // Update status message based on game state
      if (winAddr && winAddr !== ethers.ZeroAddress) {
        const winnerChoice = p1Data?.address.toLowerCase() === winAddr.toLowerCase() ? p1Data?.choice : p2Data?.choice;
        setStatusMessage(`Winner: ${shortenAddress(winAddr)} (${winnerChoice?.toUpperCase()})`);
        setSideToShow(winnerChoice as 'heads' | 'tails');
      } else if (!p1Data) {
        setStatusMessage('Choose your side');
      } else if (!p2Data) {
        const availableSide = p1Choice ? 'TAILS' : 'HEADS';
        setStatusMessage(`Waiting for Player 2 to bet on ${availableSide}`);
      } else if (!winAddr || winAddr === ethers.ZeroAddress) {
        setStatusMessage('Flipping the coin...');
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  };

  // Effect for mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect for fetching game state
  useEffect(() => {
    if (isConnected) {
      fetchGameState();
    }
  }, [isConnected, address]);

  // Add memoized contract instance
  const contractInstance = useMemo(() => {
    console.log('Creating contract instance with address:', CONTRACT_ADDRESS);
    try {
      // Create provider with network configuration
      const provider = new ethers.JsonRpcProvider(RPC_URL, {
        name: "Base Sepolia",
        chainId: 84532
      });
      
      // Create the contract instance with the provider
      const instance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CoinTossGameABI,
        provider
      ) as unknown as CoinTossGame;
      
      // Log the contract details
      console.log('Contract instance details:', {
        address: instance.target,
        hasRunner: !!instance.runner,
        isProvider: instance.runner instanceof ethers.JsonRpcProvider
      });
      
      return instance;
    } catch (error) {
      console.error('Error creating contract instance:', error);
      return null;
    }
  }, []);

  // Add logging to verify contract props
  useEffect(() => {
    if (contractInstance) {
      console.log('Contract instance verification:', {
        address: contractInstance.target,
        hasRunner: !!contractInstance.runner,
        isProvider: contractInstance.runner instanceof ethers.JsonRpcProvider
      });
    } else {
      console.warn('No contract instance available');
    }
  }, [contractInstance]);

  if (!mounted) {
    return null;
  }

  const handleBet = async (side: 'heads' | 'tails') => {
    try {
      setLoading(true);
      const provider = getBrowserProvider();
      if (!provider) throw new Error('No provider available');
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check USDT allowance first
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
      console.log('Current allowance:', ethers.formatUnits(allowance, 6), 'mUSDT');
      
      if (allowance < BET_AMOUNT) {
        setStatusMessage('Approving mUSDT...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, BET_AMOUNT);
        await handleTxToast(approveTx, 'Approving mUSDT');
        await approveTx.wait();
        
        // Check allowance after approval
        const newAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        console.log('New allowance after approval:', ethers.formatUnits(newAllowance, 6), 'mUSDT');
      }

      // Check mUSDT balance
      const balance = await usdtContract.balanceOf(userAddress);
      console.log('Current balance:', ethers.formatUnits(balance, 6), 'mUSDT');
      console.log('Required bet amount:', ethers.formatUnits(BET_AMOUNT, 6), 'mUSDT');
      
      if (balance < BET_AMOUNT) {
        throw new Error(`Insufficient mUSDT balance. You need 0.1 mUSDT to play.`);
      }

      // Place bet on the contract
      setStatusMessage(`Placing bet on ${side.toUpperCase()}...`);
      const contract = await getContractWithSigner();
      if (!contract) throw new Error('No contract available');
      const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
      const isPlayer2Bet = p1 !== ethers.ZeroAddress && p2 === ethers.ZeroAddress;
      
      let retryCount = 0;
      let tx: ethers.ContractTransactionResponse | undefined;
      
      while (retryCount < MAX_RETRIES) {
        try {
          tx = await contract.placeBet(side === 'heads') as ethers.ContractTransactionResponse;
          console.log('Transaction sent:', tx.hash);
          break;
        } catch (err: any) {
          retryCount++;
          if (retryCount === MAX_RETRIES) {
            throw err;
          }
          console.log(`Transaction attempt ${retryCount} failed, retrying in ${RETRY_DELAY/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      if (!tx) {
        throw new Error('Failed to send transaction after multiple attempts');
      }
      
      const explorerLink = `https://sepolia.basescan.org/tx/${tx.hash}`;
      const pendingToast = toast.loading(
        <span>
          ⏳ Placing bet on {side.toUpperCase()}<br />
          <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
            View on BaseScan ↗
          </a>
        </span>
      );

      try {
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        if (isPlayer2Bet) {
          // Show betting complete message
          setStatusMessage("Both bets placed! Get ready...");
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Show coin flip sequence with animation
          setStatusMessage("Flipping the coin...");
          // Start coin flip animation by alternating sides
          const flipInterval = setInterval(() => {
            setSideToShow(prev => prev === 'heads' ? 'tails' : 'heads');
          }, 150);
          
          // Determine winner locally using the same method as smart contract
          const block = await provider.getBlock('latest');
          if (!block) throw new Error('Failed to get latest block');
          const result = Number(ethers.keccak256(
            ethers.solidityPacked(
              ['uint256', 'uint256'],
              [block.timestamp, block.prevRandao]
            )
          )) % 2;
          const isHeads = result === 0;
          const winner = isHeads === p1Choice ? p1 : p2;
          
          // Wait for animation
          await new Promise(resolve => setTimeout(resolve, 2000));
          clearInterval(flipInterval);
          
          // Show winner
          setLocalWinner(winner);
          setLocalWinningSide(isHeads ? 'heads' : 'tails');
          setSideToShow(isHeads ? 'heads' : 'tails');
          setStatusMessage(`🎉 Winner: ${shortenAddress(winner)} with ${isHeads ? 'HEADS' : 'TAILS'}! 🎉`);
          
          // Show winner toast
          toast.success(
            <span>
              🏆 Winner determined!<br />
              • Winner: {shortenAddress(winner)}<br />
              • Winning side: {isHeads ? 'HEADS' : 'TAILS'}<br />
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                View transaction ↗
              </a>
            </span>,
            { duration: 7000 }
          );
          
          // Wait to show winner
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Show game reset message
          setStatusMessage("Starting new game...");
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Final state update
          await fetchGameState();
          setStatusMessage("Choose your side");
        } else {
          // Regular success toast for Player 1
          toast.success(
            <span>
              ✅ Bet placed on {side.toUpperCase()}<br />
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                View on BaseScan ↗
              </a>
            </span>,
            { 
              id: pendingToast,
              duration: 5000 
            }
          );
          
          // Update state for Player 1's bet
          await fetchGameState();
          setStatusMessage("Waiting for Player 2...");
        }
      } catch (err: any) {
        console.error(err);
        if (err.receipt && err.receipt.status === 0) {
          toast.error("Transaction failed. Please try again.", { 
            id: pendingToast,
            duration: 5000 
          });
        } else {
          toast.error(`❌ Failed to place bet`, { 
            id: pendingToast,
            duration: 5000 
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Insufficient mUSDT balance')) {
        toast.error(err.message);
      } else if (err.message.includes('user rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error('Failed to place bet. Please try again.');
      }
      // Reset status on error
      await fetchGameState();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a button should be disabled
  const isButtonDisabled = (side: 'heads' | 'tails') => {
    if (loading || !isConnected || winner) return true;
    
    // If player1 exists and chose this side, button should be disabled
    if (player1?.choice === side) return true;
    
    // If player2 exists and chose this side, button should be disabled
    if (player2?.choice === side) return true;
    
    // If both players have placed bets, all buttons should be disabled
    if (player1 && player2) return true;
    
    // If player1 exists and current user is not player2, disable all buttons
    if (player1 && address && player1.address.toLowerCase() === address.toLowerCase()) return true;
    
    return false;
  };

  // Keep handleOwnerReset as emergency reset only
  const handleOwnerReset = async () => {
    try {
      setLoading(true);
      
      // Verify the caller is the contract owner
      if (address?.toLowerCase() !== CONTRACT_OWNER) {
        throw new Error('Only the contract deployer can reset the game');
      }
      
      const contract = await getContractWithSigner();
      if (!contract) throw new Error('No contract available');
      setStatusMessage("Force resetting game...");
      const resetTx = await contract.resetGame();
      await handleTxToast(resetTx, 'Game Force Reset');
      await resetTx.wait();
      await fetchGameState();
      setStatusMessage("Choose your side");
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || 'Failed to reset game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-black font-mono">
      <Toaster />
      {/* Wallet Connect UI */}
      <div className="mb-4">
        {isConnected ? (
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-600">Connected: {shortenAddress(address!)}</span>
            <button 
              onClick={() => disconnect()} 
              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={() => open()} className="px-4 py-2 bg-black text-white rounded">
            Connect Wallet
          </button>
        )}
      </div>

      {/* Toss # + Info */}
      <div className="flex items-center justify-between gap-2 w-full max-w-md mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Toss #{tossNumber}</h2>
          {isOwner && (
            <button 
              onClick={handleOwnerReset}
              disabled={loading}
              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Game
            </button>
          )}
        </div>
        <button onClick={() => setShowInfo(true)} className="rounded-full text-sm w-6 h-6 border font-bold">i</button>
      </div>

      {/* Coin */}
      <motion.div
        className="w-36 h-36 border-4 border-black rounded-full flex items-center justify-center bg-gray-100 shadow-inner"
        animate={{ 
          rotateX: statusMessage === "Flipping the coin..." ? [0, 360, 720, 1080] : 0,
          rotateY: statusMessage === "Flipping the coin..." ? [0, 360, 720, 1080] : 0
        }}
        transition={{
          duration: 2,
          repeat: statusMessage === "Flipping the coin..." ? Infinity : 0,
          ease: "linear"
        }}
      >
        <Image
          src={`/assets/coin-${sideToShow}.png`}
          alt="coin"
          width={500}
          height={500}
          className="w-full h-full object-contain rounded-full"
        />
      </motion.div>

      <p className="mt-4 text-lg font-medium min-h-[24px]">{statusMessage}</p>

      {/* Bet Buttons */}
      <div className="flex gap-6 mt-6 w-full max-w-sm">
        {(['heads', 'tails'] as const).map((side) => {
          const player =
            player1?.choice === side ? player1 : player2?.choice === side ? player2 : null;

          return (
            <button
              key={side}
              className={`flex-1 px-4 py-3 text-white text-lg rounded-lg font-bold min-h-[64px] ${
                side === 'heads' ? 'bg-green-500' : 'bg-blue-500'
              } ${isButtonDisabled(side) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
              onClick={() => handleBet(side)}
              disabled={isButtonDisabled(side)}
            >
              {player ? `Bet by ${shortenAddress(player.address)}` : side.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white text-black p-6 rounded-lg max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-3">How it works</h2>
            <ul className="list-disc list-inside text-sm space-y-2">
              <li>Two players place a bet of 0.1 USDT</li>
              <li>Player 1 chooses HEADS or TAILS</li>
              <li>Player 2 joins with the opposite</li>
              <li>The coin flips and winner gets all the monies</li>
              <li>1% Platform fee is taken (wen airdrop? o_O)</li>
              <li>Smart contract is transparent & verified</li>
            </ul>
            <div className="mt-4 text-right">
              <button onClick={() => setShowInfo(false)} className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

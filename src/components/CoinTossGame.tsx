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
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x34A9785D18e9a15d2d60C2ac99D3535041111A56';
const CONTRACT_OWNER = '0xe6DE23FF0664F79F38dC068147CFE15c61755f3c'.toLowerCase();

// Add RPC URL constant
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://base-sepolia.publicnode.com";

// Add USDT token address and ABI
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xEF37f57D8a64Fd6EdF2184Ad4b2c4Cd718ec4538';
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

// Add proper types
interface GameState {
  gameId: number;
  p1: string;
  p2: string;
  p1Choice: number;
  p2Choice: number;
  amount: number;
  winner: string;
  winningSide: number;
  toss: number;
  status: number;
}

// Add proper types for player data
interface PlayerData {
  address: string;
  choice: 'heads' | 'tails';
}

export default function CoinTossGame() {
  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Component state hooks - all declared unconditionally at the top
  const [mounted, setMounted] = useState(false);
  const [tossNumber, setTossNumber] = useState(1);
  const [player1, setPlayer1] = useState<PlayerData | null>(null);
  const [player2, setPlayer2] = useState<PlayerData | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [sideToShow, setSideToShow] = useState<'heads' | 'tails'>('heads');
  const [statusMessage, setStatusMessage] = useState('Choose your side');
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add state for error handling
  const [error, setError] = useState<string>('');

  // Derived state
  const isOwner = address && address.toLowerCase() === CONTRACT_OWNER;

  // Define fetchGameState at component scope
  const fetchGameState = async () => {
    if (!isConnected) return;
    
    try {
      const provider = getBrowserProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CoinTossGameABI, provider) as CoinTossGame;
      const [p1, p2, p1Choice, p2Choice, winAddr, toss] = await contract.getState();
      
      const p1Data = p1 !== ethers.ZeroAddress ? { 
        address: p1, 
        choice: p1Choice ? 'heads' as const : 'tails' as const 
      } : null;
      const p2Data = p2 !== ethers.ZeroAddress ? { 
        address: p2, 
        choice: p2Choice ? 'heads' as const : 'tails' as const 
      } : null;
      
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
  }, [isConnected, address, fetchGameState]);

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

  // Fix toast configuration
  const handleTransaction = (transaction: { hash: string }) => {
    console.log('Transaction hash:', transaction.hash);
    toast.success('Transaction sent!');
  };

  // Fix contract interaction
  const handleBet = async (side: 'heads' | 'tails') => {
    try {
      setLoading(true);
      const contract = await getContractWithSigner();
      if (!contract) throw new Error('No contract available');
      
      const isHeads = side === 'heads';
      const tx = await contract.placeBet(isHeads);
      await handleTransaction(tx);
      await tx.wait();
      await fetchGameState();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error);
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
}
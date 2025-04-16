'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useAccount } from 'wagmi';

interface FarcasterContextType {
  isConnected: boolean;
  user: any;
  isReady: boolean;
  error: string | null;
}

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('Initializing Farcaster SDK...');
        sdk.actions.ready();
        setIsReady(true);
        console.log('Farcaster SDK initialized successfully');

        // Check if we're in a Farcaster frame
        const isInFrame = window.location !== window.parent.location;
        if (isInFrame) {
          console.log('Running in Farcaster frame');
          // The user data will be received through the message event
          const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'farcaster:user') {
              console.log('Farcaster user data received:', event.data.user);
              setIsConnected(true);
              setUser(event.data.user);
              window.removeEventListener('message', handleMessage);
            }
          };
          window.addEventListener('message', handleMessage);
        }

        // If we have a connected wallet, check for Farcaster account
        if (address) {
          console.log('Wallet connected, checking for Farcaster account...');
          // The user data will be received through the message event
          const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'farcaster:user') {
              console.log('Farcaster account found for wallet:', event.data.user);
              setIsConnected(true);
              setUser(event.data.user);
              window.removeEventListener('message', handleMessage);
            }
          };
          window.addEventListener('message', handleMessage);
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        setError('Failed to initialize Farcaster SDK');
      }
    };

    initializeFarcaster();
  }, [address]);

  return (
    <FarcasterContext.Provider value={{ isConnected, user, isReady, error }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
} 
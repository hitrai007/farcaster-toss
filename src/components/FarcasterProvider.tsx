'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface FarcasterContextType {
  isConnected: boolean;
  user: any;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize the SDK
    sdk.actions.ready();
    setIsReady(true);

    // Set up frame message listener
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      if (event.data?.type === 'farcaster:user') {
        const userData = event.data.user;
        if (userData) {
          setIsConnected(true);
          setUser(userData);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const connect = async () => {
    try {
      console.log('Connecting to Farcaster...');
      // Open the Farcaster sign-in page
      await sdk.actions.openUrl('https://warpcast.com/~/sign-in');
      console.log('Opened sign-in page');

      // Wait for the user data to be received through the message event
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Farcaster sign in timed out. Please try again.'));
        }, 30000); // Increased timeout to 30 seconds

        const messageHandler = (event: MessageEvent) => {
          console.log('Message handler received:', event.data);
          if (event.data?.type === 'farcaster:user') {
            const userData = event.data.user;
            if (userData) {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              setIsConnected(true);
              setUser(userData);
              resolve();
            }
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      throw new Error('Failed to connect to Farcaster. Please try again.');
    }
  };

  const disconnect = async () => {
    try {
      setIsConnected(false);
      setUser(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <FarcasterContext.Provider value={{ isConnected, user, connect, disconnect, isReady }}>
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
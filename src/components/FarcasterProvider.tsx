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

    // Set up frame message listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'farcaster:user') {
        const userData = event.data.user;
        if (userData) {
          setIsConnected(true);
          setUser(userData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    setIsReady(true);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const connect = async () => {
    try {
      // Request user data from the frame
      await sdk.actions.requestUser({
        nonce: Math.random().toString(36).substring(2, 15),
        siweUri: window.location.origin,
        domain: window.location.hostname,
        statement: 'Sign in with Farcaster to play Coin Toss'
      });

      // Wait for the user data to be received through the message event
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Farcaster sign in timed out'));
        }, 10000);

        const messageHandler = (event: MessageEvent) => {
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
      throw error;
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
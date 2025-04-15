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
    
    // Mark the app as ready
    setIsReady(true);
    sdk.actions.ready();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const connect = async () => {
    try {
      // Request user data from the frame
      sdk.actions.requestUser();
    } catch (error) {
      console.error('Failed to connect:', error);
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
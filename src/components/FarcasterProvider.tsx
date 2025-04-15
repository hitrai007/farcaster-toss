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
    // Check if user is already connected
    sdk.getUser().then((user) => {
      if (user) {
        setIsConnected(true);
        setUser(user);
      }
      // Mark the app as ready once initial setup is complete
      setIsReady(true);
      sdk.actions.ready();
    });
  }, []);

  const connect = async () => {
    try {
      const user = await sdk.connect();
      setIsConnected(true);
      setUser(user);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const disconnect = async () => {
    try {
      await sdk.disconnect();
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
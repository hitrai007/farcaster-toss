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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Initializing Farcaster SDK...');
    try {
      sdk.actions.ready();
      console.log('Farcaster SDK initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize Farcaster SDK:', error);
    }

    // Set up frame message listener
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message event:', {
        origin: event.origin,
        data: event.data,
        type: event.data?.type
      });
      
      if (event.data?.type === 'farcaster:user') {
        console.log('Received Farcaster user data:', event.data.user);
        const userData = event.data.user;
        if (userData) {
          setIsConnected(true);
          setUser(userData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Added message event listener');

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('Removed message event listener');
    };
  }, []);

  const connect = async () => {
    try {
      console.log('Starting Farcaster connection process...');
      setLoading(true);
      
      // Open the Farcaster sign-in page
      console.log('Opening Farcaster sign-in page...');
      await sdk.actions.openUrl('https://warpcast.com/~/sign-in');
      console.log('Farcaster sign-in page opened');

      // Wait for the user data to be received through the message event
      return new Promise<void>((resolve, reject) => {
        console.log('Setting up message handler for user data...');
        
        const timeout = setTimeout(() => {
          console.log('Farcaster sign-in timed out');
          window.removeEventListener('message', messageHandler);
          reject(new Error('Farcaster sign in timed out. Please try again.'));
        }, 30000);

        const messageHandler = (event: MessageEvent) => {
          console.log('Message handler received event:', {
            origin: event.origin,
            data: event.data,
            type: event.data?.type
          });
          
          if (event.data?.type === 'farcaster:user') {
            console.log('Received Farcaster user data:', event.data.user);
            const userData = event.data.user;
            if (userData) {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              setIsConnected(true);
              setUser(userData);
              console.log('Farcaster connection completed successfully');
              resolve();
            }
          }
        };

        window.addEventListener('message', messageHandler);
        console.log('Added message handler for user data');
      });
    } catch (error) {
      console.error('Farcaster connection failed:', error);
      throw new Error('Failed to connect to Farcaster. Please try again.');
    } finally {
      setLoading(false);
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
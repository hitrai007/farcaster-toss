// src/types.ts
import { ethers } from "ethers";

// Define the CoinTossGame contract interface
export type CoinTossGame = {
  placeBet: (isHeads: boolean) => Promise<ethers.ContractTransactionResponse>;
  getState: () => Promise<[string, string, boolean, boolean, string, number]>;
  resolveGame: () => Promise<ethers.ContractTransactionResponse>;
  payout: () => Promise<ethers.ContractTransactionResponse>;
  resetGame: () => Promise<ethers.ContractTransactionResponse>;
  tossNumber: () => Promise<number>;
  filters: {
    BetPlaced: () => ethers.ContractEventName;
    WinnerDetermined: () => ethers.ContractEventName;
    WinningsSent: () => ethers.ContractEventName;
  };
} & ethers.Contract;

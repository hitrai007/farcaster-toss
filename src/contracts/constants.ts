// Contract ABI - Standard JSON Format
export const COIN_TOSS_GAME_ABI = [
  {
    "type": "function",
    "name": "startGame",
    "inputs": [
      { "name": "choice", "type": "bool", "internalType": "bool" },
      { "name": "token", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "joinGame",
    "inputs": [
      { "name": "choice", "type": "bool", "internalType": "bool" },
      { "name": "token", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "getGameState",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "bool", "internalType": "bool" },
      { "name": "", "type": "bool", "internalType": "bool" },
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "bool", "internalType": "bool" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  { 
    "type": "event", 
    "name": "GameStarted", 
    "inputs": [
      { "name": "player1", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "choice", "type": "bool", "indexed": false, "internalType": "bool" },
      { "name": "token", "type": "address", "indexed": false, "internalType": "address" }
    ],
    "anonymous": false
  },
  { 
    "type": "event", 
    "name": "GameJoined", 
    "inputs": [
      { "name": "player2", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "choice", "type": "bool", "indexed": false, "internalType": "bool" }
    ],
    "anonymous": false
  },
  { 
    "type": "event", 
    "name": "GameCompleted", 
    "inputs": [
      { "name": "winner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  { 
    "type": "event", 
    "name": "RandomnessRequested", 
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  { 
    "type": "event", 
    "name": "RandomnessFulfilled", 
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "randomWord", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const;

// ERC20 ABI - Standard JSON Format
export const ERC20_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [ { "name": "", "type": "bool", "internalType": "bool" } ],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" },
      { "name": "spender", "type": "address", "internalType": "address" }
    ],
    "outputs": [ { "name": "", "type": "uint256", "internalType": "uint256" } ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [ { "name": "account", "type": "address", "internalType": "address" } ],
    "outputs": [ { "name": "", "type": "uint256", "internalType": "uint256" } ],
    "stateMutability": "view"
  }
] as const;

// Contract addresses
export const COIN_TOSS_GAME_ADDRESS = process.env.NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS as `0x${string}`;

// Token address for USDC - explicitly using the address we deployed
export const USDC_ADDRESS = '0x3d7AcEd509a76a0C51067582b07f8F3C1012e6f0' as `0x${string}`;

console.log('Using USDC address in constants:', USDC_ADDRESS); 
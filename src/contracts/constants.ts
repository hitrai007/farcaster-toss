// Contract ABI
export const COIN_TOSS_GAME_ABI = [
  "function startGame(bool choice, address token) external",
  "function joinGame(bool choice, address token) external",
  "function getGameState() external view returns (address,address,bool,bool,address,bool,address)",
  "event GameStarted(address indexed player1, bool choice, address token)",
  "event GameJoined(address indexed player2, bool choice)",
  "event GameCompleted(address indexed winner, uint256 amount)",
  "event RandomnessRequested(uint256 requestId)",
  "event RandomnessFulfilled(uint256 requestId, uint256 randomWord)"
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
] as const;

// Contract addresses
export const COIN_TOSS_GAME_ADDRESS = process.env.NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS as `0x${string}`;

// Token address for USDC - explicitly using the address we deployed
export const USDC_ADDRESS = '0x3d7AcEd509a76a0C51067582b07f8F3C1012e6f0' as `0x${string}`;

console.log('Using USDC address in constants:', USDC_ADDRESS); 
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      baseSepolia: process.env.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // First deploy MockVRFCoordinator
  console.log("Deploying MockVRFCoordinator...");
  const MockVRFCoordinator = await ethers.getContractFactory("contracts/MockVRFCoordinator.sol:MockVRFCoordinator");
  const mockVRFCoordinator = await MockVRFCoordinator.deploy();
  await mockVRFCoordinator.waitForDeployment();
  const vrfCoordinatorAddress = await mockVRFCoordinator.getAddress();
  console.log("MockVRFCoordinator deployed to:", vrfCoordinatorAddress);

  // Get USDC address from .env or use the mock one if we have it
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (!usdcAddress) {
    console.error("USDC address not found in .env.local. Please deploy MockERC20 first.");
    process.exit(1);
  }
  console.log("Using USDC address:", usdcAddress);
  
  // Parameters for CoinTossGame
  const keyHash = "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef"; // Any value for testing
  const subscriptionId = 123; // Any value for testing
  
  // Deploy CoinTossGame
  console.log("Deploying CoinTossGame...");
  const CoinTossGame = await ethers.getContractFactory("contracts/CoinTossGame.sol:CoinTossGame");
  const coinTossGame = await CoinTossGame.deploy(
    usdcAddress,  // USDT address (using the same as USDC for testing)
    usdcAddress,  // USDC address 
    vrfCoordinatorAddress,
    keyHash,
    subscriptionId
  );
  
  await coinTossGame.waitForDeployment();
  const gameAddress = await coinTossGame.getAddress();
  console.log("CoinTossGame deployed to:", gameAddress);
  
  // Note: There is no setConsumer method in MockVRFCoordinator
  // The coordinator will automatically register the consumer when requestRandomWords is called
  
  console.log("\nIMPORTANT: Save this game address in your .env.local file:");
  console.log(`NEXT_PUBLIC_COIN_TOSS_GAME_ADDRESS=${gameAddress}`);

  return { gameAddress, vrfCoordinatorAddress };
}

main()
  .then(({ gameAddress }) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 
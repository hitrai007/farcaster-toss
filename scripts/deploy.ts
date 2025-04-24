import { ethers } from "hardhat";

async function main() {
  // Get contract factory
  const CoinTossGame = await ethers.getContractFactory("CoinTossGame");

  // Deploy parameters for Base Mainnet
  const usdtAddress = process.env.USDT_ADDRESS || "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"; // Base USDT
  const usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
  const vrfCoordinator = process.env.VRF_COORDINATOR || "0x8D8e9B5b2B7Bd1c3c6E8B5a2B7Bd1c3c6E8B5a2B7"; // Base VRF Coordinator
  const keyHash = process.env.KEY_HASH || "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef"; // Base key hash
  
  // Convert the large subscription ID to a BigInt
  const subscriptionIdStr = process.env.SUBSCRIPTION_ID || "73412699862031895481056310797279556835018443564172849544457403126834184583794";
  const subscriptionId = BigInt(subscriptionIdStr);

  console.log("Deploying with parameters:");
  console.log("USDT Address:", usdtAddress);
  console.log("USDC Address:", usdcAddress);
  console.log("VRF Coordinator:", vrfCoordinator);
  console.log("Key Hash:", keyHash);
  console.log("Subscription ID:", subscriptionId.toString());

  try {
    // Deploy contract
    console.log("Deploying CoinTossGame...");
    const coinTossGame = await CoinTossGame.deploy(
      usdtAddress,
      usdcAddress,
      vrfCoordinator,
      keyHash,
      subscriptionId
    );

    await coinTossGame.waitForDeployment();

    const address = await coinTossGame.getAddress();
    console.log("CoinTossGame deployed to:", address);

    // Wait for a few blocks to ensure deployment is confirmed
    console.log("Waiting for deployment confirmation...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify the contract
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [
          usdtAddress,
          usdcAddress,
          vrfCoordinator,
          keyHash,
          subscriptionId
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Contract verification failed:", error);
    }

    // Important: After deployment, add this contract address as a consumer in your VRF subscription
    console.log("\nIMPORTANT: Add this contract address as a consumer in your VRF subscription:");
    console.log("Contract Address:", address);
    console.log("Go to: https://vrf.chain.link/base-sepolia");
    console.log("Find your subscription and add the contract address as a consumer");

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
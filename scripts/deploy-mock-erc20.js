const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockERC20 with account:", deployer.address);

  // Get contract factory with fully qualified name
  const MockERC20 = await ethers.getContractFactory("contracts/MockERC20.sol:MockERC20");

  // Deploy MockERC20 with USDC parameters
  console.log("Deploying MockERC20 as USDC...");
  const mockUSDC = await MockERC20.deploy(
    "USD Coin", // name
    "USDC",     // symbol
    6           // decimals
  );

  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Mint some tokens to the deployer
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDC to ${deployer.address}`);

  console.log("\nIMPORTANT: Save this USDC address in your .env.local file:");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  
  return usdcAddress;
}

main()
  .then((address) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 
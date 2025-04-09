const hre = require("hardhat");

async function main() {
  // ✅ Replace with your actual MockUSDT address
  const usdtAddress = "0xEF37f57D8a64Fd6EdF2184Ad4b2c4Cd718ec4538";

  // Load the CoinTossGame contract factory
  const CoinTossGame = await hre.ethers.getContractFactory("CoinTossGame");

  // Deploy the CoinTossGame contract with the USDT address
  const game = await CoinTossGame.deploy(usdtAddress);

  // Wait until it is deployed (correct syntax for Ethers v6)
  await game.waitForDeployment();

  // Get the deployed address
  const deployedAddress = await game.getAddress();

  console.log(`✅ CoinTossGame deployed at: ${deployedAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

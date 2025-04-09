const hre = require("hardhat");

async function main() {
  // Load the contract factory
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");

  // Deploy the contract
  const token = await MockUSDT.deploy(); // no arguments needed

  // Wait for it to be mined (✅ this IS a function!)
  await token.waitForDeployment();

  // Get the deployed address
  const deployedAddress = await token.getAddress();

  console.log(`✅ MockUSDT deployed at: ${deployedAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy mock tokens
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy();
  const usdt = await MockERC20.deploy();
  
  await usdc.deployed();
  await usdt.deployed();
  
  console.log("USDC deployed to:", usdc.address);
  console.log("USDT deployed to:", usdt.address);

  // Deploy mock game
  const MockCoinTossGame = await hre.ethers.getContractFactory("MockCoinTossGame");
  const mockGame = await MockCoinTossGame.deploy(usdc.address, usdt.address);
  
  await mockGame.deployed();
  console.log("MockCoinTossGame deployed to:", mockGame.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

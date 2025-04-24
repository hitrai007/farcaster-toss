const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting tokens with account:", deployer.address);

  // Get the MockERC20 token contract
  const mockUSDCAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (!mockUSDCAddress) {
    console.error("USDC address not found in .env.local. Please set it first.");
    process.exit(1);
  }
  
  // Use the address we deployed earlier, not what might be in the .env file
  const correctUSDCAddress = "0x3d7AcEd509a76a0C51067582b07f8F3C1012e6f0";
  console.log("Using USDC address:", correctUSDCAddress);

  // Recipient wallets
  const recipientWallets = [
    "0xe6DE23FF0664F79F38dC068147CFE15c61755f3c",
    "0x1eE55A02858176EdFa16617192B6561e5376ED5C"
  ];

  const MockERC20 = await ethers.getContractFactory("contracts/MockERC20.sol:MockERC20");
  const mockUSDC = await MockERC20.attach(correctUSDCAddress);

  // Mint some tokens to each recipient
  const mintAmount = ethers.parseUnits("100", 6); // 100 USDC

  for (const wallet of recipientWallets) {
    try {
      console.log(`Minting tokens to ${wallet}...`);
      const tx = await mockUSDC.mint(wallet, mintAmount);
      await tx.wait();
      console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDC to ${wallet}`);

      // Get the balance to confirm
      try {
        const balance = await mockUSDC.balanceOf(wallet);
        console.log(`New balance: ${ethers.formatUnits(balance, 6)} USDC`);
      } catch (error) {
        console.error(`Could not check balance for ${wallet}:`, error.message);
      }
      
      console.log("-----------------------------------");
    } catch (error) {
      console.error(`Failed to mint tokens to ${wallet}:`, error.message);
    }
  }
}

main()
  .then(() => {
    console.log("Minting successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Minting failed:", error);
    process.exit(1);
  }); 
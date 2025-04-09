// resetGame.js

async function main() {
    // Get the deployer's signer (this can be any signer now since we've removed the restriction)
    const [deployer] = await ethers.getSigners();
  
    console.log("Resetting game from account:", deployer.address);
  
    // Get the contract factory and attach to the deployed contract
    const CoinTossGame = await ethers.getContractFactory("CoinTossGame");
    const coinTossGame = await CoinTossGame.attach("0x912621d6Bc2eA8898eA974439837207527642efb"); // Use the correct contract address
  
    // Call resetGame() to force a reset
    const tx = await coinTossGame.resetGame();
    await tx.wait(); // Wait for the transaction to be mined
  
    console.log("Game has been reset successfully!");
  }
  
  // Execute the script
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinTossGame", function () {
  let coinTossGame;
  let owner;
  let player1;
  let player2;
  let usdc;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy mock USDC
    const USDC = await ethers.getContractFactory("MockERC20");
    usdc = await USDC.deploy("USDC", "USDC", 6);
    await usdc.deployed();

    // Deploy CoinTossGame
    const CoinTossGame = await ethers.getContractFactory("CoinTossGame");
    coinTossGame = await CoinTossGame.deploy(
      usdc.address, // USDT address (using USDC for testing)
      usdc.address, // USDC address
      "0x8D8e9B5b2B7Bd1c3c6E8B5a2B7Bd1c3c6E8B5a2B7", // Mock VRF Coordinator
      "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef", // Key hash
      BigInt("73412699862031895481056310797279556835018443564172849544457403126834184583794") // Subscription ID
    );
    await coinTossGame.deployed();

    // Mint USDC to players
    await usdc.mint(player1.address, ethers.utils.parseUnits("100", 6));
    await usdc.mint(player2.address, ethers.utils.parseUnits("100", 6));
  });

  it("Should allow players to start and join a game", async function () {
    // Approve USDC spending
    await usdc.connect(player1).approve(coinTossGame.address, ethers.utils.parseUnits("0.1", 6));
    await usdc.connect(player2).approve(coinTossGame.address, ethers.utils.parseUnits("0.1", 6));

    // Player 1 starts game (chooses heads)
    await coinTossGame.connect(player1).startGame(true, usdc.address);

    // Check game state
    let gameState = await coinTossGame.getGameState();
    expect(gameState.player1).to.equal(player1.address);
    expect(gameState.player1Choice).to.be.true;
    expect(gameState.token).to.equal(usdc.address);

    // Player 2 joins game (chooses tails)
    await coinTossGame.connect(player2).joinGame(false, usdc.address);

    // Check game state
    gameState = await coinTossGame.getGameState();
    expect(gameState.player2).to.equal(player2.address);
    expect(gameState.player2Choice).to.be.false;
  });

  it("Should handle USDC transfers correctly", async function () {
    const initialBalance = await usdc.balanceOf(player1.address);
    
    // Approve and start game
    await usdc.connect(player1).approve(coinTossGame.address, ethers.utils.parseUnits("0.1", 6));
    await coinTossGame.connect(player1).startGame(true, usdc.address);

    // Check USDC balance
    const finalBalance = await usdc.balanceOf(player1.address);
    expect(finalBalance).to.equal(initialBalance.sub(ethers.utils.parseUnits("0.1", 6)));
  });
}); 
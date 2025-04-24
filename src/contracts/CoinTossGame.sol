// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/contracts/interfaces/IERC20.sol";

contract CoinTossGame {
    // Constants
    uint256 public constant BET_AMOUNT = 100000; // $0.1 in 6 decimals (USDC/USDT)
    uint256 public constant PLATFORM_FEE = 1; // 1% fee

    // Token addresses
    address public immutable USDT;
    address public immutable USDC;

    // Game struct
    struct Game {
        address player1;
        address player2;
        uint8 player1Choice; // 0 for Heads, 1 for Tails
        uint8 player2Choice;
        address tokenAddress; // USDC or USDT
        bool isComplete;
        uint256 winner; // 0 for not determined, 1 for player1, 2 for player2
    }

    // State variables
    mapping(uint256 => Game) public games;
    uint256 public currentGameId;
    uint256 public platformBalance;
    address public owner;

    // Events
    event GameStarted(uint256 indexed gameId, address indexed player1, uint8 choice, address tokenAddress);
    event GameJoined(uint256 indexed gameId, address indexed player2, uint8 choice);
    event GameCompleted(uint256 indexed gameId, address winner, uint256 amount);
    event BetPlaced(uint256 indexed gameId, address indexed player, uint256 amount, address tokenAddress);

    constructor(address _usdt, address _usdc) {
        USDT = _usdt;
        USDC = _usdc;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function startGame(uint8 _choice, address _tokenAddress) external returns (uint256) {
        require(_choice <= 1, "Invalid choice");
        require(_tokenAddress == USDT || _tokenAddress == USDC, "Invalid token");

        uint256 gameId = currentGameId++;
        Game storage game = games[gameId];
        game.player1 = msg.sender;
        game.player1Choice = _choice;
        game.tokenAddress = _tokenAddress;

        IERC20 token = IERC20(_tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), BET_AMOUNT),
            "Token transfer failed"
        );

        emit GameStarted(gameId, msg.sender, _choice, _tokenAddress);
        emit BetPlaced(gameId, msg.sender, BET_AMOUNT, _tokenAddress);
        return gameId;
    }

    function joinGame(uint256 _gameId, uint8 _choice) external {
        require(_choice <= 1, "Invalid choice");
        Game storage game = games[_gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(game.player2 == address(0), "Game already joined");
        require(_choice != game.player1Choice, "Cannot choose same as player 1");

        game.player2 = msg.sender;
        game.player2Choice = _choice;

        IERC20 token = IERC20(game.tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), BET_AMOUNT),
            "Token transfer failed"
        );

        emit GameJoined(_gameId, msg.sender, _choice);
        emit BetPlaced(_gameId, msg.sender, BET_AMOUNT, game.tokenAddress);

        // Determine winner using block hash
        _completeGame(_gameId);
    }

    function _completeGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        require(!game.isComplete, "Game already complete");
        require(game.player2 != address(0), "Game not ready");

        // Use block hash for randomness
        uint256 result = uint256(blockhash(block.number - 1)) % 2; // 0 for Heads, 1 for Tails
        game.winner = result == game.player1Choice ? 1 : 2;
        game.isComplete = true;

        // Calculate winnings and fee
        uint256 totalBet = BET_AMOUNT * 2;
        uint256 fee = (totalBet * PLATFORM_FEE) / 100;
        uint256 winnings = totalBet - fee;
        platformBalance += fee;

        // Transfer winnings
        address winner = game.winner == 1 ? game.player1 : game.player2;
        IERC20(game.tokenAddress).transfer(winner, winnings);

        emit GameCompleted(_gameId, winner, winnings);
    }

    function withdrawFees(address _tokenAddress) external onlyOwner {
        require(_tokenAddress == USDT || _tokenAddress == USDC, "Invalid token");
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance), "Token transfer failed");
        platformBalance = 0;
    }

    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }
}

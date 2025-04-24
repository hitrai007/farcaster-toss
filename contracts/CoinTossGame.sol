// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/VRFCoordinatorV2Interface.sol";

contract CoinTossGame {
    // Constants
    uint256 public constant BET_AMOUNT = 100000; // $0.1 in 6 decimals (USDC/USDT)
    uint256 public constant PLATFORM_FEE_PERCENT = 100; // 1%
    
    // Chainlink VRF
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;
    uint32 public constant callbackGasLimit = 100000;
    uint16 public constant requestConfirmations = 3;
    uint32 public constant numWords = 1;
    
    // Token addresses
    address public immutable USDT;
    address public immutable USDC;
    
    // Game state
    struct Game {
        address player1;
        address player2;
        bool player1Choice; // true for heads, false for tails
        bool player2Choice;
        address token; // USDC or USDT
        bool isComplete;
        address winner;
        uint256 requestId;
    }
    
    // Current game
    Game public currentGame;
    
    // VRF request ID to game mapping
    mapping(uint256 => Game) public vrfRequests;
    
    // Events
    event GameStarted(address indexed player1, bool choice, address token);
    event GameJoined(address indexed player2, bool choice);
    event GameCompleted(address indexed winner, uint256 amount);
    event BetPlaced(address indexed player, address token, uint256 amount);
    event RandomnessRequested(uint256 requestId);
    event RandomnessFulfilled(uint256 requestId, uint256 randomWord);
    
    // Owner address for fee collection
    address public owner;
    
    constructor(
        address _usdt,
        address _usdc,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) {
        USDT = _usdt;
        USDC = _usdc;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Start a new game with token
    function startGame(bool choice, address token) external {
        require(currentGame.player1 == address(0), "Game in progress");
        require(token == USDT || token == USDC, "Invalid token");
        
        IERC20 tokenContract = IERC20(token);
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= BET_AMOUNT, "Insufficient allowance");
        
        bool success = tokenContract.transferFrom(msg.sender, address(this), BET_AMOUNT);
        require(success, "Token transfer failed");
        
        currentGame = Game({
            player1: msg.sender,
            player2: address(0),
            player1Choice: choice,
            player2Choice: false,
            token: token,
            isComplete: false,
            winner: address(0),
            requestId: 0
        });
        
        emit GameStarted(msg.sender, choice, token);
        emit BetPlaced(msg.sender, token, BET_AMOUNT);
    }
    
    // Join game with token
    function joinGame(bool choice, address token) external {
        require(currentGame.player1 != address(0), "No game in progress");
        require(currentGame.player2 == address(0), "Game in progress");
        require(currentGame.token == token, "Wrong token");
        require(choice != currentGame.player1Choice, "Cannot choose same as player 1");
        
        IERC20 tokenContract = IERC20(token);
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= BET_AMOUNT, "Insufficient allowance");
        
        bool success = tokenContract.transferFrom(msg.sender, address(this), BET_AMOUNT);
        require(success, "Token transfer failed");
        
        currentGame.player2 = msg.sender;
        currentGame.player2Choice = choice;
        
        emit GameJoined(msg.sender, choice);
        emit BetPlaced(msg.sender, token, BET_AMOUNT);
        
        _requestRandomness();
    }
    
    // Request randomness from Chainlink VRF
    function _requestRandomness() internal {
        require(currentGame.player1 != address(0) && currentGame.player2 != address(0), "Game not full");
        require(!currentGame.isComplete, "Game already complete");
        
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            uint64(subscriptionId),
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        currentGame.requestId = requestId;
        vrfRequests[requestId] = currentGame;
        
        emit RandomnessRequested(requestId);
    }
    
    // Callback function for Chainlink VRF
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(msg.sender == address(vrfCoordinator), "Only VRF coordinator can fulfill");
        require(vrfRequests[requestId].player1 != address(0), "Request not found");
        
        Game memory game = vrfRequests[requestId];
        bool result = randomWords[0] % 2 == 0;
        
        // Determine winner
        address winner;
        if (result == game.player1Choice) {
            winner = game.player1;
        } else {
            winner = game.player2;
        }
        
        // Update game state
        currentGame.winner = winner;
        currentGame.isComplete = true;
        
        // Calculate winnings (total pot minus fee)
        uint256 totalPot = BET_AMOUNT * 2;
        uint256 fee = (totalPot * PLATFORM_FEE_PERCENT) / 10000;
        uint256 winnings = totalPot - fee;
        
        // Transfer winnings
        IERC20 tokenContract = IERC20(game.token);
        bool success = tokenContract.transfer(winner, winnings);
        require(success, "Token transfer failed");
        
        emit RandomnessFulfilled(requestId, randomWords[0]);
        emit GameCompleted(winner, winnings);
    }
    
    // Function to withdraw collected fees (only owner)
    function withdrawFees(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        bool success = tokenContract.transfer(owner, balance);
        require(success, "Token transfer failed");
    }
    
    // Function to get current game state
    function getGameState() external view returns (
        address player1,
        address player2,
        bool player1Choice,
        bool player2Choice,
        address token,
        bool isComplete,
        address winner
    ) {
        return (
            currentGame.player1,
            currentGame.player2,
            currentGame.player1Choice,
            currentGame.player2Choice,
            currentGame.token,
            currentGame.isComplete,
            currentGame.winner
        );
    }
}

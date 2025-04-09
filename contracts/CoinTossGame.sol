// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importing the interface for the ERC20 token (Mock USDT)
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoinTossGame {
    address public deployer;
    address public player1;
    address public player2;
    address public winner;
    uint public tossNumber;
    
    // Store player choices explicitly
    mapping(address => bool) public playerChoices; // true for heads, false for tails

    // Address of the Mock USDT token
    IERC20 public usdtToken;
    uint public betAmount = 100000; // Set the bet amount as 0.1 mUSDT (in 6 decimals)

    // Events
    event GameReset(uint newTossNumber);
    event BetPlaced(address player, bool isHeads, uint amount);
    event WinnerDetermined(address winner, bool winningSide);
    event FeeSent(address deployer, uint amount);
    event WinningsSent(address winner, uint amount);

    // Modifiers
    modifier onlyDeployer() {
        require(msg.sender == deployer, "Only contract deployer can reset the game.");
        _;
    }

    modifier canReset() {
        require(
            msg.sender == deployer || 
            (winner != address(0) && player1 != address(0) && player2 != address(0)),
            "Only deployer can reset an ongoing game"
        );
        _;
    }

    constructor(address _usdtToken) {
        deployer = msg.sender;
        tossNumber = 1;
        usdtToken = IERC20(_usdtToken);
    }

    function placeBet(bool isHeads) public {
        require(usdtToken.transferFrom(msg.sender, address(this), betAmount), "Bet transfer failed.");
        
        if (player1 == address(0)) {
            player1 = msg.sender;
            playerChoices[msg.sender] = isHeads;
            emit BetPlaced(msg.sender, isHeads, betAmount);
        } else if (player2 == address(0)) {
            require(playerChoices[player1] != isHeads, "Player 2 must choose the opposite side.");
            player2 = msg.sender;
            playerChoices[msg.sender] = isHeads;
            emit BetPlaced(msg.sender, isHeads, betAmount);

            // Automatically resolve game when Player 2 places bet
            _resolveAndPayout();
        } else {
            revert("Both players have already placed their bets.");
        }
    }

    // Internal function to handle game resolution and payout
    function _resolveAndPayout() internal {
        // Resolve the game
        uint result = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 2;
        bool isHeads = result == 0;
        winner = isHeads == playerChoices[player1] ? player1 : player2;
        emit WinnerDetermined(winner, isHeads);

        // Calculate and send winnings with 1% fee
        uint balance = usdtToken.balanceOf(address(this));
        uint fee = balance / 100; // 1% fee
        uint winnings = balance - fee;
        
        // Send fee to deployer
        require(usdtToken.transfer(deployer, fee), "Fee transfer failed.");
        emit FeeSent(deployer, fee);
        
        // Send winnings to winner
        require(usdtToken.transfer(winner, winnings), "Winnings transfer failed.");
        emit WinningsSent(winner, winnings);

        // Reset game state
        delete playerChoices[player1];
        delete playerChoices[player2];
        player1 = address(0);
        player2 = address(0);
        winner = address(0);
        tossNumber++;

        emit GameReset(tossNumber);
    }

    // Keep these functions for emergency use by deployer only
    function resolveGame() public onlyDeployer {
        require(player1 != address(0) && player2 != address(0), "Both players must place bets.");
        require(winner == address(0), "Game already resolved.");
        
        uint result = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 2;
        bool isHeads = result == 0;
        winner = isHeads == playerChoices[player1] ? player1 : player2;
    }

    function payout() public onlyDeployer {
        require(winner != address(0), "No winner yet.");
        uint balance = usdtToken.balanceOf(address(this));
        require(usdtToken.transfer(winner, balance), "Transfer failed.");
    }

    function resetGame() public onlyDeployer {
        uint balance = usdtToken.balanceOf(address(this));
        if (balance > 0) {
            require(usdtToken.transfer(deployer, balance), "Transfer to deployer failed");
        }

        delete playerChoices[player1];
        delete playerChoices[player2];
        player1 = address(0);
        player2 = address(0);
        winner = address(0);
        tossNumber++;

        emit GameReset(tossNumber);
    }

    function getState() public view returns (
        address _player1,
        address _player2,
        bool _player1Choice,
        bool _player2Choice,
        address _winner,
        uint _tossNumber
    ) {
        return (
            player1,
            player2,
            player1 != address(0) ? playerChoices[player1] : false,
            player2 != address(0) ? playerChoices[player2] : false,
            winner,
            tossNumber
        );
    }
}

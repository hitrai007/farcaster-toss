// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A mock USDT contract with 6 decimals and a mint() function
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "mUSDT") {}

    // Override to set 6 decimals like real USDT
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Public mint function for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/VRFCoordinatorV2Interface.sol";
import "./CoinTossGame.sol";

contract MockVRFCoordinator is VRFCoordinatorV2Interface {
    uint256 private nonce = 0;
    mapping(uint256 => address) private gameContracts;

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = nonce++;
        gameContracts[requestId] = msg.sender;
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        // Not implemented for testing
    }

    function mockFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(gameContracts[requestId] != address(0), "Request not found");
        CoinTossGame(gameContracts[requestId]).fulfillRandomWords(requestId, randomWords);
    }

    function getRequestConfig() external pure returns (uint16, uint32, bytes32[] memory) {
        bytes32[] memory keyhashes = new bytes32[](0);
        return (3, 2000000, keyhashes);
    }

    function createSubscription() external pure returns (uint64) {
        return 1;
    }

    function getSubscription(uint64 subId) external pure returns (
        uint96 balance,
        uint64 reqCount,
        address owner,
        address[] memory consumerAddresses
    ) {
        consumerAddresses = new address[](0);
        return (0, 0, address(0), consumerAddresses);
    }

    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external pure {
        // Not implemented for testing
    }

    function acceptSubscriptionOwnerTransfer(uint64 subId) external pure {
        // Not implemented for testing
    }

    function addConsumer(uint64 subId, address consumer) external pure {
        // Not implemented for testing
    }

    function removeConsumer(uint64 subId, address consumer) external pure {
        // Not implemented for testing
    }

    function cancelSubscription(uint64 subId, address to) external pure {
        // Not implemented for testing
    }

    function pendingRequestExists(uint64 subId) external pure returns (bool) {
        return false;
    }
} 
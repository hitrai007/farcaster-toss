// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface VRFCoordinatorV2Interface {
    /**
     * @notice Get configuration relevant for making requests
     * @return minimumRequestConfirmations global min for request confirmations
     * @return maxGasLimit global max for request gas limit
     * @return s_provingKeyHashes list of registered key hashes
     */
    function getRequestConfig()
        external
        view
        returns (
            uint16,
            uint32,
            bytes32[] memory
        );

    /**
     * @notice Request a set of random words.
     * @param subId - ID of the VRF subscription
     * @param minimumRequestConfirmations - how many blocks you'd like the oracle to wait before responding
     * @param callbackGasLimit - how much gas you'd like to receive in your fulfillRandomWords callback
     * @param numWords - the number of random words you'd like to receive
     * @return requestId - A unique identifier of the request
     */
    function requestRandomWords(
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256);

    /**
     * @notice Create a VRF subscription.
     * @return subId - A unique subscription id.
     */
    function createSubscription() external returns (uint64 subId);

    /**
     * @notice Add a consumer to a VRF subscription.
     * @param subId - ID of the subscription
     * @param consumer - New consumer which can use the subscription
     */
    function addConsumer(uint64 subId, address consumer) external;
} 
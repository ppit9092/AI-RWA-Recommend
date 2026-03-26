// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RecommendationConsumer {
    struct RecommendationSummary {
        address user;
        bytes32 resultHash;
        uint256[] tokenIds;
        uint16[] scoresBps;
        string modelId;
        uint256 timestamp;
    }

    uint256 public latestId;
    mapping(uint256 => RecommendationSummary) public summaries;

    event RecommendationSubmitted(
        uint256 indexed id,
        address indexed user,
        bytes32 indexed resultHash,
        uint256[] tokenIds,
        uint16[] scoresBps,
        string modelId,
        uint256 timestamp
    );

    error LengthMismatch();
    error EmptyRecommendation();

    function submitRecommendation(
        bytes32 resultHash,
        uint256[] calldata tokenIds,
        uint16[] calldata scoresBps,
        string calldata modelId
    ) external returns (uint256 id) {
        if (tokenIds.length == 0) revert EmptyRecommendation();
        if (tokenIds.length != scoresBps.length) revert LengthMismatch();

        id = ++latestId;
        summaries[id] = RecommendationSummary({
            user: msg.sender,
            resultHash: resultHash,
            tokenIds: tokenIds,
            scoresBps: scoresBps,
            modelId: modelId,
            timestamp: block.timestamp
        });

        emit RecommendationSubmitted(id, msg.sender, resultHash, tokenIds, scoresBps, modelId, block.timestamp);
    }
}

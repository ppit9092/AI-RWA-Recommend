// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {RecommendationConsumer} from "../src/RecommendationConsumer.sol";

contract RecommendationConsumerTest is Test {
    RecommendationConsumer consumer;

    function setUp() public {
        consumer = new RecommendationConsumer();
    }

    function testSubmitRecommendation() public {
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        uint16[] memory scores = new uint16[](2);
        scores[0] = 9000;
        scores[1] = 8500;

        uint256 id = consumer.submitRecommendation(keccak256("demo"), tokenIds, scores, "qwen2.5-7b");
        assertEq(id, 1);
        assertEq(consumer.latestId(), 1);
    }
}

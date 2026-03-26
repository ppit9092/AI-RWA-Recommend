// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {RWA1155} from "../src/RWA1155.sol";

contract RWA1155Test is Test {
    RWA1155 rwa;

    function setUp() public {
        rwa = new RWA1155();
    }

    function testMintFractional() public {
        rwa.mintFractional(1, 100, address(this));
        assertEq(rwa.balanceOf(address(this), 1), 100);
        assertEq(rwa.totalSupplyPerAsset(1), 100);
    }
}

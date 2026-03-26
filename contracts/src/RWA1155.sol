// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "openzeppelin-contracts/contracts/access/AccessControl.sol";

contract RWA1155 is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => string) public assetMetadata;
    mapping(uint256 => uint256) public totalSupplyPerAsset;

    error MaxSupplyExceeded();

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        assetMetadata[1] = "ipfs://demo-real-estate";
        assetMetadata[2] = "ipfs://demo-art";
    }

    function mintFractional(uint256 tokenId, uint256 amount, address to) external onlyRole(MINTER_ROLE) {
        if (totalSupplyPerAsset[tokenId] + amount > 10_000) revert MaxSupplyExceeded();
        totalSupplyPerAsset[tokenId] += amount;
        _mint(to, tokenId, amount, "");
    }

    function setAssetMetadata(uint256 tokenId, string calldata uri_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assetMetadata[tokenId] = uri_;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return assetMetadata[tokenId];
    }
}

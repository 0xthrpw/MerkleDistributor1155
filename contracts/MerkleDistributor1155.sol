// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMerkleDistributor.sol";
import "./ISuper1155.sol";

contract MerkleDistributor1155 is IMerkleDistributor, Ownable {
    using SafeMath for uint256;

    address public immutable override token;

    //bytes32 public immutable override merkleRoot;
    mapping ( uint256 => bytes32 ) public merkleRoots;

    // This is a packed array of booleans.
    mapping( uint256 => mapping( uint256 => uint256) ) private claimedBitMap;

    constructor( address _token) {
        token = _token;
    }

    function setRoundRoot(uint256 groupId, bytes32 merkleRoot) external onlyOwner {
      merkleRoots[groupId] = merkleRoot;
    }

    function isClaimed( uint256 groupId, uint256 index ) public view override returns ( bool ) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[groupId][claimedWordIndex];
        uint256 mask = ( 1 << claimedBitIndex );
        return claimedWord & mask == mask;
    }

    function _setClaimed( uint256 groupId, uint256 index ) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[groupId][claimedWordIndex] = claimedBitMap[groupId][claimedWordIndex] | ( 1 << claimedBitIndex );
    }

    function claim( uint256 groupId, uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof ) external override {
        require( !isClaimed( groupId, index ), 'MerkleDistributor: Drop already claimed.' );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        uint256 path = index;
        for (uint16 i = 0; i < merkleProof.length; i++) {
            if ((path & 0x01) == 1) {
                node = keccak256(abi.encodePacked(merkleProof[i], node));
            } else {
                node = keccak256(abi.encodePacked(node, merkleProof[i]));
            }
            path /= 2;
        }

        // Check the merkle proof
        require(node == merkleRoots[groupId], 'MerkleDistributor: Invalid proof.' );
        // Mark it claimed and send the token.
        _setClaimed(  groupId, index );

        uint256 newTokenIdBase = groupId << 128;
        uint256 currentMintCount = ISuper1155( token ).groupMintCount(groupId);

        uint256[] memory ids = new uint256[](amount);
        uint256[] memory amounts = new uint[](amount);
        for(uint256 i = 0; i < amount; i++) {
          ids[i] = newTokenIdBase.add(currentMintCount).add(i).add(1);
          amounts[i] = uint256(1);
        }

        ISuper1155( token ).mintBatch( account, ids, amounts, "" );
        emit Claimed( index, account, amount );
    }
}

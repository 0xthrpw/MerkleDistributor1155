'use strict';

var fs = require('fs');
var path = require('path');
var ethers = require('ethers');

var contractArtifacts = require('./artifacts/contracts/MerkleDistributor1155.sol/MerkleDistributor1155.json');

function reduceMerkleBranches(leaves) {
    var output = [];

    while (leaves.length) {
        var left = leaves.shift();
        var right = (leaves.length === 0) ? left: leaves.shift();
        output.push(ethers.utils.keccak256(left + right.substring(2)));
    }

    output.forEach(function(leaf) {
        leaves.push(leaf);
    });
}

var t0 = (new Date()).getTime()
function now() {
    return (new Date()).getTime() - t0;
}

function expandLeaves(balances) {
    var addresses = Object.keys(balances);

    addresses.sort(function(a, b) {
        var al = a.toLowerCase(), bl = b.toLowerCase();
        if (al < bl) { return -1; }
        if (al > bl) { return 1; }
        return 0;
    });
    return addresses.map(function(a, i) { return { address: a.toLowerCase(), balance: balances[a], index: i }; });
}

function getLeaves(balances) {
    var leaves = expandLeaves(balances);

    return leaves.map(function(leaf) {
        return ethers.utils.solidityKeccak256(["uint256", "address", "uint256"], [leaf.index, leaf.address, leaf.balance]);
    });
}

function computeRootHash(balances) {
    var leaves = getLeaves(balances);

    while (leaves.length > 1) {
        reduceMerkleBranches(leaves);
    }

    return leaves[0];
}

function computeMerkleProof(balances, index) {
    var leaves = getLeaves(balances);

    if (index == null) { throw new Error('address not found'); }

    var path = index;

    var proof = [ ];
    while (leaves.length > 1) {
        if ((path % 2) == 1) {
            proof.push(leaves[path - 1])
        } else {
            proof.push(leaves[path + 1])
        }

        // Reduce the merkle tree one level
        reduceMerkleBranches(leaves);

        // Move up
        path = parseInt(path / 2);
    }

    return proof;
}

function Distribution(balances) {
    if (!(this instanceof Distribution)) { throw new Error('missing new') ;}

    this.balances = balances;

    var rootHash = null;
    Object.defineProperty(this, 'rootHash', {
        get: function() {
            if (rootHash == null) {
                rootHash = computeRootHash(balances);
            }
            return rootHash;
        }
    });

}

Distribution.prototype.getIndex = function(address) {
    address = address.toLowerCase();

    var leaves = expandLeaves(this.balances);

    var index = null;
    for (var i = 0; i < leaves.length; i++) {
        if (i != leaves[i].index) { throw new Error('bad index mapping'); }
        if (leaves[i].address === address) { return leaves[i].index; }
    }

    throw new Error('address not found');
}

Distribution.prototype.getAddress = function(index) {
    var leaves = expandLeaves(this.balances);
    return leaves[index].address;
}

Distribution.prototype.getAmount = function(index) {
    var leaves = expandLeaves(this.balances);
    return leaves[index].balance;
}

Distribution.prototype.getMerkleProof = function(index) {
    return computeMerkleProof(this.balances, index);
}

Distribution.prototype.getMerkleTree = function() {
    var leaves = expandLeaves(this.balances);
    var proofs = [];
    for(let i = 0; i < leaves.length; i++){
      leaves[i].proof = computeMerkleProof(this.balances, i)
    }

    var tree = {
      merkleRoot: this.rootHash,
      amount: leaves.length,
      leaves: leaves
    };
    return tree;
}
module.exports = Distribution;

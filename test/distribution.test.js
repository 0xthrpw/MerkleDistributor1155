'use strict';

const { describe, it } = require('mocha');
const { network, ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
var Distribution = require('../distribution');

describe('NFT Distribution: General', function () {
  let deployer, user, addresses, distribution;
  let Super1155, super1155;
  let NftMerkleDistributor, nftMerkleDistributor;
  let balances = {};

  const MAINNET_PROXY_OPENSEA = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';
  const RINKEBY_PROXY_OPENSEA = '0xf57b2c51ded3a29e6891aba85459d600256cf317';
  const COLLECTION_NAME = 'Distributed 1155';
  const METADATA_URI = 'https://gateway.pinata.cloud/ipfs/QmPWrSrC3RhfTQxab1DceAJhthhkEgX6y4XAZcq2TWFDut/{id}.json';


  before(async () => {
    const signers = await ethers.getSigners();
    addresses = await Promise.all(signers.map(async signer => signer.getAddress()));
    deployer = { provider: signers[0].provider, signer: signers[0], address: addresses[0] };
    user = { provider: signers[1].provider, signer: signers[1], address: addresses[1] };
    Super1155 = await ethers.getContractFactory("Super1155");
    NftMerkleDistributor = await ethers.getContractFactory("MerkleDistributor1155");
  });

  beforeEach(async () => {

    super1155 = await Super1155.connect(deployer.signer).deploy(deployer.address, COLLECTION_NAME, METADATA_URI, RINKEBY_PROXY_OPENSEA);

    await super1155.deployed();
    let groupConfig = await super1155.connect(deployer.signer).configureGroup(1, {
      name: 'Distributed 1155: Round 1',
      supplyType: 0,
      supplyData: 100,
      itemType: 0,
      itemData: 0,
      burnType: 1,
      burnData: 100
    });

    for (let i = 0; i < 10; i++) {
      balances[addresses[i].toLowerCase()] = 1;
    }
  });

  it('redemption', async () => {
    distribution = new Distribution(balances);

    nftMerkleDistributor = await NftMerkleDistributor.deploy(super1155.address);
    await nftMerkleDistributor.deployed();

    let mintRight = await super1155.MINT();
    let grantDistributorRights = await super1155.connect(deployer.signer).setPermit(nftMerkleDistributor.address, "0x0000000000000000000000000000000000000000000000000000000000000001", mintRight, ethers.constants.MaxUint256);

    await nftMerkleDistributor.setRoundRoot(1, distribution.rootHash);

    let userIndex = distribution.getIndex(user.address);
    let amount = ethers.BigNumber.from(1);
    let proof = distribution.getMerkleProof(userIndex);


    let root = await nftMerkleDistributor.merkleRoots(1);

    let groupId = ethers.BigNumber.from(1);

    let redemption = await nftMerkleDistributor.claim(groupId, userIndex, user.address, 1, proof);

  });

  // it('', async () => {
  //   let merkleTree = distribution.getMerkleTree();
  //   console.log(merkleTree);
  // });
});

const hre = require("hardhat");
const ethers = hre.ethers;
var Distribution = require('../distribution');

async function main() {
  const COLLECTION_NAME = 'Distributed 1155: Round 1';
  const METADATA_URI = 'https://gateway.pinata.cloud/ipfs/QmPWrSrC3RhfTQxab1DceAJhthhkEgX6y4XAZcq2TWFDut/{id}.json';
  let proxyRegistryAddress = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';
  proxyRegistryAddress = '0xf57b2c51ded3a29e6891aba85459d600256cf317';

  const signers = await ethers.getSigners();
  const addresses = await Promise.all(signers.map(async signer => signer.getAddress()));

  const deployer = { provider: signers[0].provider, signer: signers[0], address: addresses[0] };
  console.log(`[DEPLOYMENT] Deploying contracts from: ${deployer.address}`);

  let Super1155 = await ethers.getContractFactory("Super1155");
  let super1155 = await Super1155.connect(deployer.signer).deploy(deployer.address, COLLECTION_NAME, METADATA_URI, proxyRegistryAddress);
  console.log(`[DEPLOYMENT] Super1155 deployed to: ${super1155.address}`);
  console.log(`[DEPLOYMENT] [$]: npx hardhat verify --network rinkeby ${super1155.address} ${deployer.address} '${COLLECTION_NAME}' '${METADATA_URI}' ${proxyRegistryAddress}`);

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
  let balances = {};
  let recipients = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
    "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
    "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
    "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
  ];

  for (let i = 0; i < recipients.length; i++) {
    balances[recipients[i].toLowerCase()] = 1;
  }
  let NftMerkleDistributor = await ethers.getContractFactory("MerkleDistributor1155");
  let distribution = new Distribution(balances);
  for (let i = 0; i < 4; i++) {
    //console.log({index:i, address: recipients[i], amount: 1, proof:distribution.getMerkleProof(i)});
  }

  let nftMerkleDistributor = await NftMerkleDistributor.deploy(super1155.address);
  await nftMerkleDistributor.deployed();
  console.log(`[DEPLOYMENT] NftMerkleDistributor deployed to: ${nftMerkleDistributor.address}`);
  console.log(`[DEPLOYMENT] [$]: npx hardhat verify --network rinkeby ${nftMerkleDistributor.address} ${super1155.address}`);

  let mintRight = await super1155.MINT();
  let grantDistributorRights = await super1155.connect(deployer.signer).setPermit(
    nftMerkleDistributor.address,
    "0x0000000000000000000000000000000000000000000000000000000000000001",
    mintRight,
    ethers.constants.MaxUint256
  );
  await nftMerkleDistributor.setRoundRoot(1, distribution.rootHash);
  console.log(`[DEPLOYMENT] Mint Permit configured for: ${nftMerkleDistributor.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

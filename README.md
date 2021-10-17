# MerkleDistributor1155  
A cheap way to maintain a whitelisted distribution of erc1155 tokens to users using merkle proofs.  

Take the merklepill, anon.  

This repo borrows heavily from RicMoo's https://github.com/ricmoo/ethers-airdrop.  

### Install  
`npm install`  

### Compile contracts  
`npx hardhat compile`  

### Test Contracts  
`npx hardhat test`  

### Generate Merkle Tree  
add addresses and amounts in 'meta/balances.json' then run  
`node scripts/generateTree.js`  

### Deploy Contracts  
`npx run scripts/1.deployDistributor.js --network [live, rinkeby, custom]`  

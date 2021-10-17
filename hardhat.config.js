//const { task } = require('hardhat/config')

require('@nomiclabs/hardhat-etherscan')
require('@nomiclabs/hardhat-waffle')
require('solidity-coverage')
require("hardhat-interface-generator")
require('hardhat-gas-reporter')
require('dotenv').config()

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 12883802
      }
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.RINKEBY_PRIVKEY]
    },
    live: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.LIVE_SUPER_DEPLOYER]
    },
    custom: {
      url: `http://${process.env.NODE_USER}:${process.env.NODE_PASS}@${process.env.NODE_ADDRESS}:${process.env.NODE_PORT}`,
      accounts: [process.env.RINKEBY_PRIVKEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    compilers: [
      {
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true
          }
        }
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true
          }
        }
      },
      {
        version: '0.6.11',
        settings: {
          optimizer: {
            enabled: true
          }
        }
      }
    ]
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 10
  }
}

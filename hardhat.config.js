require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY || "";
const accounts = privateKey
  ? [privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`]
  : [];

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      accounts
    },
    bsc: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-rpc.publicnode.com",
      chainId: 56,
      accounts
    }
  }
};

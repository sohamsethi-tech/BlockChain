// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
},
//   networks: {
//     // ── Polygon Amoy testnet (free MATIC from faucet) ─────────────────────
//     // Recommended: fast, cheap, EVM-compatible, mature ecosystem
//     amoy: {
//       url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
//       accounts: process.env.DEPLOYER_PRIVATE_KEY
//         ? [process.env.DEPLOYER_PRIVATE_KEY]
//         : [],
//       chainId: 80002,
//     },
//     // ── Ethereum Sepolia testnet (backup) ─────────────────────────────────
//     sepolia: {
//       url: process.env.SEPOLIA_RPC_URL || "",
//       accounts: process.env.DEPLOYER_PRIVATE_KEY
//         ? [process.env.DEPLOYER_PRIVATE_KEY]
//         : [],
//       chainId: 11155111,
//     },
//     // ── Local Hardhat network (development) ───────────────────────────────
//     localhost: {
//       url: "http://127.0.0.1:8545",
//       chainId: 31337,
//     },
//   },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      sepolia:     process.env.ETHERSCAN_API_KEY   || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL:    "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
};
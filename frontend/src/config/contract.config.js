// import { ethers } from "ethers";

// export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// export const CONTRACT_ABI = [
//   // paste ABI from artifacts after deploy
//     {
//       "inputs": [],
//       "stateMutability": "nonpayable",
//       "type": "constructor"
//     },
//     {
//       "anonymous": false,
//       "inputs": [
//         {
//           "indexed": true,
//           "internalType": "bytes32",
//           "name": "evidenceHash",
//           "type": "bytes32"
//         },
//         {
//           "indexed": true,
//           "internalType": "address",
//           "name": "submitter",
//           "type": "address"
//         },
//         {
//           "indexed": false,
//           "internalType": "string",
//           "name": "ipfsCID",
//           "type": "string"
//         },
//         {
//           "indexed": false,
//           "internalType": "string",
//           "name": "category",
//           "type": "string"
//         },
//         {
//           "indexed": false,
//           "internalType": "string",
//           "name": "title",
//           "type": "string"
//         },
//         {
//           "indexed": false,
//           "internalType": "uint256",
//           "name": "timestamp",
//           "type": "uint256"
//         }
//       ],
//       "name": "EvidenceSubmitted",
//       "type": "event"
//     },
//     {
//       "anonymous": false,
//       "inputs": [
//         {
//           "indexed": true,
//           "internalType": "address",
//           "name": "journalist",
//           "type": "address"
//         },
//         {
//           "indexed": false,
//           "internalType": "string",
//           "name": "alias_",
//           "type": "string"
//         }
//       ],
//       "name": "JournalistAdded",
//       "type": "event"
//     },
//     {
//       "anonymous": false,
//       "inputs": [
//         {
//           "indexed": true,
//           "internalType": "address",
//           "name": "journalist",
//           "type": "address"
//         }
//       ],
//       "name": "JournalistRevoked",
//       "type": "event"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "journalist",
//           "type": "address"
//         },
//         {
//           "internalType": "string",
//           "name": "alias_",
//           "type": "string"
//         }
//       ],
//       "name": "addJournalist",
//       "outputs": [],
//       "stateMutability": "nonpayable",
//       "type": "function"
//     },
//     {
//       "inputs": [],
//       "name": "deployerAdmin",
//       "outputs": [
//         {
//           "internalType": "address",
//           "name": "",
//           "type": "address"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "bytes32",
//           "name": "_hash",
//           "type": "bytes32"
//         }
//       ],
//       "name": "getEvidence",
//       "outputs": [
//         {
//           "components": [
//             {
//               "internalType": "bytes32",
//               "name": "evidenceHash",
//               "type": "bytes32"
//             },
//             {
//               "internalType": "string",
//               "name": "ipfsCID",
//               "type": "string"
//             },
//             {
//               "internalType": "uint8",
//               "name": "evidenceType",
//               "type": "uint8"
//             },
//             {
//               "internalType": "string",
//               "name": "category",
//               "type": "string"
//             },
//             {
//               "internalType": "string",
//               "name": "title",
//               "type": "string"
//             },
//             {
//               "internalType": "uint256",
//               "name": "timestamp",
//               "type": "uint256"
//             },
//             {
//               "internalType": "address",
//               "name": "submitter",
//               "type": "address"
//             },
//             {
//               "internalType": "bool",
//               "name": "exists",
//               "type": "bool"
//             }
//           ],
//           "internalType": "struct EvidenceRegistry.EvidenceRecord",
//           "name": "",
//           "type": "tuple"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "submitter",
//           "type": "address"
//         }
//       ],
//       "name": "getEvidenceBySubmitter",
//       "outputs": [
//         {
//           "components": [
//             {
//               "internalType": "bytes32",
//               "name": "evidenceHash",
//               "type": "bytes32"
//             },
//             {
//               "internalType": "string",
//               "name": "ipfsCID",
//               "type": "string"
//             },
//             {
//               "internalType": "uint8",
//               "name": "evidenceType",
//               "type": "uint8"
//             },
//             {
//               "internalType": "string",
//               "name": "category",
//               "type": "string"
//             },
//             {
//               "internalType": "string",
//               "name": "title",
//               "type": "string"
//             },
//             {
//               "internalType": "uint256",
//               "name": "timestamp",
//               "type": "uint256"
//             },
//             {
//               "internalType": "address",
//               "name": "submitter",
//               "type": "address"
//             },
//             {
//               "internalType": "bool",
//               "name": "exists",
//               "type": "bool"
//             }
//           ],
//           "internalType": "struct EvidenceRegistry.EvidenceRecord[]",
//           "name": "",
//           "type": "tuple[]"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "uint256",
//           "name": "offset",
//           "type": "uint256"
//         },
//         {
//           "internalType": "uint256",
//           "name": "limit",
//           "type": "uint256"
//         }
//       ],
//       "name": "getEvidencePage",
//       "outputs": [
//         {
//           "components": [
//             {
//               "internalType": "bytes32",
//               "name": "evidenceHash",
//               "type": "bytes32"
//             },
//             {
//               "internalType": "string",
//               "name": "ipfsCID",
//               "type": "string"
//             },
//             {
//               "internalType": "uint8",
//               "name": "evidenceType",
//               "type": "uint8"
//             },
//             {
//               "internalType": "string",
//               "name": "category",
//               "type": "string"
//             },
//             {
//               "internalType": "string",
//               "name": "title",
//               "type": "string"
//             },
//             {
//               "internalType": "uint256",
//               "name": "timestamp",
//               "type": "uint256"
//             },
//             {
//               "internalType": "address",
//               "name": "submitter",
//               "type": "address"
//             },
//             {
//               "internalType": "bool",
//               "name": "exists",
//               "type": "bool"
//             }
//           ],
//           "internalType": "struct EvidenceRegistry.EvidenceRecord[]",
//           "name": "records",
//           "type": "tuple[]"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "journalist",
//           "type": "address"
//         }
//       ],
//       "name": "getJournalistInfo",
//       "outputs": [
//         {
//           "internalType": "bool",
//           "name": "registered",
//           "type": "bool"
//         },
//         {
//           "internalType": "string",
//           "name": "alias_",
//           "type": "string"
//         },
//         {
//           "internalType": "uint256",
//           "name": "submissionCount",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "",
//           "type": "address"
//         }
//       ],
//       "name": "isJournalist",
//       "outputs": [
//         {
//           "internalType": "bool",
//           "name": "",
//           "type": "bool"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "",
//           "type": "address"
//         }
//       ],
//       "name": "journalistAlias",
//       "outputs": [
//         {
//           "internalType": "string",
//           "name": "",
//           "type": "string"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "journalist",
//           "type": "address"
//         }
//       ],
//       "name": "revokeJournalist",
//       "outputs": [],
//       "stateMutability": "nonpayable",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "bytes32",
//           "name": "_hash",
//           "type": "bytes32"
//         },
//         {
//           "internalType": "string",
//           "name": "_ipfsCID",
//           "type": "string"
//         },
//         {
//           "internalType": "uint8",
//           "name": "_evidenceType",
//           "type": "uint8"
//         },
//         {
//           "internalType": "string",
//           "name": "_category",
//           "type": "string"
//         },
//         {
//           "internalType": "string",
//           "name": "_title",
//           "type": "string"
//         }
//       ],
//       "name": "submitEvidence",
//       "outputs": [],
//       "stateMutability": "nonpayable",
//       "type": "function"
//     },
//     {
//       "inputs": [],
//       "name": "totalEvidence",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "bytes32",
//           "name": "_hash",
//           "type": "bytes32"
//         }
//       ],
//       "name": "verifyEvidence",
//       "outputs": [
//         {
//           "internalType": "bool",
//           "name": "",
//           "type": "bool"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function"
//     }
// ];

// export function getContract(signerOrProvider) {
//   return new ethers.Contract(
//     CONTRACT_ADDRESS,
//     CONTRACT_ABI,
//     signerOrProvider
//   );
// }

// import abiData from "../abi/EvidenceRegistry.json";

import abiData from "../abi/EvidenceRegistry.json"
export const CONTRACT_ADDRESS = abiData.address;

export const CONTRACT_ABI = abiData.abi;

export const CHAIN_ID = Number(abiData.chainId);
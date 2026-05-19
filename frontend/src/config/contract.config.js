// src/config/contract.config.js

import deploymentInfo from "../abi/EvidenceRegistry.json";

export const CONTRACT_ADDRESS = deploymentInfo.address;
export const CONTRACT_ABI     = deploymentInfo.abi;

// FIX: derive from deployment JSON; fall back to Sepolia if not set
export const CHAIN_ID = deploymentInfo.chainId ?? 11155111;

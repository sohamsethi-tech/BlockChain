// scripts/test-query.js
const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  const contract = EvidenceRegistry.attach(contractAddress);

  const admin = await contract.deployerAdmin();
  console.log("Admin address from contract:", admin);

  const total = await contract.totalEvidence();
  console.log("Total evidence records:", total.toString());

  const info = await contract.getJournalistInfo(admin);
  console.log("Admin journalist info - Registered:", info.registered, "Alias:", info.alias_, "Count:", info.submissionCount.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// scripts/test-submit.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  const contract = EvidenceRegistry.attach(contractAddress);

  // 1. Submit a sample evidence record
  console.log("Submitting test evidence from:", deployer.address);
  const sampleHash = ethers.id("test-file-content-1"); // SHA-256 equivalent/mock
  const ipfsCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oct3fdxhw1g74m|test-file.txt"; // composite string CID|filename
  const evidenceType = 2; // Document
  const category = "Corruption";
  const title = "Government Overspend Report 2026";

  const tx = await contract.submitEvidence(
    sampleHash,
    ipfsCID,
    evidenceType,
    category,
    title
  );
  await tx.wait(1);
  console.log("Evidence submitted successfully! Tx hash:", tx.hash);

  // 2. Query/Verify the evidence
  const exists = await contract.verifyEvidence(sampleHash);
  console.log("Evidence exists on chain:", exists);

  const record = await contract.getEvidence(sampleHash);
  console.log("Evidence Details:");
  console.log(" - Hash:", record.evidenceHash);
  console.log(" - IPFS CID | Filename:", record.ipfsCID);
  console.log(" - Type:", record.evidenceType);
  console.log(" - Category:", record.category);
  console.log(" - Title:", record.title);
  console.log(" - Submitter:", record.submitter);

  // 3. Paginated query
  const page = await contract.getEvidencePage(0, 10);
  console.log("Fetched newest-first page of evidence (count):", page.length);
  console.log("Page first item title:", page[0].title);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// scripts/deploy.js
// Run:
//   Terminal 1:  npx hardhat node
//   Terminal 2:  npx hardhat run scripts/deploy.js --network localhost

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying EvidenceRegistry...");
  console.log("   Deployer (admin):", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "ETH");

  const Factory  = await ethers.getContractFactory("EvidenceRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("\n✅ EvidenceRegistry deployed at:", address);
  console.log("   Admin address:", deployer.address);
  console.log("   Chain ID:", chainId);

  // ── Load raw artifact ──────────────────────────────────────────────────────
  // __dirname = <project-root>/scripts
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const output = {
    address,
    chainId,
    deployedAt: new Date().toISOString(),
    deployer:   deployer.address,
    abi:        artifact.abi,
  };

  // ── Write to frontend/src/abi/ ─────────────────────────────────────────────
  // Path: <project-root>/frontend/src/abi/EvidenceRegistry.json
  const outPath = path.join(
    __dirname,
    "../frontend/src/abi/EvidenceRegistry.json"
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log("\n📁 ABI + address written to:");
  console.log("   ", outPath);
  console.log("\n🎉 Done. Run: cd frontend && npm run dev");
}

main().catch((e) => { console.error(e); process.exit(1); });
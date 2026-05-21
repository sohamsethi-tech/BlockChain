# EvidenceChain — Decentralized Evidence Verification for Journalism

EvidenceChain is a blockchain-based decentralized evidence verification platform designed for transparent journalism. It enables journalists to submit research, documents, videos, and images, pinning the media assets to IPFS via Pinata while securing their cryptographic hashes (SHA-256) and CIDs on-chain. Users can drag-and-drop any source file to verify its timestamp, submitter identity, and historical authenticity.

---

## 🛠️ Architecture & Changes Implemented

### 1. Smart Contract (`EvidenceRegistry.sol`)
* **Role Management**: Setup roles for Admin (Deployer) and registered Journalists.
* **Immutable Registry**: Log evidence records containing the SHA-256 hash (`bytes32`), composite IPFS CID & filename (`string`), category, title, timestamp, and journalist address.
* **Paginated Lookup**: Implemented a reverse-chronological pagination function (`getEvidencePage`) to list the latest submissions first.
* **Submissions Lookup**: Added query functions to filter evidence by journalist addresses.

### 2. Services & React Hooks (`frontend/src`)
* **IPFS Pinning Service (`ipfs.service.js`)**: Configured Pinata API file pinning using `VITE_PINATA_JWT` authorization, removing obsolete dependencies and supporting direct multipart form uploads.
* **Evidence Core Hook (`useEvidence.js`)**:
  * Added SHA-256 local hashing using a browser crypto library.
  * Formatted the IPFS field as `IPFS_CID|filename` to store original filenames on-chain without schema changes.
  * Normalizes on-chain BigInts, structs, and timestamps into clean JS objects.

### 3. Frontend Routes & Premium Layouts
* **Navigation (`WalletBar.jsx`)**: Responsive wallet connection status, role display tags (`Admin`, `Journalist`, `Public User`), and clean page routing.
* **Core Views**:
  * **Landing (`LandingPage.jsx`)**: Hero presentation with dynamic platform counters and protocol flows.
  * **Explore (`EvidenceFeed.jsx`)**: Multi-faceted real-time searching/filtering across titles, hashes, journalists, and filenames.
  * **Details (`EvidenceDetails.jsx`)**: Direct IPFS resource download links, certificate validation, and local file verifier.
  * **Verify (`VerifyPage.jsx`)**: Drag-and-drop panel to instantly match local file checksums against the on-chain registry.
  * **Submit (`SubmitPage.jsx`)**: Restricted submitting interface for registered journalists with live upload status reports.
  * **Dashboard (`Dashboard.jsx`)**: Wallet overview, journalist status, registration details, and personal submission tables.
  * **Journalist Profile (`JournalistProfile.jsx`)**: Public page highlighting the submission catalogs and metrics of specific wallets.
  * **Admin Panel (`AdminPage.jsx`)**: Clean interface for the deployer to register or revoke journalist wallets.

---

## 🚀 Step-by-Step Demo Setup Guide

Follow these steps to run a local demo with MetaMask integration:

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MetaMask Extension](https://metamask.io/) installed in your browser.

---

### Step 1: Start the Local Hardhat Node
In the project root folder, run:
```bash
npx hardhat node
```
*This starts a local EVM blockchain running on `http://127.0.0.1:8545` and prints 20 development accounts with their private keys (each with 10,000 mock ETH).*

---

### Step 2: Deploy the Smart Contract
In a new terminal window, deploy the registry contract to the local network:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
*This compiles the contracts, deploys the `EvidenceRegistry` contract, and saves the address and ABI to `frontend/src/abi/EvidenceRegistry.json`.*

---

### Step 3: Run the Frontend App
Navigate to the `frontend` folder and start the Vite dev server:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

### Step 4: Configure MetaMask for Localhost
1. Open the MetaMask extension.
2. Add a new custom network:
   * **Network Name**: Hardhat Local
   * **RPC URL**: `http://127.0.0.1:8545`
   * **Chain ID**: `31337`
   * **Currency Symbol**: ETH
3. Import the private keys for two accounts from the Hardhat console output:
   * **Account #0 (Contract Admin)**:
     * Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   * **Account #1 (Journalist)**:
     * Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

### Step 5: Perform the End-to-End Demo

1. **Connect & Register a Journalist**:
   * Connect MetaMask using the **Admin Account** (Account #0).
   * Navigate to the Admin Panel page (`/admin`).
   * Paste the address of **Account #1 (Journalist)** in the wallet address input, give it an alias (e.g., *Jane Doe - Reuters*), and click **Register Journalist**.
   * Confirm the transaction in MetaMask.

2. **Submit Evidence**:
   * Switch your MetaMask account to the **Journalist Account** (Account #1).
   * Go to the **Submit** page (`/submit`).
   * Select a test file from your computer (e.g., an image or PDF document), fill out the Title and Category, and click **Submit Evidence**.
   * Approve the MetaMask transaction. Once mined, you will be redirected to the detailed certificate view.

3. **Verify File Authenticity**:
   * Go to the **Verify** page (`/verify`).
   * Drag-and-drop the **exact same file** you just uploaded. The application will compute the SHA-256 hash locally in your browser and compare it with the blockchain.
   * You should see a green **"VERIFIED AUTHENTIC"** banner matching the block timestamp, title, and journalist.
   * Try modifying even a single character in the file and drag it in again — it will instantly show a **"Not Found/Unverified"** status, showing the cryptographic tamper-proofing.

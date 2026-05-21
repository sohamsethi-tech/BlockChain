// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function LandingPage() {
  const { getContract, address } = useWallet();
  const [totalEvidence, setTotalEvidence] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const contract = await getContract(false);
        const total = await contract.totalEvidence();
        setTotalEvidence(Number(total));
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [getContract]);

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-badge">EvidenceChain Protocol</div>
        <h1 className="hero-title">
          Truth is Immutable. <br />
          <span className="gradient-text">Evidence is Decentralized.</span>
        </h1>
        <p className="hero-subtitle">
          An open, immutable ledger for independent journalism. Anchoring evidence files to the blockchain and IPFS, enabling public verification without intermediaries.
        </p>

        <div className="hero-actions">
          <Link to="/explore" className="btn btn--primary btn--lg">
            Explore Ledger
          </Link>
          <Link to="/verify" className="btn btn--secondary btn--lg">
            Verify a File
          </Link>
        </div>
      </header>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="stats-card">
          <div className="stats-number">
            {loadingStats ? <span className="spinner spinner--sm" /> : totalEvidence ?? 0}
          </div>
          <div className="stats-label">Evidence Submissions Anchored</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">100%</div>
          <div className="stats-label">Immutable & Censorship Resistant</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">IPFS</div>
          <div className="stats-label">Decentralized Storage via Pinata</div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="landing-features">
        <h2 className="section-title">Core Protocol Capabilities</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✍️</div>
            <h3>For Journalists</h3>
            <p>
              Upload primary sources, images, audio, or PDFs to IPFS via Pinata. Securely anchor the file hashes to the blockchain using your MetaMask wallet.
            </p>
            <Link to="/submit" className="feature-link">
              Submit Evidence &rarr;
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>For the Public</h3>
            <p>
              Search, filter, and inspect the public ledger of evidence. View origin timestamps, submitting journalists, and read/download primary sources.
            </p>
            <Link to="/explore" className="feature-link">
              Search Ledger &rarr;
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Instant Verification</h3>
            <p>
              Drag and drop any file to verify its authenticity. The system hashes the file in your browser and compares it to the on-chain registry instantly.
            </p>
            <Link to="/verify" className="feature-link">
              Verify Authenticity &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-flow">
        <h2 className="section-title">How EvidenceChain Works</h2>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-num">1</div>
            <h4>Local Hashing</h4>
            <p>The file is hashed locally inside the browser using SHA-256 before any upload.</p>
          </div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <h4>IPFS Pinning</h4>
            <p>The source file is pinned to IPFS, ensuring decentralized, distributed hosting.</p>
          </div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <h4>On-Chain Anchor</h4>
            <p>The file hash, title, and IPFS CID are stored permanently on the blockchain registry.</p>
          </div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <h4>Open Verification</h4>
            <p>Anyone can download the source file, verify its hash, and confirm the timestamped proof.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

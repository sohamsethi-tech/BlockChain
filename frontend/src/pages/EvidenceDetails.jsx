// src/pages/EvidenceDetails.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { getIPFSUrl } from "../utils/ipfs.gateway";
import { computeFileSHA256 } from "../hooks/useEvidence";

export default function EvidenceDetails({ evidence }) {
  const { hash } = useParams();
  const { getContract } = useWallet();
  const { fetchEvidenceByHash, loading, error } = evidence;

  const [record, setRecord] = useState(null);
  const [journalistAlias, setJournalistAlias] = useState("");
  const [journalistSubmissions, setJournalistSubmissions] = useState(0);

  // File verifier states
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // 'success' | 'fail'
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    async function loadRecord() {
      const rec = await fetchEvidenceByHash(hash);
      if (rec) {
        setRecord(rec);
        // Load journalist alias & stats
        try {
          const contract = await getContract(false);
          const [_, alias_, count] = await contract.getJournalistInfo(rec.submitter);
          setJournalistAlias(alias_ || "Anonymous Journalist");
          setJournalistSubmissions(Number(count));
        } catch (e) {
          console.warn("Failed to load journalist info:", e);
        }
      }
    }
    loadRecord();
  }, [hash, fetchEvidenceByHash, getContract]);

  const handleVerifyFile = async (file) => {
    if (!file || !record) return;
    setVerifyFile(file);
    setVerifying(true);
    setVerifyResult(null);
    try {
      const computed = await computeFileSHA256(file);
      setVerifyHash(computed);
      // Clean hash from record (hex bytes32 format might have 0x)
      const cleanOnChainHash = record.evidenceHash.replace(/^0x/, "").toLowerCase();
      const cleanComputedHash = computed.toLowerCase();

      if (cleanOnChainHash === cleanComputedHash) {
        setVerifyResult("success");
      } else {
        setVerifyResult("fail");
      }
    } catch (err) {
      console.error(err);
      setVerifyResult("error");
    } finally {
      setVerifying(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) {
      handleVerifyFile(e.dataTransfer.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p>Loading evidence details from blockchain ledger…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="page-center">
        <div className="card card--gate">
          <div className="gate-icon">⚠️</div>
          <h2>Evidence Not Found</h2>
          <p>
            No record matches the requested SHA-256 hash on-chain. It may not be registered yet.
          </p>
          <p className="mono small break-all">{hash}</p>
          <Link to="/explore" className="btn btn--primary">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const cleanHash = record.evidenceHash.replace(/^0x/, "");
  const ipfsLink = getIPFSUrl(record.ipfsCID);

  return (
    <div className="page evidence-details-page">
      <div className="details-layout">
        
        {/* Left Column: Metadata & Source info */}
        <div className="details-main">
          <div className="details-header-section">
            <span className="category-tag">{record.category}</span>
            <h1>{record.title}</h1>
            <div className="timestamp-badge">
              ⛓️ Registered On-Chain: <strong>{record.dateStr}</strong>
            </div>
          </div>

          <div className="metadata-table card">
            <h2>Ledger Metadata</h2>
            <div className="meta-row">
              <span className="meta-label">On-Chain Hash (SHA-256)</span>
              <span className="meta-value mono break-all">{cleanHash}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">IPFS CIDv1</span>
              <span className="meta-value mono break-all">{record.ipfsCID}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Evidence Type</span>
              <span className="meta-value">
                {record.typeIcon} {record.typeLabel}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Original Filename</span>
              <span className="meta-value mono">{record.filename}</span>
            </div>
          </div>

          {/* Submitter Box */}
          <div className="submitter-card card">
            <h2>Journalist Signatory</h2>
            <div className="submitter-info-block">
              <div className="avatar-placeholder">✍️</div>
              <div className="submitter-text">
                <h3>{journalistAlias || "Registered Journalist"}</h3>
                <p className="mono small break-all">{record.submitter}</p>
                <div className="journalist-stats">
                  Total Submissions: <strong>{journalistSubmissions}</strong>
                </div>
                <Link to={`/journalist/${record.submitter}`} className="profile-link">
                  View Journalist Profile &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* IPFS Retrieval Card */}
          <div className="ipfs-card card">
            <h2>Source File Download</h2>
            <p>Retrieve the original, unedited primary source file directly from the IPFS network.</p>
            <a href={ipfsLink} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--lg btn--full">
              📥 Open/Download from IPFS Gateway
            </a>
            <span className="gateway-note">Hosted via Pinata Decentralized Storage. Gateway: ipfs.io</span>
          </div>
        </div>

        {/* Right Column: Local Verifier */}
        <div className="details-sidebar">
          <div className="verifier-widget card">
            <h2>Verify Authenticity</h2>
            <p className="verifier-desc">
              Have a copy of this file? Drag and drop it below to verify its integrity. The file is hashed entirely in your browser and compared to the on-chain value.
            </p>

            <div
              className={`dropzone verifier-dropzone ${dragOver ? "dragover" : ""} ${verifyFile ? "has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => handleVerifyFile(e.target.files[0])}
              />
              {verifyFile ? (
                <div className="file-preview">
                  <div className="file-icon">{record.typeIcon}</div>
                  <div className="file-info">
                    <strong>{verifyFile.name}</strong>
                    <span>{(verifyFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              ) : (
                <div className="dropzone-empty">
                  <span className="dropzone-icon">🛡️</span>
                  <strong>Drop copy to verify</strong>
                  <span>Supports any format</span>
                </div>
              )}
            </div>

            {/* Verification Result Display */}
            {verifying && (
              <div className="verification-status verifying">
                <div className="spinner spinner--sm" />
                <span>Generating SHA-256 hash locally…</span>
              </div>
            )}

            {!verifying && verifyResult === "success" && (
              <div className="verification-seal success">
                <div className="seal-badge">👑 AUTHENTICITY VERIFIED</div>
                <p>The local file matches the on-chain record perfectly. The source is original and has not been altered.</p>
                <div className="hash-compare">
                  <div>Computed SHA-256:</div>
                  <div className="mono small break-all">{verifyHash}</div>
                </div>
              </div>
            )}

            {!verifying && verifyResult === "fail" && (
              <div className="verification-seal fail">
                <div className="seal-badge">❌ VERIFICATION FAILED</div>
                <p>The local file does NOT match the registered on-chain hash. This file has been edited, corrupted, or is different.</p>
                <div className="hash-compare">
                  <div>On-chain:</div>
                  <div className="mono small break-all">{cleanHash}</div>
                  <div style={{ marginTop: "0.5rem" }}>Computed:</div>
                  <div className="mono small break-all">{verifyHash}</div>
                </div>
              </div>
            )}

            {!verifying && verifyResult === "error" && (
              <div className="verification-status error">
                Failed to process file hashing.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

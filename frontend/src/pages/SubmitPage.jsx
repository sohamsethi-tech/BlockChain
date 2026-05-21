// src/pages/SubmitPage.jsx

import React, { useState, useRef } from "react";
import { useWallet } from "../context/WalletContext";
import { EVIDENCE_TYPES, CATEGORIES, computeFileSHA256 } from "../hooks/useEvidence";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function SubmitPage({ evidence }) {
  const {
    address,
    isJournalist,
    journalistAlias,
    isCorrectChain,
    connectWallet,
    switchNetwork,
  } = useWallet();

  const { submitEvidence, submitting, submitStep, error, setError } = evidence;

  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [evidenceType, setEvidenceType] = useState(0);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef();

  // ── Handle file ─────────────────────────────────────────────
  const handleFile = async (f) => {
    if (!f) return;

    // File size guard (CRITICAL FIX)
    if (f.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 100MB.");
      return;
    }

    setFile(f);
    setFileHash("");
    setResult(null);
    setError(null);

    try {
      const hash = await computeFileSHA256(f);
      setFileHash(hash);
    } catch (e) {
      console.error("Hash failed:", e);
      setError("Failed to compute file hash.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    try {
      const res = await submitEvidence({
        file,
        title,
        category,
        evidenceType,
      });

      setResult(res);
      setFile(null);
      setFileHash("");
      setTitle("");

    } catch (e) {
      // FIX: do NOT swallow error silently
      console.error("submitEvidence failed:", e);
    }
  };

  // ── Guards ──────────────────────────────────────────────────

  if (!address) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">🔐</div>
        <h2>Connect Your Journalist Wallet</h2>
        <p>
          You need MetaMask connected to submit evidence.
          Your wallet is your on-chain identity.
        </p>
        <button className="btn btn--primary btn--lg" onClick={connectWallet}>
          Connect MetaMask
        </button>
      </div>
    </div>
  );

  if (!isCorrectChain) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">⛓️</div>
        <h2>Wrong Network</h2>
        <p>Switch MetaMask to Sepolia (Chain ID 11155111).</p>
        <button className="btn btn--primary btn--lg" onClick={switchNetwork}>
          Switch Network
        </button>
      </div>
    </div>
  );

  if (!isJournalist) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">🪪</div>
        <h2>Not Registered</h2>
        <p>Your wallet is not registered as a journalist.</p>
        <p className="mono small">{address}</p>
      </div>
    </div>
  );

  // ── Success Screen ──────────────────────────────────────────

  if (result) return (
    <div className="page">
      <div className="card card--success">
        <div className="success-icon">✅</div>

        <h2>Evidence Registered On-Chain</h2>

        <div className="result-grid">

          <div className="result-row">
            <span className="label">Filename</span>
            <span className="mono">{result.filename}</span>
          </div>

          <div className="result-row">
            <span className="label">SHA-256</span>
            <span className="mono small break-all">
              {result.sha256}
            </span>
          </div>

          <div className="result-row">
            <span className="label">Block</span>
            <span className="mono">#{result.blockNumber}</span>
          </div>

          <div className="result-row">
            <span className="label">Tx</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mono small break-all"
            >
              {result.txHash}
            </a>
          </div>

          {/* FIX: Show IPFS link */}
          {result.ipfsCID && (
            <div className="result-row">
              <span className="label">IPFS</span>
              <a
                href={result.ipfsUrl}
                target="_blank"
                rel="noreferrer"
              >
                View File
              </a>
            </div>
          )}

        </div>

        <button
          className="btn btn--primary"
          onClick={() => setResult(null)}
        >
          Submit Another
        </button>
      </div>
    </div>
  );

  // ── Form ───────────────────────────────────────────────────

  return (
    <div className="page">

      <div className="page-header">
        <h1>Submit Evidence</h1>
        <p className="subtitle">
          Submitting as <strong>{journalistAlias || address.slice(0, 10) + "…"}</strong>.
          The file is pinned to IPFS, and its SHA-256 hash is permanently registered on-chain.
        </p>
      </div>

      <div className="submit-form">

        {/* Drop Zone */}
        <div
          className={`dropzone ${dragOver ? "dragover" : ""} ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="file-preview">
              <strong>{file.name}</strong>

              <span>{(file.size / 1024).toFixed(1)} KB</span>

              {fileHash ? (
                <span className="mono tiny">
                  SHA-256: {fileHash.slice(0, 20)}…
                </span>
              ) : (
                <span className="mono tiny">Computing hash…</span>
              )}

              <button
                className="btn btn--ghost btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setFileHash("");
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="dropzone-empty">
              <span className="dropzone-icon">📁</span>
              <strong>Drop file here or click to browse</strong>
              <span>Images, videos, documents, audio — any format</span>
              <span className="dropzone-note">
                The file is hashed locally and then pinned securely to decentralized IPFS storage
              </span>
            </div>
          )}
        </div>

        {/* Type */}
        <div className="field">
          <label>Evidence Type</label>
          <div className="type-buttons">
            {EVIDENCE_TYPES.map((t) => (
              <button
                key={t.value}
                className={evidenceType === t.value ? "active" : ""}
                onClick={() => setEvidenceType(t.value)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="field">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        {submitting ? (
          <div className="submit-progress">
            <div className="spinner" />
            <span>{submitStep}</span>
          </div>
        ) : (
          <button
            className="btn btn--primary btn--full"
            disabled={!file || !title || !fileHash}
            onClick={handleSubmit}
          >
            Register Evidence
          </button>
        )}

        <p className="submit-note">
          MetaMask will ask you to sign a transaction. The file is uploaded securely to IPFS and its cryptographic hash is locked on-chain.
        </p>
      </div>
    </div>
  );
}
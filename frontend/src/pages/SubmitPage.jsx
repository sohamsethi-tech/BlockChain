// src/pages/SubmitPage.jsx
// Journalist-only. File stays on device.
// Submits: SHA-256 hash + filename + metadata → blockchain via MetaMask.

import React, { useState, useRef } from "react";
import { useWallet } from "../context/WalletContext";
import { EVIDENCE_TYPES, CATEGORIES, computeFileSHA256 } from "../hooks/useEvidence";

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

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setFileHash("");
    setResult(null);
    setError(null);
    const hash = await computeFileSHA256(f);
    setFileHash(hash);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    try {
      const res = await submitEvidence({ file, title, category, evidenceType });
      setResult(res);
      setFile(null);
      setFileHash("");
      setTitle("");
    } catch (_) { }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!address) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">🔐</div>
        <h2>Connect Your Journalist Wallet</h2>
        <p>
          You need MetaMask connected to submit evidence.
          Your wallet is your on-chain identity — every submission is signed by you.
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
        <p>Please switch MetaMask to the Sepolia Test network (Chain ID 11155111).</p>
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
        <p>Your wallet is not registered as a journalist on this network.</p>
        <p className="mono small">{address}</p>
        <p>Ask your organization's admin to register your wallet via the Admin panel.</p>
      </div>
    </div>
  );

  // ── Success screen ─────────────────────────────────────────────────────────

  if (result) return (
    <div className="page">
      <div className="card card--success">
        <div className="success-icon">✅</div>
        <h2>Evidence Registered On-Chain</h2>
        <p className="success-sub">
          The file's SHA-256 hash is now permanently recorded on the blockchain.
          Keep the original file — it's your proof.
        </p>
        <div className="result-grid">
          <div className="result-row">
            <span className="label">Filename</span>
            <span className="mono">{result.filename}</span>
          </div>
          <div className="result-row">
            <span className="label">SHA-256</span>
            <span className="mono small break-all">{result.sha256}</span>
          </div>
          <div className="result-row">
            <span className="label">Block</span>
            <span className="mono">#{result.blockNumber}</span>
          </div>

          <div className="result-row">
            <span className="label">Tx Hash</span>
            <a
              className="mono small break-all"
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noreferrer">
              {result.txHash}
            </a>
          </div>




        </div>
        <p className="submit-note">
          💡 To prove authenticity later: share the original file with a colleague
          and have them use the Verify page to confirm it matches this on-chain record.
        </p>
        <button className="btn btn--primary" onClick={() => setResult(null)}>
          Submit Another
        </button>
      </div>
    </div>
  );

  // ── Submit form ────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="page-header">
        <h1>Submit Evidence</h1>
        <p className="subtitle">
          Submitting as <strong>{journalistAlias || address.slice(0, 10) + "…"}</strong>.
          The file's SHA-256 hash is recorded on-chain. The file itself stays on your device.
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
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="file-preview">
              <div className="file-icon">{EVIDENCE_TYPES[evidenceType]?.icon}</div>
              <div className="file-info">
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                {fileHash ? (
                  <span className="mono tiny" title={fileHash}>
                    SHA-256: {fileHash.slice(0, 32)}…
                  </span>
                ) : (
                  <span className="mono tiny">Computing hash…</span>
                )}
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={(e) => { e.stopPropagation(); setFile(null); setFileHash(""); }}
              >✕</button>
            </div>
          ) : (
            <div className="dropzone-empty">
              <span className="dropzone-icon">📁</span>
              <strong>Drop file here or click to browse</strong>
              <span>Images, videos, documents, audio — any format</span>
              <span className="dropzone-note">
                The file is hashed in your browser and never uploaded anywhere
              </span>
            </div>
          )}
        </div>

        {/* Evidence Type */}
        <div className="field">
          <label>Evidence Type</label>
          <div className="type-buttons">
            {EVIDENCE_TYPES.map((t) => (
              <button
                key={t.value}
                className={`type-btn ${evidenceType === t.value ? "active" : ""}`}
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
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="field">
          <label>Title / Description</label>
          <input
            type="text"
            placeholder="Brief description of this evidence…"
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
            className="btn btn--primary btn--lg btn--full"
            onClick={handleSubmit}
            disabled={!file || !title.trim() || !fileHash}
          >
            Register Evidence on Blockchain
          </button>
        )}

        <p className="submit-note">
          MetaMask will ask you to sign a transaction. Gas fees are negligible on
          Sepolia testnet. No file data leaves your device.
        </p>
      </div>
    </div>
  );
}
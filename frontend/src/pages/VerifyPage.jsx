// src/pages/VerifyPage.jsx
// Anyone can verify. No wallet needed.
// Drop a file → hash computed in browser → checked against chain.
// Or paste a SHA-256 hash directly.

import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { computeFileSHA256 } from "../hooks/useEvidence";

export default function VerifyPage({ evidence }) {
  const { verifyFile, verifyHash, verifying, error } = evidence;

  const [mode,       setMode]       = useState("file"); // "file" | "hash"
  const [file,       setFile]       = useState(null);
  const [hashInput,  setHashInput]  = useState("");
  const [result,     setResult]     = useState(null);
  const [localHash,  setLocalHash]  = useState("");
  const inputRef = useRef();

  const handleFileChange = async (f) => {
    setFile(f);
    setResult(null);
    if (f) {
      const h = await computeFileSHA256(f);
      setLocalHash(h);
    }
  };

  const handleVerify = async () => {
    setResult(null);
    if (mode === "file" && file) {
      const res = await verifyFile(file);
      setResult(res);
    } else if (mode === "hash" && hashInput.trim()) {
      const res = await verifyHash(hashInput.trim().replace("0x", ""));
      setResult(res);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Verify Evidence</h1>
        <p className="subtitle">
          Prove a file's authenticity by checking its SHA-256 hash against
          the immutable on-chain registry. No login required.
          The file is never uploaded during verification — it's hashed entirely in your browser.
        </p>
      </div>

      <div className="verify-card card">
        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "file" ? "active" : ""}`}
            onClick={() => { setMode("file"); setResult(null); }}
          >📁 Verify a File</button>
          <button
            className={`mode-btn ${mode === "hash" ? "active" : ""}`}
            onClick={() => { setMode("hash"); setResult(null); }}
          >🔑 Verify a Hash</button>
        </div>

        {mode === "file" ? (
          <div className="verify-file-section">
            <div
              className={`dropzone ${file ? "has-file" : ""}`}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              {file ? (
                <div className="file-preview">
                  <span className="file-icon">📎</span>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <span className="mono tiny">{localHash.slice(0, 40)}…</span>
                  </div>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                      setLocalHash("");
                    }}
                  >✕</button>
                </div>
              ) : (
                <div className="dropzone-empty">
                  <span className="dropzone-icon">🔍</span>
                  <strong>Drop the file you want to verify</strong>
                  <span>The file is hashed in your browser — it is never uploaded</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="verify-hash-section">
            <input
              className="hash-input"
              type="text"
              placeholder="Paste SHA-256 hash (64 hex characters)…"
              value={hashInput}
              onChange={(e) => { setHashInput(e.target.value); setResult(null); }}
              spellCheck={false}
            />
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        <button
          className="btn btn--primary btn--lg btn--full"
          onClick={handleVerify}
          disabled={verifying || (mode === "file" ? !file : !hashInput.trim())}
        >
          {verifying ? (
            <><div className="spinner spinner--sm" /> Checking blockchain…</>
          ) : "Verify Against Blockchain"}
        </button>

        {result && (
          <div className={`verify-result ${result.verified ? "verified" : "not-found"}`}>
            {result.verified ? (
              <>
                <div className="result-status">
                  <span className="result-icon">✅</span>
                  <strong>Verified — This evidence is on-chain</strong>
                </div>
                <div className="result-record">
                  <div className="detail-row">
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{result.record.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{result.record.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Submitted</span>
                    <span className="detail-value">{result.record.dateStr}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Journalist</span>
                    <span className="detail-value mono">{result.record.submitter}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Filename</span>
                    <span className="detail-value mono">{result.record.filename}</span>
                  </div>
                  {result.sha256 && (
                    <div className="detail-row">
                      <span className="detail-label">SHA-256</span>
                      <span className="detail-value mono tiny break-all">{result.sha256}</span>
                    </div>
                  )}
                  
                  <div className="detail-action-link" style={{ marginTop: "1.5rem" }}>
                    <Link
                      to={`/evidence/${(result.sha256 || result.record.evidenceHash).replace(/^0x/, "")}`}
                      className="btn btn--secondary btn--full text-center"
                      style={{ display: "block" }}
                    >
                      🛡️ View Full Evidence Details & Download Source
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="result-status">
                <span className="result-icon">❌</span>
                <div>
                  <strong>Not found on-chain</strong>
                  <p>This file's hash does not match any registered evidence record.</p>
                  {result.sha256 && (
                    <span className="mono tiny break-all">{result.sha256}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
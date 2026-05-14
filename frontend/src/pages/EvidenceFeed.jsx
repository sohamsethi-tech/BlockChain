// src/pages/EvidenceFeed.jsx
// Public read-only registry feed. No IPFS links.
// Shows: title, category, type, submitter, date, filename, hash.

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";

const PAGE_SIZE = 12;

export default function EvidenceFeed({ evidence }) {
  const { address } = useWallet();
  const { fetchEvidencePage, loading } = evidence;

  const [records,  setRecords]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [offset,   setOffset]   = useState(0);
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async (off = 0) => {
    const res = await fetchEvidencePage(off, PAGE_SIZE);
    setRecords(res.records);
    setTotal(res.total);
    setOffset(off);
  }, [fetchEvidencePage]);

  useEffect(() => { load(0); }, [load]);

  const categories = ["all", ...new Set(records.map((r) => r.category))];
  const filtered   = filter === "all" ? records : records.filter((r) => r.category === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Evidence Registry</h1>
        <p className="subtitle">
          {total} record{total !== 1 ? "s" : ""} immutably stored on-chain.
          Each entry's SHA-256 hash was signed by the journalist who filed it.
        </p>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-btn ${filter === c ? "active" : ""}`}
            onClick={() => setFilter(c)}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
        <button className="btn btn--ghost btn--sm refresh-btn" onClick={() => load(offset)}>
          ↺ Refresh
        </button>
      </div>

      {loading ? (
        <div className="feed-loading">
          <div className="spinner" />
          <span>Reading from blockchain…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="feed-empty">
          <span>No evidence records found.</span>
        </div>
      ) : (
        <div className="evidence-grid">
          {filtered.map((r, i) => (
            <EvidenceCard
              key={r.evidenceHash + i}
              record={r}
              expanded={expanded === r.evidenceHash}
              onToggle={() =>
                setExpanded(expanded === r.evidenceHash ? null : r.evidenceHash)
              }
              currentUser={address}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="pagination">
          <button
            className="btn btn--ghost"
            disabled={offset === 0}
            onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
          >← Newer</button>
          <span className="pagination__info">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <button
            className="btn btn--ghost"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => load(offset + PAGE_SIZE)}
          >Older →</button>
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ record, expanded, onToggle, currentUser }) {
  const isOwn = currentUser &&
    record.submitter.toLowerCase() === currentUser.toLowerCase();

  const shortSubmitter = `${record.submitter.slice(0, 8)}…${record.submitter.slice(-6)}`;
  const shortHash      = `${record.evidenceHash.slice(0, 14)}…`;

  return (
    <div className={`evidence-card ${expanded ? "expanded" : ""} ${isOwn ? "own" : ""}`}>
      <div className="evidence-card__header" onClick={onToggle}>
        <div className="evidence-card__type">
          <span className="type-icon">{record.typeIcon}</span>
          <span className="type-label">{record.typeLabel}</span>
        </div>
        <div className="evidence-card__meta">
          <span className="category-tag">{record.category}</span>
          {isOwn && <span className="own-tag">Yours</span>}
        </div>
      </div>

      <div className="evidence-card__body">
        <h3 className="evidence-card__title">{record.title}</h3>
        <div className="evidence-card__details">
          <div className="detail-row">
            <span className="detail-label">Submitted</span>
            <span className="detail-value">{record.dateStr}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">By</span>
            <span className="detail-value mono">{shortSubmitter}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Hash</span>
            <span className="detail-value mono">{shortHash}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="evidence-card__expanded">
          <div className="detail-row">
            <span className="detail-label">Filename</span>
            <span className="detail-value mono">{record.filename}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Full SHA-256</span>
            <span className="detail-value mono tiny break-all">{record.evidenceHash}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Submitter</span>
            <span className="detail-value mono tiny break-all">{record.submitter}</span>
          </div>
          <div className="evidence-card__actions">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                navigator.clipboard.writeText(record.evidenceHash);
              }}
            >
              📋 Copy Hash
            </button>
          </div>
        </div>
      )}

      <button className="evidence-card__toggle" onClick={onToggle}>
        {expanded ? "▲ Less" : "▼ More"}
      </button>
    </div>
  );
}
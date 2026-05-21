// src/pages/EvidenceFeed.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

const PAGE_SIZE = 24; // Fetch more records to allow effective client-side filtering

export default function EvidenceFeed({ evidence }) {
  const { address } = useWallet();
  const { fetchEvidencePage, loading } = evidence;

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (off = 0) => {
    const res = await fetchEvidencePage(off, PAGE_SIZE);
    setRecords(res.records);
    setTotal(res.total);
    setOffset(off);
  }, [fetchEvidencePage]);

  useEffect(() => {
    load(0);
  }, [load]);

  const categories = ["all", ...new Set(records.map((r) => r.category))];

  const filtered = records.filter((r) => {
    // Category filter
    const matchesCategory = filter === "all" || r.category === filter;
    
    // Search query filter (title, hash, address, or filename)
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const cleanHash = r.evidenceHash.replace(/^0x/, "").toLowerCase();
    const matchesTitle = r.title.toLowerCase().includes(q);
    const matchesHash = cleanHash.includes(q);
    const matchesSubmitter = r.submitter.toLowerCase().includes(q);
    const matchesFilename = r.filename.toLowerCase().includes(q);

    return matchesCategory && (matchesTitle || matchesHash || matchesSubmitter || matchesFilename);
  });

  return (
    <div className="page explore-page">
      <div className="page-header">
        <h1>Evidence Ledger</h1>
        <p className="subtitle">
          {total} record{total !== 1 ? "s" : ""} registered on the immutable blockchain.
          Search and verify primary sources anchored to IPFS.
        </p>
      </div>

      {/* Search and Filter Container */}
      <div className="search-filter-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, SHA-256 hash, or journalist address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-btn ${filter === c ? "active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c === "all" ? "All Categories" : c}
            </button>
          ))}
          <button className="btn btn--ghost btn--sm refresh-btn" onClick={() => load(offset)}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="feed-loading">
          <div className="spinner" />
          <span>Reading ledger records from blockchain…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="feed-empty card">
          <span>No matching evidence records found. Try modifying your search or filters.</span>
        </div>
      ) : (
        <div className="evidence-grid">
          {filtered.map((r, i) => (
            <EvidenceCard
              key={r.evidenceHash + i}
              record={r}
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
            {offset + 1}–{offset + records.length} of {total}
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

function EvidenceCard({ record, currentUser }) {
  const isOwn = currentUser &&
    record.submitter.toLowerCase() === currentUser.toLowerCase();

  const shortSubmitter = `${record.submitter.slice(0, 8)}…${record.submitter.slice(-6)}`;
  const cleanHash = record.evidenceHash.replace(/^0x/, "");
  const shortHash = `${cleanHash.slice(0, 16)}…`;

  return (
    <div className={`evidence-card ${isOwn ? "own" : ""}`}>
      <div className="evidence-card__header">
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
        <h3 className="evidence-card__title">
          <Link to={`/evidence/${cleanHash}`}>{record.title}</Link>
        </h3>
        
        <div className="evidence-card__details">
          <div className="detail-row">
            <span className="detail-label">File</span>
            <span className="detail-value mono truncate" title={record.filename}>{record.filename}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">On-chain Date</span>
            <span className="detail-value">{record.dateStr}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">By</span>
            <Link to={`/journalist/${record.submitter}`} className="detail-value mono link-style">
              {shortSubmitter}
            </Link>
          </div>
          <div className="detail-row">
            <span className="detail-label">SHA-256</span>
            <span className="detail-value mono" title={cleanHash}>{shortHash}</span>
          </div>
        </div>

        <div className="evidence-card__actions" style={{ marginTop: "1.25rem" }}>
          <Link to={`/evidence/${cleanHash}`} className="btn btn--secondary btn--sm btn--full text-center" style={{ display: "block" }}>
            🛡️ View & Verify Evidence
          </Link>
        </div>
      </div>
    </div>
  );
}
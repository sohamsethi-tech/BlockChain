// src/pages/JournalistProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function JournalistProfile({ evidence }) {
  const { addr } = useParams();
  const { getContract } = useWallet();
  const { fetchBySubmitter, loading } = evidence;

  const [aliasName, setAliasName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [checkingInfo, setCheckingInfo] = useState(true);

  useEffect(() => {
    async function loadJournalistProfile() {
      setCheckingInfo(true);
      try {
        const contract = await getContract(false);
        const [registered, alias_, count] = await contract.getJournalistInfo(addr);
        setIsRegistered(registered);
        setAliasName(alias_ || "Anonymous Journalist");
        setTotalCount(Number(count));

        // Fetch submissions
        const list = await fetchBySubmitter(addr);
        // Sort newest first
        const sorted = [...list].sort((a, b) => b.timestamp - a.timestamp);
        setSubmissions(sorted);
      } catch (err) {
        console.error("Failed to load journalist profile:", err);
      } finally {
        setCheckingInfo(false);
      }
    }

    if (addr) {
      loadJournalistProfile();
    }
  }, [addr, getContract, fetchBySubmitter]);

  if (checkingInfo) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p>Loading journalist profile details…</p>
      </div>
    );
  }

  return (
    <div className="page journalist-profile-page">
      <div className="profile-header card">
        <div className="profile-badge-icon">🪪</div>
        <div className="profile-meta-info">
          <span className="profile-status-tag">
            {isRegistered ? "Verified Journalist Registry" : "Public Address Profile"}
          </span>
          <h1>{isRegistered ? aliasName : "Unregistered Address"}</h1>
          <p className="mono small break-all text-muted">{addr}</p>

          <div className="profile-stats-row">
            <div className="p-stat-box">
              <span className="p-stat-num">{submissions.length}</span>
              <span className="p-stat-lbl">Active Submissions</span>
            </div>
            <div className="p-stat-box">
              <span className="p-stat-num">{isRegistered ? "Registered" : "Public"}</span>
              <span className="p-stat-lbl">Status</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-feed-section">
        <h2>Evidence Catalog</h2>
        <p className="subtitle">All items published by this journalist address in reverse chronological order.</p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner spinner--sm inline-block" />
            <p className="mt-2 text-muted">Retrieving catalog...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-submissions text-center card">
            <div className="empty-icon">📂</div>
            <h3>No Evidence Found</h3>
            <p>This wallet address has not registered any files to the ledger.</p>
          </div>
        ) : (
          <div className="evidence-grid">
            {submissions.map((record) => {
              const cleanHash = record.evidenceHash.replace(/^0x/, "");
              return (
                <div key={record.evidenceHash} className="evidence-card card">
                  <div className="card-top">
                    <span className="category-tag">{record.category}</span>
                    <span className="type-badge">
                      {record.typeIcon} {record.typeLabel}
                    </span>
                  </div>

                  <h3 className="card-title">
                    <Link to={`/evidence/${cleanHash}`}>{record.title}</Link>
                  </h3>

                  <div className="card-hash mono text-muted break-all">
                    SHA-256: {cleanHash.slice(0, 24)}...
                  </div>

                  <div className="card-footer">
                    <span className="card-date">{record.dateStr}</span>
                    <Link to={`/evidence/${cleanHash}`} className="card-link">
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

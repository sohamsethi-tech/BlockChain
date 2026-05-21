// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function Dashboard({ evidence }) {
  const {
    address,
    isJournalist,
    journalistAlias,
    isCorrectChain,
    connectWallet,
    switchNetwork,
    getContract,
  } = useWallet();

  const { fetchBySubmitter, loading } = evidence;
  const [isAdmin, setIsAdmin] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    if (!address) return;

    async function loadDashboardData() {
      setLoadingDashboard(true);
      try {
        const contract = await getContract(false);
        const adminAddress = await contract.deployerAdmin();
        setIsAdmin(address.toLowerCase() === adminAddress.toLowerCase());

        const subs = await fetchBySubmitter(address);
        // Sort submissions newest first
        const sorted = [...subs].sort((a, b) => b.timestamp - a.timestamp);
        setMySubmissions(sorted);
      } catch (err) {
        console.error("Error loading dashboard info:", err);
      } finally {
        setLoadingDashboard(false);
      }
    }

    loadDashboardData();
  }, [address, getContract, fetchBySubmitter]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!address) {
    return (
      <div className="page-center">
        <div className="card card--gate">
          <div className="gate-icon">🔐</div>
          <h2>Access Your Dashboard</h2>
          <p>Please connect your MetaMask wallet to view your profile, status, and history.</p>
          <button className="btn btn--primary btn--lg" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="page-center">
        <div className="card card--gate">
          <div className="gate-icon">⛓️</div>
          <h2>Switch Network</h2>
          <p>The EvidenceChain protocol is running on the Hardhat Local network.</p>
          <button className="btn btn--primary btn--lg" onClick={switchNetwork}>
            Switch Network (Chain ID 31337)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>User Dashboard</h1>
        <p className="subtitle">Manage your registry profile, submissions, and credentials.</p>
      </div>

      {/* Account Info Panel */}
      <div className="dashboard-grid">
        <div className="dashboard-card card profile-summary">
          <h2>Account Registry</h2>
          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="p-label">Wallet Address</span>
              <span className="p-value mono break-all">{address}</span>
            </div>
            <div className="profile-detail-row">
              <span className="p-label">Alias / Signature</span>
              <span className="p-value">
                {isJournalist ? journalistAlias || "Alias Not Set" : "N/A"}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="p-label">System Role</span>
              <span className="p-value">
                {isAdmin && <span className="badge badge--admin">Admin</span>}
                {isJournalist ? (
                  <span className="badge badge--journalist">Journalist</span>
                ) : (
                  <span className="badge badge--public">Public Reader</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="dashboard-card card stats-summary">
          <h2>Stats Overview</h2>
          <div className="dashboard-stats-grid">
            <div className="d-stat">
              <span className="d-stat-val">{mySubmissions.length}</span>
              <span className="d-stat-lbl">Your Submissions</span>
            </div>
            <div className="d-stat">
              <span className="d-stat-val">{isJournalist ? "Active" : "Inactive"}</span>
              <span className="d-stat-lbl">Write Status</span>
            </div>
          </div>
          {isAdmin && (
            <div className="admin-quicklink">
              <Link to="/admin" className="btn btn--secondary btn--sm btn--full text-center">
                ⚙️ Go to Admin Panel
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Section */}
      <div className="dashboard-submissions card">
        <h2>Your On-Chain Evidence Submissions</h2>
        {loadingDashboard || loading ? (
          <div className="text-center py-4">
            <div className="spinner spinner--sm inline-block" />
            <p className="mt-2 text-muted">Retrieving history from blockchain...</p>
          </div>
        ) : mySubmissions.length === 0 ? (
          <div className="empty-submissions text-center">
            <div className="empty-icon">📁</div>
            <h3>No Evidence Registered Yet</h3>
            {isJournalist ? (
              <>
                <p>Start anchoring source documents to the public ledger.</p>
                <Link to="/submit" className="btn btn--primary">
                  Submit First Evidence
                </Link>
              </>
            ) : (
              <p>Your account is not registered to submit files. Public readers can explore and verify records.</p>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="evidence-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Date Anchored</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.map((sub) => {
                  const cleanHash = sub.evidenceHash.replace(/^0x/, "");
                  return (
                    <tr key={sub.evidenceHash}>
                      <td>
                        <div className="tbl-title">{sub.title}</div>
                        <div className="tbl-hash mono text-muted break-all">
                          SHA-256: {cleanHash.slice(0, 16)}...
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{sub.category}</span>
                      </td>
                      <td>
                        <span>{sub.typeIcon} {sub.typeLabel}</span>
                      </td>
                      <td>
                        <span className="date-time text-muted">{sub.dateStr}</span>
                      </td>
                      <td className="text-right">
                        <Link to={`/evidence/${cleanHash}`} className="btn btn--ghost btn--sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

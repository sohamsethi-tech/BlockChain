// src/pages/AdminPage.jsx
// Only the deployer wallet can use this page.
// Registers / revokes journalist wallets.

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../context/WalletContext";

export default function AdminPage() {
  const { address, connectWallet, getContract } = useWallet();

  const [contractAdmin,  setContractAdmin]  = useState(null);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [newAddress,     setNewAddress]     = useState("");
  const [newAlias,       setNewAlias]       = useState("");
  const [revokeAddress,  setRevokeAddress]  = useState("");
  const [lookupAddress,  setLookupAddress]  = useState("");
  const [lookupResult,   setLookupResult]   = useState(null);
  const [txHash,         setTxHash]         = useState("");
  const [busy,           setBusy]           = useState(false);
  const [error,          setError]          = useState(null);
  const [success,        setSuccess]        = useState(null);

  // ── Load admin from contract ─────────────────────────────────────────────
  const loadAdmin = useCallback(async () => {
    try {
      const contract = await getContract(false);
      const admin    = await contract.deployerAdmin();
      setContractAdmin(admin);
      if (address) setIsAdmin(admin.toLowerCase() === address.toLowerCase());
    } catch (e) {
      console.warn("loadAdmin:", e.message);
    }
  }, [getContract, address]);

  useEffect(() => {
    if (address) loadAdmin();
  }, [address, loadAdmin]);

  // ── Register journalist ──────────────────────────────────────────────────
  const addJournalist = async () => {
    setError(null); setSuccess(null); setTxHash("");
    if (!newAddress || !newAlias) return;
    setBusy(true);
    try {
      const contract = await getContract(true);
      const tx       = await contract.addJournalist(newAddress.trim(), newAlias.trim());
      const receipt  = await tx.wait(1);
      setTxHash(receipt.hash);
      setSuccess(`✅ ${newAlias} registered successfully`);
      setNewAddress(""); setNewAlias("");
    } catch (e) {
      setError(e?.reason || e?.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Revoke journalist ────────────────────────────────────────────────────
  const revokeJournalist = async () => {
    setError(null); setSuccess(null); setTxHash("");
    if (!revokeAddress) return;
    setBusy(true);
    try {
      const contract = await getContract(true);
      const tx       = await contract.revokeJournalist(revokeAddress.trim());
      const receipt  = await tx.wait(1);
      setTxHash(receipt.hash);
      setSuccess(`✅ Access revoked for ${revokeAddress.slice(0, 10)}…`);
      setRevokeAddress("");
    } catch (e) {
      setError(e?.reason || e?.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Lookup journalist ────────────────────────────────────────────────────
  const lookupJournalist = async () => {
    if (!lookupAddress) return;
    setError(null);
    try {
      const contract              = await getContract(false);
      const [registered, alias_, count] =
        await contract.getJournalistInfo(lookupAddress.trim());
      setLookupResult({ registered, alias: alias_, count: Number(count) });
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Guards ───────────────────────────────────────────────────────────────
  if (!address) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">🛡️</div>
        <h2>Admin Panel</h2>
        <p>Connect your wallet to access admin functions.</p>
        <button className="btn btn--primary btn--lg" onClick={connectWallet}>
          Connect MetaMask
        </button>
      </div>
    </div>
  );

  if (contractAdmin && !isAdmin) return (
    <div className="page-center">
      <div className="card card--gate">
        <div className="gate-icon">🚫</div>
        <h2>Not Admin</h2>
        <p>This page is only accessible to the contract deployer.</p>
        <p className="mono small">Admin: {contractAdmin}</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p className="subtitle">
          Register journalist wallets so they can submit evidence.
          Past evidence is immutable — revoking only prevents future submissions.
        </p>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && (
        <div className="success-box">
          {success}
          {txHash && (
            <span className="mono small"> · Tx: {txHash.slice(0, 20)}…</span>
          )}
        </div>
      )}

      {/* REGISTER */}
      <div className="admin-card">
        <h2>➕ Register Journalist</h2>
        <div className="admin-form">
          <div className="field">
            <label>Wallet Address</label>
            <input
              type="text" placeholder="0x…"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Display Name / Alias</label>
            <input
              type="text" placeholder="e.g. Riya Sharma — The Hindu"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            onClick={addJournalist}
            disabled={busy || !newAddress || !newAlias}
          >
            {busy ? "Submitting…" : "Register Journalist"}
          </button>
        </div>
      </div>

      {/* REVOKE */}
      <div className="admin-card">
        <h2>🚫 Revoke Access</h2>
        <p className="admin-note">
          Prevents future submissions. Does not delete past evidence.
        </p>
        <div className="admin-form admin-form--inline">
          <input
            type="text" placeholder="0x… journalist address"
            value={revokeAddress}
            onChange={(e) => setRevokeAddress(e.target.value)}
          />
          <button
            className="btn btn--danger"
            onClick={revokeJournalist}
            disabled={busy || !revokeAddress}
          >
            {busy ? "Submitting…" : "Revoke Access"}
          </button>
        </div>
      </div>

      {/* LOOKUP */}
      <div className="admin-card">
        <h2>🔍 Lookup Journalist</h2>
        <div className="admin-form admin-form--inline">
          <input
            type="text" placeholder="0x… wallet address"
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
          />
          <button className="btn btn--ghost" onClick={lookupJournalist}>
            Lookup
          </button>
        </div>
        {lookupResult && (
          <div className={`lookup-result ${lookupResult.registered ? "registered" : "not-registered"}`}>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span>{lookupResult.registered ? "✅ Registered" : "❌ Not registered"}</span>
            </div>
            {lookupResult.alias && (
              <div className="detail-row">
                <span className="detail-label">Alias</span>
                <span>{lookupResult.alias}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Submissions</span>
              <span>{lookupResult.count}</span>
            </div>
          </div>
        )}
      </div>

      {/* CONTRACT INFO */}
      <div className="admin-card admin-card--info">
        <h2>📋 Contract Info</h2>
        <div className="detail-row">
          <span className="detail-label">Admin</span>
          <span className="mono">{contractAdmin}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Your address</span>
          <span className="mono">{address}</span>
        </div>
      </div>
    </div>
  );
}
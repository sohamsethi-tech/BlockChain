// src/components/WalletBar.jsx

import React from "react";
import { NavLink } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function WalletBar() {
  const { address, isCorrectChain, connectWallet } = useWallet();

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__brand-icon">⛓️</span>
        Evidence<span>Chain</span>
      </div>

      <div className="navbar__nav">
        <NavLink to="/"       className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Feed</NavLink>
        <NavLink to="/submit" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Submit</NavLink>
        <NavLink to="/verify" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Verify</NavLink>
        <NavLink to="/admin"  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Admin</NavLink>
      </div>

      <div className="navbar__wallet">
        {address ? (
          <div className="wallet-address">
            <span className="wallet-dot" />
            {short}
            {/* FIX: surface wrong-chain warning immediately */}
            {!isCorrectChain && (
              <span
                className="chain-warning"
                title="Wrong network — switch to Sepolia"
              >
                ⚠️
              </span>
            )}
          </div>
        ) : (
          <button className="btn btn--primary btn--sm" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

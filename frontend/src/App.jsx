// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { WalletProvider, useWallet } from "./context/WalletContext";
import { useEvidence } from "./hooks/useEvidence";

import WalletBar    from "./components/WalletBar";
import LandingPage  from "./pages/LandingPage";
import EvidenceFeed from "./pages/EvidenceFeed";
import EvidenceDetails from "./pages/EvidenceDetails";
import SubmitPage   from "./pages/SubmitPage";
import VerifyPage   from "./pages/VerifyPage";
import Dashboard    from "./pages/Dashboard";
import JournalistProfile from "./pages/JournalistProfile";
import AdminPage    from "./pages/AdminPage";

// Inner component so it can call useWallet() (which needs WalletProvider above it)
function AppRoutes() {
  const { getContract } = useWallet();
  const evidence = useEvidence(getContract);

  return (
    <>
      <WalletBar />
      <div className="main-content-wrapper">
        <Routes>
          <Route path="/"                 element={<LandingPage />} />
          <Route path="/explore"          element={<EvidenceFeed evidence={evidence} />} />
          <Route path="/evidence/:hash"   element={<EvidenceDetails evidence={evidence} />} />
          <Route path="/submit"           element={<SubmitPage   evidence={evidence} />} />
          <Route path="/verify"           element={<VerifyPage   evidence={evidence} />} />
          <Route path="/dashboard"        element={<Dashboard    evidence={evidence} />} />
          <Route path="/journalist/:addr" element={<JournalistProfile evidence={evidence} />} />
          <Route path="/admin"            element={<AdminPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WalletProvider>
  );
}
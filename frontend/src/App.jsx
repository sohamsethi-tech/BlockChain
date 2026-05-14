// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { WalletProvider, useWallet } from "./context/WalletContext";
import { useEvidence } from "./hooks/useEvidence";

import WalletBar    from "./components/WalletBar";
import EvidenceFeed from "./pages/EvidenceFeed";
import SubmitPage   from "./pages/SubmitPage";
import VerifyPage   from "./pages/VerifyPage";
import AdminPage    from "./pages/AdminPage";

// Inner component so it can call useWallet() (which needs WalletProvider above it)
function AppRoutes() {
  const { getContract } = useWallet();
  const evidence = useEvidence(getContract);

  return (
    <>
      <WalletBar />
      <Routes>
        <Route path="/"       element={<EvidenceFeed evidence={evidence} />} />
        <Route path="/submit" element={<SubmitPage   evidence={evidence} />} />
        <Route path="/verify" element={<VerifyPage   evidence={evidence} />} />
        <Route path="/admin"  element={<AdminPage />} />
      </Routes>
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
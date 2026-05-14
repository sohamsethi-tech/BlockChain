// src/hooks/useWallet.js
// Complete wallet hook — provides everything pages need.

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../config/contract.config";
import { NETWORK } from "../config/network.config";

export function useWallet() {
  const [address,         setAddress]         = useState(null);
  const [signer,          setSigner]          = useState(null);
  const [isJournalist,    setIsJournalist]    = useState(false);
  const [journalistAlias, setJournalistAlias] = useState("");
  const [isCorrectChain,  setIsCorrectChain]  = useState(false);
  const [chainId,         setChainId]         = useState(null);

  // ── Check chain ──────────────────────────────────────────────────────────
  const checkChain = useCallback(async () => {
    if (!window.ethereum) return;
    const hex = await window.ethereum.request({ method: "eth_chainId" });
    const id  = parseInt(hex, 16);
    setChainId(id);
    setIsCorrectChain(id === CHAIN_ID);
  }, []);

  // ── Check journalist status on chain ────────────────────────────────────
  const checkJournalist = useCallback(async (addr) => {
    if (!addr || !window.ethereum) return;
    try {
      const provider  = new ethers.BrowserProvider(window.ethereum);
      const contract  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [registered, alias_] = await contract.getJournalistInfo(addr);
      setIsJournalist(registered);
      setJournalistAlias(alias_);
    } catch (e) {
      console.warn("checkJournalist error:", e.message);
    }
  }, []);

  // ── Connect wallet ───────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const addr     = accounts[0];
    const s        = await provider.getSigner();

    setAddress(addr);
    setSigner(s);

    await checkChain();
    await checkJournalist(addr);
  }, [checkChain, checkJournalist]);

  // ── Switch / add Hardhat Local network ──────────────────────────────────
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainId }],
      });
    } catch (err) {
      // 4902 = chain not added yet
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK],
        });
      }
    }
    await checkChain();
  }, [checkChain]);

  // ── Get contract (read or write) ─────────────────────────────────────────
  const getContract = useCallback(async (withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const s = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, []);

  // ── Listen for MetaMask account / chain changes ──────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
        setIsJournalist(false);
        setJournalistAlias("");
      } else {
        const addr     = accounts[0];
        const provider = new ethers.BrowserProvider(window.ethereum);
        const s        = await provider.getSigner();
        setAddress(addr);
        setSigner(s);
        await checkJournalist(addr);
      }
    };

    const onChainChanged = () => {
      // Reload is the safest approach — ethers recommends it
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged",    onChainChanged);

    // Check chain on mount (in case already connected)
    checkChain();

    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged",    onChainChanged);
    };
  }, [checkChain, checkJournalist]);

  return {
    address,
    signer,
    isJournalist,
    journalistAlias,
    isCorrectChain,
    chainId,
    connectWallet,
    switchNetwork,
    getContract,
  };
}
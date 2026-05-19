// src/hooks/useWallet.js

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../config/contract.config";
import { NETWORK } from "../config/network.config";

export function useWallet() {
  const [address,          setAddress]          = useState(null);
  const [isJournalist,     setIsJournalist]     = useState(false);
  const [journalistAlias,  setJournalistAlias]  = useState("");
  const [isCorrectChain,   setIsCorrectChain]   = useState(false);
  const [chainId,          setChainId]          = useState(null);

  // ── Check chain ──────────────────────────────────────────────────────────
  const checkChain = useCallback(async () => {
    if (!window.ethereum) return;
    const hex = await window.ethereum.request({ method: "eth_chainId" });
    const id  = parseInt(hex, 16);
    setChainId(id);
    setIsCorrectChain(id === CHAIN_ID);
  }, []);

  // ── Check journalist status ──────────────────────────────────────────────
  const checkJournalist = useCallback(async (addr) => {
    if (!addr || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [registered, alias_] = await contract.getJournalistInfo(addr);
      setIsJournalist(registered);
      setJournalistAlias(alias_);
    } catch (e) {
      console.warn("checkJournalist error:", e.message);
    }
  }, []);

  // ── Connect wallet (user-triggered) ──────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const addr     = accounts[0];

    setAddress(addr);

    await checkChain();
    await checkJournalist(addr);
  }, [checkChain, checkJournalist]);

  // ── Switch / add network ─────────────────────────────────────────────────
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK],
        });
      }
    }

    await checkChain();
  }, [checkChain]);

  // ── Get contract (read/write) ────────────────────────────────────────────
  const getContract = useCallback(async (withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not installed");

    const provider = new ethers.BrowserProvider(window.ethereum);

    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, []);

  // ── MetaMask listeners + passive reconnect ───────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsJournalist(false);
        setJournalistAlias("");
      } else {
        const addr = accounts[0];
        setAddress(addr);
        await checkJournalist(addr);
      }
    };

    const onChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged",    onChainChanged);

    // FIX: passive reconnect — guard against MetaMask throwing while locked
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          await checkJournalist(addr);
        }
      })
      .catch(() => {
        // MetaMask locked or unavailable — silently ignore
      });

    checkChain();

    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged",    onChainChanged);
    };
  }, [checkChain, checkJournalist]);

  // ── Re-check journalist on tab focus ─────────────────────────────────────
  useEffect(() => {
    if (!address) return;

    const onFocus = () => checkJournalist(address);

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [address, checkJournalist]);

  return {
    address,
    isJournalist,
    journalistAlias,
    isCorrectChain,
    chainId,
    connectWallet,
    switchNetwork,
    getContract,
  };
}

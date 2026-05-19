// src/hooks/useEvidence.js

import { useState, useCallback } from "react";
import { ethers } from "ethers";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

// hex → bytes32  (FIX: guard exact 64-char SHA-256 hex)
export function hexToBytes32(hexStr) {
  const clean = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  if (clean.length !== 64) {
    throw new Error(`Expected 64-char hex, got ${clean.length}`);
  }
  return ethers.zeroPadValue("0x" + clean, 32);
}

// SHA-256 (browser, local only)
export async function computeFileSHA256(file) {
  const buffer     = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// fetch with timeout (FIX: prevent indefinite IPFS hang)
async function fetchWithTimeout(url, options, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

export const EVIDENCE_TYPES = [
  { value: 0, label: "Image",    icon: "🖼️" },
  { value: 1, label: "Video",    icon: "🎬" },
  { value: 2, label: "Document", icon: "📄" },
  { value: 3, label: "Audio",    icon: "🎙️" },
  { value: 4, label: "Other",    icon: "📦" },
];

export const CATEGORIES = [
  "Corruption",
  "Human Rights",
  "Environment",
  "War Crimes",
  "Financial Fraud",
  "Election",
  "Police Brutality",
  "Cybercrime",
  "Other",
];

/* ─────────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────────── */

export function useEvidence(getContract) {
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [verifying,  setVerifying]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  /* ───────────────── SUBMIT ───────────────── */

  const submitEvidence = useCallback(async ({
    file,
    title,
    category,
    evidenceType,
  }) => {
    setSubmitting(true);
    setError(null);

    let ipfsCID = null;

    try {
      // STEP 1: HASH
      setSubmitStep("Computing file hash…");
      const sha256Hex = await computeFileSHA256(file);

      if (!sha256Hex || sha256Hex.length !== 64) {
        throw new Error("File hashing failed");
      }

      const bytes32Hash = hexToBytes32(sha256Hex);

      // STEP 2: IPFS upload (60s timeout)
      setSubmitStep("Uploading to IPFS…");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithTimeout(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
          body: formData,
        },
        60_000
      );

      if (!res.ok) {
        const text = await res.text().catch(() => res.status);
        throw new Error(`IPFS upload failed: ${text}`);
      }

      const data = await res.json();
      ipfsCID = data.IpfsHash;

      // STEP 3: blockchain tx
      setSubmitStep("Waiting for MetaMask signature…");

      const contract = await getContract(true);

      const tx = await contract.submitEvidence(
        bytes32Hash,
        ipfsCID,
        evidenceType,
        category,
        title
      );

      // STEP 4: confirm
      setSubmitStep("Confirming on blockchain…");
      const receipt = await tx.wait(1);

      setSubmitStep("Done ✅");

      return {
        success:     true,
        txHash:      receipt.hash,
        filename:    file.name,
        sha256:      sha256Hex,
        ipfsCID,
        ipfsUrl:     `https://ipfs.io/ipfs/${ipfsCID}`,
        blockNumber: receipt.blockNumber,
      };

    } catch (e) {

      // Cleanup orphan IPFS pin only if upload succeeded but tx failed
      if (ipfsCID) {
        try {
          await fetchWithTimeout(
            `https://api.pinata.cloud/pinning/unpin/${ipfsCID}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
              },
            },
            15_000
          );
        } catch (_) {}
      }

      const msg = e?.reason || e?.message || "Unknown error";
      setError(msg);
      throw e;

    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitStep(""), 3000);
    }
  }, [getContract]);

  /* ───────────────── FETCH PAGE ───────────────── */

  const fetchEvidencePage = useCallback(async (offset = 0, limit = 20) => {
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract(false);

      const [records, total] = await Promise.all([
        contract.getEvidencePage(offset, limit),
        contract.totalEvidence(),
      ]);

      return {
        records: records.map(normalizeRecord),
        total:   Number(total),
      };

    } catch (e) {
      setError(e.message);
      return { records: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  /* ───────────────── FETCH BY USER ───────────────── */

  const fetchBySubmitter = useCallback(async (address) => {
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract(false);
      const records  = await contract.getEvidenceBySubmitter(address);
      return records.map(normalizeRecord);

    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  /* ───────────────── VERIFY FILE ───────────────── */

  const verifyFile = useCallback(async (file) => {
    setVerifying(true);
    setError(null);

    try {
      const sha256Hex = await computeFileSHA256(file);

      if (!sha256Hex || sha256Hex.length !== 64) {
        throw new Error("Hashing failed");
      }

      const bytes32Hash = hexToBytes32(sha256Hex);
      const contract    = await getContract(false);
      const exists      = await contract.verifyEvidence(bytes32Hash);

      if (exists) {
        const record = await contract.getEvidence(bytes32Hash);
        return { verified: true,  sha256: sha256Hex, record: normalizeRecord(record) };
      }

      return { verified: false, sha256: sha256Hex, record: null };

    } catch (e) {
      setError(e.message);
      return { verified: false, sha256: null, record: null };
    } finally {
      setVerifying(false);
    }
  }, [getContract]);

  /* ───────────────── VERIFY HASH ───────────────── */

  const verifyHash = useCallback(async (sha256Hex) => {
    setVerifying(true);
    setError(null);

    try {
      const bytes32Hash = hexToBytes32(sha256Hex);
      const contract    = await getContract(false);
      const exists      = await contract.verifyEvidence(bytes32Hash);

      if (exists) {
        const record = await contract.getEvidence(bytes32Hash);
        return { verified: true,  sha256: sha256Hex, record: normalizeRecord(record) };
      }

      return { verified: false, sha256: sha256Hex, record: null };

    } catch (e) {
      setError(e.message);
      return { verified: false, sha256: null, record: null };
    } finally {
      setVerifying(false);
    }
  }, [getContract]);

  /* ───────────────── RETURN ───────────────── */

  return {
    submitEvidence,
    submitting,
    submitStep,

    fetchEvidencePage,
    fetchBySubmitter,

    verifyFile,
    verifyHash,
    verifying,

    loading,
    error,
    setError,
  };
}

/* ─────────────────────────────────────────────────────────────
   NORMALIZER
───────────────────────────────────────────────────────────── */

function normalizeRecord(r) {
  const isCID =
    r.ipfsCID?.startsWith("Qm") ||
    r.ipfsCID?.startsWith("baf") ||
    r.ipfsCID?.length > 40;

  return {
    evidenceHash: r.evidenceHash,
    ipfsCID:      r.ipfsCID,
    ipfsUrl:      isCID ? `https://ipfs.io/ipfs/${r.ipfsCID}` : null,
    filename:     isCID ? null : r.ipfsCID,
    evidenceType: Number(r.evidenceType),
    category:     r.category,
    title:        r.title,
    timestamp:    Number(r.timestamp),
    submitter:    r.submitter,
    typeLabel:    EVIDENCE_TYPES[Number(r.evidenceType)]?.label || "Other",
    typeIcon:     EVIDENCE_TYPES[Number(r.evidenceType)]?.icon  || "📦",
    dateStr:      new Date(Number(r.timestamp) * 1000).toLocaleString(),
  };
}

// src/hooks/useEvidence.js
// All blockchain interactions for evidence submission, listing, and verification.
// On-chain storage: hash + IPFS CID + metadata.

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { generateSHA256 } from "../utils/hash.util";
import { uploadToIPFS } from "../services/ipfs.service";

// ── Helper: hex string → bytes32 ──────────────────────────────────────────────
export function hexToBytes32(hexStr) {
  const clean = hexStr.startsWith("0x") ? hexStr : "0x" + hexStr;
  return ethers.zeroPadValue(clean, 32);
}

// ── Helper: compute SHA-256 in browser (delegated to util) ────────────────────
export const computeFileSHA256 = generateSHA256;

// ── Evidence type labels ───────────────────────────────────────────────────────
export const EVIDENCE_TYPES = [
  { value: 0, label: "Image",    icon: "🖼️"  },
  { value: 1, label: "Video",    icon: "🎬"  },
  { value: 2, label: "Document", icon: "📄"  },
  { value: 3, label: "Audio",    icon: "🎙️" },
  { value: 4, label: "Other",    icon: "📦"  },
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

export function useEvidence(getContract) {
  const [submitting,  setSubmitting]  = useState(false);
  const [submitStep,  setSubmitStep]  = useState("");
  const [verifying,   setVerifying]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

// ── SUBMIT ─────────────────────────────────────────────────────────────────
  // Uploads to IPFS first, then stores hash + (ipfsCID | filename) + metadata on-chain.
  const submitEvidence = useCallback(async ({
    file, title, category, evidenceType
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      // STEP 1: Hash the file locally in the browser
      setSubmitStep("Computing file hash…");
      const sha256Hex   = await computeFileSHA256(file);
      const bytes32Hash = hexToBytes32(sha256Hex);

      // STEP 2: Upload file to Pinata IPFS
      setSubmitStep("Uploading to IPFS via Pinata…");
      const ipfsCID = await uploadToIPFS(file);

      // STEP 3: Sign and submit to blockchain via MetaMask
      // We store the CID and filename together as CID|filename
      setSubmitStep("Waiting for MetaMask signature…");
      const contract = await getContract(true); // withSigner = true
      const tx = await contract.submitEvidence(
        bytes32Hash,
        `${ipfsCID}|${file.name}`,
        evidenceType,
        category,
        title
      );

      // STEP 4: Wait for block confirmation
      setSubmitStep("Confirming on blockchain…");
      const receipt = await tx.wait(1);

      setSubmitStep("Done ✅");
      return {
        success:     true,
        txHash:      receipt.hash,
        filename:    file.name,
        ipfsCID:     ipfsCID,
        sha256:      sha256Hex,
        blockNumber: receipt.blockNumber,
      };
    } catch (e) {
      const msg = e?.reason || e?.message || "Unknown error";
      setError(msg);
      throw e;
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitStep(""), 3000);
    }
  }, [getContract]);

  // ── FETCH PAGE ─────────────────────────────────────────────────────────────
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

  // ── FETCH BY SUBMITTER ─────────────────────────────────────────────────────
  const fetchBySubmitter = useCallback(async (address) => {
    setLoading(true);
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

  // ── VERIFY FILE ────────────────────────────────────────────────────────────
  // Drag any file in — its SHA-256 is checked against the chain.
  // The file is never uploaded anywhere.
  const verifyFile = useCallback(async (file) => {
    setVerifying(true);
    setError(null);
    try {
      const sha256Hex   = await computeFileSHA256(file);
      const bytes32Hash = hexToBytes32(sha256Hex);
      const contract    = await getContract(false);
      const exists      = await contract.verifyEvidence(bytes32Hash);
      if (exists) {
        const record = await contract.getEvidence(bytes32Hash);
        return { verified: true, sha256: sha256Hex, record: normalizeRecord(record) };
      }
      return { verified: false, sha256: sha256Hex, record: null };
    } catch (e) {
      setError(e.message);
      return { verified: false, sha256: null, record: null };
    } finally {
      setVerifying(false);
    }
  }, [getContract]);

  // ── VERIFY HASH STRING ─────────────────────────────────────────────────────
  const verifyHash = useCallback(async (sha256Hex) => {
    setVerifying(true);
    setError(null);
    try {
      const bytes32Hash = hexToBytes32(sha256Hex);
      const contract    = await getContract(false);
      const exists      = await contract.verifyEvidence(bytes32Hash);
      if (exists) {
        const record = await contract.getEvidence(bytes32Hash);
        return { verified: true, record: normalizeRecord(record) };
      }
      return { verified: false, record: null };
    } catch (e) {
      setError(e.message);
      return { verified: false, record: null };
    } finally {
      setVerifying(false);
    }
  }, [getContract]);

  // ── FETCH BY HASH ─────────────────────────────────────────────────────────
  const fetchEvidenceByHash = useCallback(async (sha256Hex) => {
    setLoading(true);
    setError(null);
    try {
      const bytes32Hash = hexToBytes32(sha256Hex);
      const contract    = await getContract(false);
      const exists      = await contract.verifyEvidence(bytes32Hash);
      if (!exists) return null;
      const record = await contract.getEvidence(bytes32Hash);
      return normalizeRecord(record);
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  return {
    submitEvidence,  submitting, submitStep,
    fetchEvidencePage, fetchBySubmitter, fetchEvidenceByHash,
    verifyFile, verifyHash, verifying,
    loading, error, setError,
  };
}

// ── Normalize on-chain record to plain JS object ───────────────────────────────
function normalizeRecord(r) {
  const parts = r.ipfsCID.split("|");
  const ipfsCID = parts[0];
  const filename = parts[1] || "evidence_file";

  return {
    evidenceHash: r.evidenceHash,
    ipfsCID:      ipfsCID,
    filename:     filename,
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
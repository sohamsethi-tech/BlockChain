// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @author JournalistChain
 * @notice Immutable, journalist-operated evidence registry on-chain.
 *         No admin can delete records. Each journalist submits from their own wallet.
 *         Roles: ADMIN (org owner), JOURNALIST (can submit), anyone can verify.
 *
 * DEPLOYMENT: Polygon Amoy testnet (free gas) or Ethereum Sepolia
 * Hardhat deploy: npx hardhat run scripts/deploy.js --network amoy
 */

contract EvidenceRegistry {

    // ─── ROLES ────────────────────────────────────────────────────────────────
    address public immutable deployerAdmin;
    mapping(address => bool) public isJournalist;
    mapping(address => string) public journalistAlias; // optional display name

    // ─── EVIDENCE RECORD ──────────────────────────────────────────────────────
    struct EvidenceRecord {
        bytes32  evidenceHash;   // SHA-256 of the original file (bytes32)
        string   ipfsCID;        // IPFS content identifier (CIDv1)
        uint8    evidenceType;   // 0=Image 1=Video 2=Document 3=Audio 4=Other
        string   category;       // "Corruption" | "Environment" | "Crime" etc.
        string   title;          // human-readable title
        uint256  timestamp;      // block.timestamp at submission
        address  submitter;      // journalist's wallet address (their identity)
        bool     exists;         // sentinel for existence check
    }

    // ─── STORAGE ──────────────────────────────────────────────────────────────
    // Primary: hash → record
    mapping(bytes32 => EvidenceRecord) private evidenceByHash;

    // Index: store all hashes in order so we can paginate
    bytes32[] private evidenceIndex;

    // Per-journalist index
    mapping(address => bytes32[]) private submitterIndex;

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    event EvidenceSubmitted(
        bytes32 indexed evidenceHash,
        address indexed submitter,
        string  ipfsCID,
        string  category,
        string  title,
        uint256 timestamp
    );

    event JournalistAdded(address indexed journalist, string alias_);
    event JournalistRevoked(address indexed journalist);

    // ─── MODIFIERS ────────────────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == deployerAdmin, "Not admin");
        _;
    }

    modifier onlyJournalist() {
        require(isJournalist[msg.sender], "Not a registered journalist");
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────
    constructor() {
        deployerAdmin = msg.sender;
        // Admin is also a journalist by default
        isJournalist[msg.sender] = true;
        journalistAlias[msg.sender] = "Admin";
        emit JournalistAdded(msg.sender, "Admin");
    }

    // ─── ADMIN: JOURNALIST MANAGEMENT ────────────────────────────────────────
    /**
     * @notice Register a new journalist wallet. Only org admin can call this.
     * @param journalist Wallet address of the journalist
     * @param alias_     Display name (e.g. "Riya Sharma - The Hindu")
     */
    function addJournalist(address journalist, string calldata alias_)
        external onlyAdmin
    {
        require(journalist != address(0), "Zero address");
        require(!isJournalist[journalist], "Already registered");
        isJournalist[journalist] = true;
        journalistAlias[journalist] = alias_;
        emit JournalistAdded(journalist, alias_);
    }

    /**
     * @notice Revoke a journalist's submission rights.
     *         NOTE: Their PAST submissions are immutable and cannot be deleted.
     */
    function revokeJournalist(address journalist) external onlyAdmin {
        require(isJournalist[journalist], "Not a journalist");
        require(journalist != deployerAdmin, "Cannot revoke admin");
        isJournalist[journalist] = false;
        emit JournalistRevoked(journalist);
    }

    // ─── CORE: SUBMIT EVIDENCE ────────────────────────────────────────────────
    /**
     * @notice Submit a piece of evidence. Called directly from journalist's wallet
     *         via MetaMask — NOT through a backend server.
     * @param _hash         SHA-256 hash of the file as bytes32
     * @param _ipfsCID      IPFS CIDv1 string
     * @param _evidenceType 0=Image 1=Video 2=Document 3=Audio 4=Other
     * @param _category     Category string
     * @param _title        Human-readable title
     */
    function submitEvidence(
        bytes32       _hash,
        string calldata _ipfsCID,
        uint8          _evidenceType,
        string calldata _category,
        string calldata _title
    ) external onlyJournalist {
        require(_hash != bytes32(0),          "Empty hash");
        require(bytes(_ipfsCID).length > 0,   "Empty CID");
        require(!evidenceByHash[_hash].exists, "Evidence already registered");

        EvidenceRecord memory record = EvidenceRecord({
            evidenceHash: _hash,
            ipfsCID:      _ipfsCID,
            evidenceType: _evidenceType,
            category:     _category,
            title:        _title,
            timestamp:    block.timestamp,
            submitter:    msg.sender,
            exists:       true
        });

        evidenceByHash[_hash]       = record;
        evidenceIndex.push(_hash);
        submitterIndex[msg.sender].push(_hash);

        emit EvidenceSubmitted(
            _hash,
            msg.sender,
            _ipfsCID,
            _category,
            _title,
            block.timestamp
        );
    }

    // ─── READ: VERIFY ─────────────────────────────────────────────────────────
    /**
     * @notice Verify a file hash is registered on-chain.
     */
    function verifyEvidence(bytes32 _hash) external view returns (bool) {
        return evidenceByHash[_hash].exists;
    }

    /**
     * @notice Get full record for a given hash.
     */
    function getEvidence(bytes32 _hash)
        external view
        returns (EvidenceRecord memory)
    {
        require(evidenceByHash[_hash].exists, "Not found");
        return evidenceByHash[_hash];
    }

    // ─── READ: PAGINATION ─────────────────────────────────────────────────────
    /**
     * @notice Total number of evidence records submitted.
     */
    function totalEvidence() external view returns (uint256) {
        return evidenceIndex.length;
    }

    /**
     * @notice Get a page of evidence records (newest-first).
     * @param offset  Start index (0 = most recent)
     * @param limit   Max records to return (max 50)
     */
    function getEvidencePage(uint256 offset, uint256 limit)
        external view
        returns (EvidenceRecord[] memory records)
    {
        uint256 total = evidenceIndex.length;
        if (offset >= total) return new EvidenceRecord[](0);

        uint256 cap   = limit > 50 ? 50 : limit;
        uint256 end   = offset + cap;
        if (end > total) end = total;
        uint256 count = end - offset;

        records = new EvidenceRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            // Reverse index: most recent first
            uint256 idx = total - 1 - offset - i;
            records[i] = evidenceByHash[evidenceIndex[idx]];
        }
    }

    /**
     * @notice Get all evidence submitted by a specific journalist.
     */
    function getEvidenceBySubmitter(address submitter)
        external view
        returns (EvidenceRecord[] memory)
    {
        bytes32[] memory hashes = submitterIndex[submitter];
        EvidenceRecord[] memory records = new EvidenceRecord[](hashes.length);
        for (uint256 i = 0; i < hashes.length; i++) {
            records[i] = evidenceByHash[hashes[i]];
        }
        return records;
    }

    /**
     * @notice Get journalist info (alias + registration status).
     */
    function getJournalistInfo(address journalist)
        external view
        returns (bool registered, string memory alias_, uint256 submissionCount)
    {
        return (
            isJournalist[journalist],
            journalistAlias[journalist],
            submitterIndex[journalist].length
        );
    }
}

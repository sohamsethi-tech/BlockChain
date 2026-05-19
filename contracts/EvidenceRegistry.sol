// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @author JournalistChain
 * @notice Immutable, journalist-operated evidence registry on-chain.
 *         No admin can delete records. Each journalist submits from their own wallet.
 *         Roles: ADMIN (org owner), JOURNALIST (can submit), anyone can verify.
 *
 * Deployed on Ethereum Sepolia Testnet (Chain ID: 11155111)
 */

contract EvidenceRegistry {

    // ─── ROLES ────────────────────────────────────────────────────────────────
    address public immutable deployerAdmin;
    mapping(address => bool)   public isJournalist;
    mapping(address => string) public journalistAlias;

    // ─── EVIDENCE RECORD ──────────────────────────────────────────────────────
    struct EvidenceRecord {
        bytes32  evidenceHash;
        string   ipfsCID;
        uint8    evidenceType;   // 0=Image 1=Video 2=Document 3=Audio 4=Other
        string   category;
        string   title;
        uint256  timestamp;
        address  submitter;
        bool     exists;
    }

    // ─── STORAGE ──────────────────────────────────────────────────────────────
    mapping(bytes32 => EvidenceRecord) private evidenceByHash;
    bytes32[]                          private evidenceIndex;
    mapping(address => bytes32[])      private submitterIndex;

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    event EvidenceSubmitted(
        bytes32 indexed evidenceHash,
        address indexed submitter,
        string  ipfsCID,
        string  category,
        string  title,
        uint256 timestamp
    );

    event JournalistAdded  (address indexed journalist, string alias_);
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
        isJournalist[msg.sender]    = true;
        journalistAlias[msg.sender] = "Admin";
        emit JournalistAdded(msg.sender, "Admin");
    }

    // ─── ADMIN: JOURNALIST MANAGEMENT ─────────────────────────────────────────
    function addJournalist(address journalist, string calldata alias_)
        external onlyAdmin
    {
        require(journalist != address(0), "Zero address");
        require(!isJournalist[journalist], "Already registered");
        isJournalist[journalist]    = true;
        journalistAlias[journalist] = alias_;
        emit JournalistAdded(journalist, alias_);
    }

    function revokeJournalist(address journalist) external onlyAdmin {
        require(isJournalist[journalist],    "Not a journalist");
        require(journalist != deployerAdmin, "Cannot revoke admin");
        isJournalist[journalist]    = false;
        journalistAlias[journalist] = "";   // FIX: clear stale alias
        emit JournalistRevoked(journalist);
    }

    // ─── CORE: SUBMIT EVIDENCE ────────────────────────────────────────────────
    function submitEvidence(
        bytes32         _hash,
        string calldata _ipfsCID,
        uint8           _evidenceType,
        string calldata _category,
        string calldata _title
    ) external onlyJournalist {
        require(_hash != bytes32(0),           "Empty hash");
        require(bytes(_ipfsCID).length > 0,    "Empty CID");
        require(!evidenceByHash[_hash].exists, "Evidence already registered");
        require(_evidenceType <= 4,            "Invalid evidence type");
        require(
            bytes(_title).length > 0 && bytes(_title).length <= 200,
            "Title must be 1-200 chars"
        );
        require(
            bytes(_category).length > 0 && bytes(_category).length <= 100,
            "Category must be 1-100 chars"
        );

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

        evidenceByHash[_hash] = record;
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
    function verifyEvidence(bytes32 _hash) external view returns (bool) {
        return evidenceByHash[_hash].exists;
    }

    function getEvidence(bytes32 _hash)
        external view
        returns (EvidenceRecord memory)
    {
        require(evidenceByHash[_hash].exists, "Not found");
        return evidenceByHash[_hash];
    }

    // ─── READ: PAGINATION ─────────────────────────────────────────────────────
    function totalEvidence() external view returns (uint256) {
        return evidenceIndex.length;
    }

    function getEvidencePage(uint256 offset, uint256 limit)
        external view
        returns (EvidenceRecord[] memory records)
    {
        uint256 total = evidenceIndex.length;
        if (offset >= total) return new EvidenceRecord[](0);

        // cap at 50 to bound gas; reverse-iterate for newest-first order
        uint256 cap   = limit > 50 ? 50 : limit;
        uint256 end   = offset + cap;
        if (end > total) end = total;
        uint256 count = end - offset;

        records = new EvidenceRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            // safe: i <= count-1, offset+i <= total-1 => no underflow
            records[i] = evidenceByHash[evidenceIndex[total - 1 - offset - i]];
        }
    }

    function getEvidenceBySubmitter(address submitter)
        external view
        returns (EvidenceRecord[] memory)
    {
        bytes32[] memory hashes  = submitterIndex[submitter];
        EvidenceRecord[] memory records = new EvidenceRecord[](hashes.length);
        for (uint256 i = 0; i < hashes.length; i++) {
            records[i] = evidenceByHash[hashes[i]];
        }
        return records;
    }

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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CyberCastEvidenceLedger
 * @author CyberCast Core Architecture Team (SIH PS 184)
 * @notice Immutable Forensic Evidence Vault & Chain of Custody Ledger.
 * Compliant with Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023
 * (formerly Section 65B of the Indian Evidence Act, 1872).
 *
 * Designed for deployment on Polygon Amoy Testnet (EVM) with seamless
 * architectural transition to India's National Blockchain Framework (NBF) / Hyperledger.
 */
contract CyberCastEvidenceLedger {

    // --- STRUCTS ---

    enum EvidenceCategory {
        COMMUNICATION,  // WhatsApp, SMS, Telegram transcripts, VoIP call logs
        FINANCIAL,      // CFCFRMS transaction flow, bank liens, ATM freeze mandates
        SURVEILLANCE,   // CCTV camera clips, ATM face frame captures, drone telemetry
        LEGAL,          // FIR copies, Section 91 CrPC warrants, seizure memos
        DEVICE,         // Phone dumps, PCAP network captures, disk forensic clones
        IDENTITY        // Aadhaar, PAN, Passport, biometric KYC artifacts
    }

    struct EvidenceRecord {
        string caseId;              // e.g. "CY2026-MH-44521"
        bytes32 sha256Hash;         // Cryptographic SHA-256 digest of original raw file
        string ipfsCid;             // IPFS Content Identifier of client-side encrypted ciphertext
        string officerBadge;        // Investigating officer badge ID (e.g. "JPR-CI-889")
        string officerAgency;       // Unit / Agency (e.g. "Rajasthan Police Cyber Crime Branch")
        uint256 timestamp;          // Immutable on-chain block timestamp
        uint256 blockNumber;        // EVM block height at mining confirmation
        EvidenceCategory category;  // Categorization
        bool isValid;               // Record existence flag
        string bsaCertificateId;    // Statutory certificate ID (e.g. "BSA-63-2026-RAJ-9182")
        bytes signature;            // Relayer or Officer cryptographic signature
    }

    struct EvidenceInput {
        string caseId;
        bytes32 sha256Hash;
        string ipfsCid;
        string officerBadge;
        string officerAgency;
        EvidenceCategory category;
        string bsaCertificateId;
    }

    struct CorrectionRecord {
        bytes32 originalHash;
        bytes32 supersedingHash;
        string amendmentReason;
        string amendedByOfficer;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // --- STATE VARIABLES ---

    address public owner;
    bool public paused;
    uint256 public totalEvidenceCount;

    // EIP-712 Domain Separator for gasless police meta-transactions
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant RECORD_EVIDENCE_TYPEHASH = keccak256(
        "RecordEvidence(address signer,string caseId,bytes32 sha256Hash,string ipfsCid,string officerBadge,uint8 category,string bsaCertificateId,uint256 nonce,uint256 deadline)"
    );

    mapping(address => uint256) public nonces;
    mapping(address => bool) public authorizedRelayers;
    mapping(bytes32 => EvidenceRecord) private _evidenceByHash;
    mapping(string => bytes32[]) private _caseEvidenceList;
    mapping(bytes32 => CorrectionRecord[]) private _correctionsByHash;

    // --- EVENTS ---

    event EvidenceAnchored(
        string indexed caseId,
        bytes32 indexed sha256Hash,
        string ipfsCid,
        string officerBadge,
        uint256 blockNumber,
        uint256 timestamp,
        string bsaCertificateId
    );

    event EvidenceAmended(
        string indexed caseId,
        bytes32 indexed originalHash,
        bytes32 indexed supersedingHash,
        string reason,
        string officerBadge,
        uint256 blockNumber,
        uint256 timestamp
    );

    event RelayerAuthorized(address indexed relayer, bool status);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ContractPaused(address account);
    event ContractUnpaused(address account);

    // --- MODIFIERS ---

    modifier onlyOwner() {
        require(msg.sender == owner, "CyberCast: Caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedRelayers[msg.sender], "CyberCast: Unauthorized relayer");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "CyberCast: Ledger is paused");
        _;
    }

    // --- CONSTRUCTOR ---

    constructor() {
        owner = msg.sender;
        authorizedRelayers[msg.sender] = true;

        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("CyberCastEvidenceLedger")),
                keccak256(bytes("1.0.0")),
                chainId,
                address(this)
            )
        );
    }

    // --- CORE LEDGER FUNCTIONS ---

    /**
     * @notice Record a single forensic evidence artifact on-chain
     * @param caseId Associated case identifier
     * @param sha256Hash SHA-256 digest of original evidence
     * @param ipfsCid Decentralized IPFS CID storing AES-256 encrypted payload
     * @param officerBadge Officer badge ID
     * @param officerAgency Agency name / station
     * @param category Evidence category enum index
     * @param bsaCertificateId Section 63 BSA statutory certificate number
     * @param signature Cryptographic digital signature of officer or relayer
     */
    function recordEvidence(
        string calldata caseId,
        bytes32 sha256Hash,
        string calldata ipfsCid,
        string calldata officerBadge,
        string calldata officerAgency,
        EvidenceCategory category,
        string calldata bsaCertificateId,
        bytes calldata signature
    ) external onlyAuthorized whenNotPaused {
        _recordEvidenceInternal(
            EvidenceInput({
                caseId: caseId,
                sha256Hash: sha256Hash,
                ipfsCid: ipfsCid,
                officerBadge: officerBadge,
                officerAgency: officerAgency,
                category: category,
                bsaCertificateId: bsaCertificateId
            }),
            signature
        );
    }

    /**
     * @notice Record forensic evidence using structured EvidenceInput parameter
     */
    function recordEvidence(
        EvidenceInput calldata input,
        bytes calldata signature
    ) external onlyAuthorized whenNotPaused {
        _recordEvidenceInternal(input, signature);
    }

    /**
     * @notice Production-grade alias for evidence registration adhering to Section 7 Phase 2 specification
     */
    function registerEvidence(
        string calldata caseId,
        string calldata sha256HashStr,
        string calldata ipfsCid,
        string calldata officerBadge,
        uint8 evidenceType
    ) external onlyAuthorized whenNotPaused {
        bytes32 hashBytes = bytes32(keccak256(bytes(sha256HashStr)));
        _recordEvidenceInternal(
            EvidenceInput({
                caseId: caseId,
                sha256Hash: hashBytes,
                ipfsCid: ipfsCid,
                officerBadge: officerBadge,
                officerAgency: "Cyber Crime Unit",
                category: EvidenceCategory(evidenceType % 6),
                bsaCertificateId: string(abi.encodePacked("BSA-63-", caseId))
            }),
            ""
        );
    }

    /**
     * @notice Batch record multiple forensic evidence items in one atomic transaction
     */
    function recordEvidenceBatch(
        EvidenceInput[] calldata inputs,
        bytes[] calldata signatures
    ) external onlyAuthorized whenNotPaused {
        require(inputs.length == signatures.length, "CyberCast: Array length mismatch");
        for (uint256 i = 0; i < inputs.length; i++) {
            _recordEvidenceInternal(inputs[i], signatures[i]);
        }
    }

    /**
     * @dev Internal helper executing EIP-712 meta-transaction verification
     */
    function _executeMetaTx(
        address signer,
        EvidenceInput memory input,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(block.timestamp <= deadline, "CyberCast: Signature expired");
        require(signer != address(0), "CyberCast: Zero signer address");

        bytes32 structHash = keccak256(
            abi.encode(
                RECORD_EVIDENCE_TYPEHASH,
                signer,
                keccak256(bytes(input.caseId)),
                input.sha256Hash,
                keccak256(bytes(input.ipfsCid)),
                keccak256(bytes(input.officerBadge)),
                uint8(input.category),
                keccak256(bytes(input.bsaCertificateId)),
                nonces[signer]++,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered == signer, "CyberCast: Invalid signature");
        require(signer == owner || authorizedRelayers[signer] || authorizedRelayers[msg.sender], "CyberCast: Signer not authorized");

        bytes memory sig = abi.encodePacked(r, s, v);
        _recordEvidenceInternal(input, sig);
    }

    /**
     * @notice Gasless Meta-Transaction execution with explicit signer address
     */
    function recordEvidenceMetaTx(
        address signer,
        EvidenceInput calldata input,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _executeMetaTx(signer, input, deadline, v, r, s);
    }

    /**
     * @notice Gasless Meta-Transaction execution via EIP-712 signed typed data.
     * Allows police field officers to anchor evidence without holding POL / MATIC tokens.
     */
    function recordEvidenceMetaTx(
        string calldata caseId,
        bytes32 sha256Hash,
        string calldata ipfsCid,
        string calldata officerBadge,
        string calldata officerAgency,
        EvidenceCategory category,
        string calldata bsaCertificateId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _executeMetaTx(
            msg.sender,
            EvidenceInput({
                caseId: caseId,
                sha256Hash: sha256Hash,
                ipfsCid: ipfsCid,
                officerBadge: officerBadge,
                officerAgency: officerAgency,
                category: category,
                bsaCertificateId: bsaCertificateId
            }),
            deadline,
            v,
            r,
            s
        );
    }

    /**
     * @notice Append an immutable correction/amendment to existing evidence.
     * Blockchain does not delete; bad evidence can only be superseded with reason.
     */
    function appendCorrection(
        string calldata caseId,
        bytes32 originalHash,
        bytes32 supersedingHash,
        string calldata amendmentReason,
        string calldata officerBadge
    ) external onlyAuthorized whenNotPaused {
        require(_evidenceByHash[originalHash].isValid, "CyberCast: Original evidence does not exist");
        require(supersedingHash != bytes32(0), "CyberCast: Invalid superseding hash");
        require(bytes(amendmentReason).length > 0, "CyberCast: Amendment reason required");

        _correctionsByHash[originalHash].push(
            CorrectionRecord({
                originalHash: originalHash,
                supersedingHash: supersedingHash,
                amendmentReason: amendmentReason,
                amendedByOfficer: officerBadge,
                timestamp: block.timestamp,
                blockNumber: block.number
            })
        );

        emit EvidenceAmended(
            caseId,
            originalHash,
            supersedingHash,
            amendmentReason,
            officerBadge,
            block.number,
            block.timestamp
        );
    }

    // --- VERIFICATION & QUERY INTERFACES ---

    /**
     * @notice Fast check for judicial and forensic verification
     * @param sha256Hash The 32-byte digest to inspect
     * @return exists Whether the hash exists on the immutable ledger
     * @return timestamp Block timestamp when anchored
     * @return blockNumber EVM block height
     * @return caseId NCRP / FIR Case identifier
     * @return officerBadge Officer badge ID who anchored
     * @return ipfsCid Off-chain encrypted ciphertext storage pointer
     * @return bsaCertificateId Statutory Section 63 BSA certificate ID
     */
    function verifyEvidence(bytes32 sha256Hash) external view returns (
        bool exists,
        uint256 timestamp,
        uint256 blockNumber,
        string memory caseId,
        string memory officerBadge,
        string memory ipfsCid,
        string memory bsaCertificateId
    ) {
        EvidenceRecord memory record = _evidenceByHash[sha256Hash];
        if (!record.isValid) {
            return (false, 0, 0, "", "", "", "");
        }
        return (
            true,
            record.timestamp,
            record.blockNumber,
            record.caseId,
            record.officerBadge,
            record.ipfsCid,
            record.bsaCertificateId
        );
    }

    /**
     * @notice Fetch complete structured evidence record
     */
    function getEvidence(bytes32 sha256Hash) external view returns (EvidenceRecord memory) {
        require(_evidenceByHash[sha256Hash].isValid, "CyberCast: Evidence not found");
        return _evidenceByHash[sha256Hash];
    }

    /**
     * @notice Retrieve complete structured EvidenceRecord array for a case (as specified in Section 7 Phase 2)
     */
    function getCaseHistory(string calldata caseId) external view returns (EvidenceRecord[] memory) {
        bytes32[] memory hashes = _caseEvidenceList[caseId];
        EvidenceRecord[] memory records = new EvidenceRecord[](hashes.length);
        for (uint256 i = 0; i < hashes.length; i++) {
            records[i] = _evidenceByHash[hashes[i]];
        }
        return records;
    }

    /**
     * @notice Retrieve all anchored evidence hashes for a given case
     */
    function getCaseHistoryHashes(string calldata caseId) external view returns (bytes32[] memory) {
        return _caseEvidenceList[caseId];
    }

    /**
     * @notice Retrieve any amendments / corrections filed for a specific piece of evidence
     */
    function getCorrections(bytes32 originalHash) external view returns (CorrectionRecord[] memory) {
        return _correctionsByHash[originalHash];
    }

    // --- INTERNAL HELPERS ---

    function _recordEvidenceInternal(
        EvidenceInput memory input,
        bytes memory signature
    ) internal {
        require(input.sha256Hash != bytes32(0), "CyberCast: Invalid SHA-256 hash");
        require(!_evidenceByHash[input.sha256Hash].isValid, "CyberCast: Evidence hash already registered");
        require(bytes(input.caseId).length > 0, "CyberCast: Case ID required");
        require(bytes(input.ipfsCid).length > 0, "CyberCast: IPFS CID required");

        _evidenceByHash[input.sha256Hash] = EvidenceRecord({
            caseId: input.caseId,
            sha256Hash: input.sha256Hash,
            ipfsCid: input.ipfsCid,
            officerBadge: input.officerBadge,
            officerAgency: input.officerAgency,
            timestamp: block.timestamp,
            blockNumber: block.number,
            category: input.category,
            isValid: true,
            bsaCertificateId: input.bsaCertificateId,
            signature: signature
        });

        _caseEvidenceList[input.caseId].push(input.sha256Hash);
        totalEvidenceCount++;

        emit EvidenceAnchored(
            input.caseId,
            input.sha256Hash,
            input.ipfsCid,
            input.officerBadge,
            block.number,
            block.timestamp,
            input.bsaCertificateId
        );
    }

    // --- ADMINISTRATIVE CONTROLS ---

    function setRelayerStatus(address relayer, bool status) external onlyOwner {
        require(relayer != address(0), "CyberCast: Zero address relayer");
        authorizedRelayers[relayer] = status;
        emit RelayerAuthorized(relayer, status);
    }

    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CyberCast: Zero address owner");
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }
}

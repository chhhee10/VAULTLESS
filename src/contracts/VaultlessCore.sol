// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VaultlessCore {
    struct Identity {
        bytes32 commitmentHash;
        uint256 enrolledAt;
        bool isLocked;
        bool exists;
    }

    mapping(address => Identity) public identities;
    mapping(bytes32 => bool) public usedNullifiers;

    event Registered(address indexed user, uint256 timestamp);
    event AuthSuccess(address indexed user, bytes32 nullifier, uint256 timestamp);
    event AuthFailed(address indexed user, uint256 timestamp);
    event DuressActivated(address indexed user, uint256 timestamp);
    event Refined(address indexed user, uint256 timestamp);

    modifier onlyRegistered() {
        require(identities[msg.sender].exists, "Not registered");
        _;
    }

    modifier notLocked() {
        require(!identities[msg.sender].isLocked, "Account locked");
        _;
    }

    function register(bytes32 commitmentHash) external {
        require(!identities[msg.sender].exists, "Already registered");
        identities[msg.sender] = Identity({
            commitmentHash: commitmentHash,
            enrolledAt: block.timestamp,
            isLocked: false,
            exists: true
        });
        emit Registered(msg.sender, block.timestamp);
    }

    function authenticate(bytes32 nullifier) external onlyRegistered notLocked {
        require(!usedNullifiers[nullifier], "Nullifier already used - replay attack blocked");
        usedNullifiers[nullifier] = true;
        emit AuthSuccess(msg.sender, nullifier, block.timestamp);
    }

    function authFailed() external onlyRegistered {
        emit AuthFailed(msg.sender, block.timestamp);
    }

    // Duress is logged on-chain but does NOT permanently lock the account
    function triggerDuress() external onlyRegistered {
        emit DuressActivated(msg.sender, block.timestamp);
    }

    // Unlock a locked account (self-service)
    function unlockAccount() external onlyRegistered {
        identities[msg.sender].isLocked = false;
    }

    function refine(bytes32 newHash) external onlyRegistered notLocked {
        identities[msg.sender].commitmentHash = newHash;
        emit Refined(msg.sender, block.timestamp);
    }

    function getIdentity(address user) external view returns (
        bytes32 commitmentHash,
        uint256 enrolledAt,
        bool isLocked,
        bool exists
    ) {
        Identity memory id = identities[user];
        return (id.commitmentHash, id.enrolledAt, id.isLocked, id.exists);
    }

    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}

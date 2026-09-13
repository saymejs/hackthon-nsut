// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentVault
 * @notice Non-custodial budget vault for autonomous AI agents implementing HTTP 402 machine payments.
 * @dev Enforces cumulative spending ceilings strictly at the consensus/EVM layer to prevent
 *      runaway agent loops, prompt injection exploits, and balance depletion.
 */
contract AgentVault {
    // -----------------------------------------------------------------------
    // State Variables
    // -----------------------------------------------------------------------

    /// @notice The human owner who deploys the vault, defines limits, and can withdraw funds.
    address public owner;

    /// @notice The authorized AI agent address permitted to trigger payment executions.
    address public agent;

    /// @notice Maximum cumulative Wei the agent is permitted to spend.
    uint256 public spendLimit;

    /// @notice Cumulative Wei spent to date by the agent.
    uint256 public totalSpent;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    /// @notice Emitted whenever a machine payment to a service provider is settled on-chain.
    /// @param paymentId Unique invoice or challenge identifier (indexed as a topic hash).
    /// @param provider The recipient provider receiving the payment.
    /// @param amount The native ETH amount in Wei transferred to the provider.
    /// @param contentHash Cryptographic SHA-256 digest or commitment of the delivered resource.
    event ServicePaid(
        string indexed paymentId,
        address indexed provider,
        uint256 amount,
        bytes32 contentHash
    );

    /// @notice Emitted when the human owner updates the cumulative spend limit.
    /// @param newLimit The new maximum allowable cumulative spend in Wei.
    event LimitSet(uint256 newLimit);

    /// @notice Emitted when the authorized agent address is updated.
    /// @param newAgent The new AI agent address.
    event AgentUpdated(address indexed newAgent);

    // -----------------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "NOT_AUTHORIZED_AGENT");
        _;
    }

    // -----------------------------------------------------------------------
    // Constructor & Receive
    // -----------------------------------------------------------------------

    /**
     * @notice Initializes the agent vault with an authorized agent and cumulative spend ceiling.
     * @param _agent Authorized AI agent address.
     * @param _spendLimit Initial cumulative spending limit in Wei.
     */
    constructor(address _agent, uint256 _spendLimit) payable {
        require(_agent != address(0), "INVALID_AGENT");
        owner = msg.sender;
        agent = _agent;
        spendLimit = _spendLimit;

        emit LimitSet(_spendLimit);
        emit AgentUpdated(_agent);
    }

    /**
     * @notice Allows funding the vault with native ETH at any time.
     */
    receive() external payable {}

    // -----------------------------------------------------------------------
    // Agent Payment Execution (Core Invariant)
    // -----------------------------------------------------------------------

    /**
     * @notice Settles an HTTP 402 invoice payment to an external service provider.
     * @dev Strictly enforces:
     *      1. Caller authorization (only approved AI agent key).
     *      2. Cumulative budget ceiling (`totalSpent + amount <= spendLimit`).
     *      3. Vault solvency (`address(this).balance >= amount`).
     *      4. Checks-Effects-Interactions (CEI) to eliminate reentrancy vulnerabilities.
     * @param paymentId The unique payment identifier from the HTTP 402 challenge.
     * @param provider The payable address of the mock service provider.
     * @param amount The cost of the service in Wei.
     * @param contentHash The SHA-256 digest commitment for proof of delivery.
     */
    function payService(
        string calldata paymentId,
        address payable provider,
        uint256 amount,
        bytes32 contentHash
    ) external onlyAgent {
        require(provider != address(0), "INVALID_PROVIDER");
        require(totalSpent + amount <= spendLimit, "BUDGET_EXCEEDED");
        require(address(this).balance >= amount, "INSUFFICIENT_VAULT_BALANCE");

        // 1. Checks-Effects: Increment cumulative spend BEFORE external interaction
        totalSpent += amount;

        // 2. Interaction: Low-level call to provider
        (bool success, ) = provider.call{value: amount}("");
        require(success, "PAYMENT_FAILED");

        emit ServicePaid(paymentId, provider, amount, contentHash);
    }

    // -----------------------------------------------------------------------
    // Owner Administration
    // -----------------------------------------------------------------------

    /**
     * @notice Updates the cumulative spend limit.
     * @param _newLimit The updated spend ceiling in Wei.
     */
    function setLimit(uint256 _newLimit) external onlyOwner {
        spendLimit = _newLimit;
        emit LimitSet(_newLimit);
    }

    /**
     * @notice Replaces the authorized AI agent address.
     * @param _newAgent Address of the new agent signer.
     */
    function setAgent(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "INVALID_AGENT");
        agent = _newAgent;
        emit AgentUpdated(_newAgent);
    }

    /**
     * @notice Allows the human owner to withdraw vault funds safely.
     * @dev Uses low-level `.call` rather than `.transfer()` to support multi-sig
     *      and smart-contract wallets (e.g., Safe) without 2300 gas stipend limits.
     * @param amount The native ETH amount in Wei to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "EXCEEDS_BALANCE");

        (bool success, ) = owner.call{value: amount}("");
        require(success, "WITHDRAW_FAILED");
    }
}

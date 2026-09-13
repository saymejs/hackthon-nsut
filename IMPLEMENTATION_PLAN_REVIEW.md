# Autonomous Agent Safe Payments (HTTP 402 + Smart Vault)
## Architecture Understanding & Implementation Plan for External Review

> **Document Purpose:** This document provides a complete summary of our architectural understanding and a phased implementation plan for the **Autonomous Agent Safe Payments Framework**. It is formatted for direct sharing with an AI reviewer (such as Gemini) or technical auditor for double-checking design decisions, security invariants, and execution milestones before any code is written.

---

## Part 1: System Understanding & Architectural Analysis

### 1. The Core Problem
Autonomous AI agents executing complex multi-step workflows (e.g., purchasing compute, querying premium APIs, booking services) require payment capabilities. However:
1. **Software-Level Checks are Suggestions, Not Guarantees:** Enforcing spending limits inside Python/Node.js application logic (e.g., `if (spent + cost > budget): raise Error`) is fundamentally vulnerable. Hallucinations, prompt injections, unhandled recursive loops, and process memory corruptions can easily bypass software-level guards.
2. **Raw Wallet Access is Fatal:** Giving an agent direct access to an unrestricted private key or credit card risks catastrophic balance drain in seconds.

### 2. The Solution: Consensus-Enforced Smart Vault
We insert an immutable EVM smart contract (**`AgentVault.sol`**) between the agent and external service providers:
* **Separation of Roles:**
  * **Owner (Human):** Deploys the contract, deposits ETH, sets/updates the cumulative `spendLimit`, assigns the agent's key, and can withdraw unspent funds.
  * **Agent (AI Signer):** Possesses a private key authorized *only* to call `payService()`. The agent cannot withdraw funds or transfer ETH to arbitrary unapproved accounts.
* **Deterministic EVM Invariant:**
  $$\text{totalSpent} + \text{amount} \le \text{spendLimit}$$
  This rule is enforced by EVM consensus. If an agent tries to overspend—regardless of why—the transaction hard-reverts on-chain with `"BUDGET_EXCEEDED"`. No ETH leaves the contract.

---

### 3. Machine Payment Protocol (HTTP 402 Standard)

```
   [ Human Owner ]
          │ (Deploys & deposits ETH, sets spendLimit)
          ▼
   ┌───────────────┐
   │ AgentVault.sol│ ◄────── ETH Vault Balance (e.g., 1.0 ETH)
   └───────▲───────┘
           │ 2. payService(paymentId, payTo, amount, contentHash)
           │    [EVM Invariant: totalSpent + amount <= spendLimit]
           │
   ┌───────┴───────┐           1. POST /service/compute (unauthenticated) ┌───────────────┐
   │               │ ───────────────────────────────────────────────────► │               │
   │               │ ◄─────────────────────────────────────────────────── │               │
   │   AI Agent    │           402 Payment Required (invoice, amount)     │  Mock 402     │
   │   (Python)    │                                                      │  Provider     │
   │               │ 3. POST /service/compute + X-Payment-TxHash          │  (FastAPI)    │
   │               │ ───────────────────────────────────────────────────► │               │
   │               │ ◄─────────────────────────────────────────────────── │               │
   └───────────────┘           200 OK + Payload + SHA-256 Digest          └───────────────┘
```

The system operates across a 5-state lifecycle:
1. **State 1 (Initialization):** Owner deploys `AgentVault` with `agentAddress` and `spendLimit`, then deposits native ETH via `receive()`.
2. **State 2 (HTTP 402 Handshake):** Agent queries the service endpoint without payment. The provider returns `HTTP 402 Payment Required` with `WWW-Authenticate: x402` and an invoice JSON (`paymentId`, `recipient`, `amountWei`, `expiresAt`).
3. **State 3 (On-Chain Settlement):** Agent signs and sends `AgentVault.payService()`. The contract validates the budget, increments `totalSpent`, transfers ETH to the provider, and emits the `ServicePaid` event.
4. **State 4 (Idempotent Fulfill & Delivery):** Agent re-submits the request with `X-Payment-Id` and `X-Payment-TxHash`. The provider verifies the transaction on-chain, generates a SHA-256 content hash, caches the result, and returns `HTTP 200 OK`. If replayed with the same `paymentId`, the provider returns the cached output at zero additional charge (`idempotencyHit: true`).
5. **State 5 (Budget Breach Defense):** If the agent attempts a payment that exceeds `spendLimit`, the contract hard-reverts with `"BUDGET_EXCEEDED"`. The agent catches the revert and stops safely without balance depletion.

---

### 4. Component Boundaries & Strict Rules

| Component | Technology | Primary Responsibilities & Strict Boundaries |
| :--- | :--- | :--- |
| **`/contracts`** | Solidity `^0.8.20`, Hardhat | • Holds funds; enforces cumulative `spendLimit`.<br>• Uses **Checks-Effects-Interactions (CEI)** pattern: state is updated before external calls.<br>• `withdraw()` uses low-level `.call` for smart wallet compatibility.<br>• Emits `ServicePaid` event on settlement. |
| **`/provider`** | Python FastAPI, SQLite/Dict | • Generates unique `paymentId`s.<br>• Returns standardized `HTTP 402` challenge.<br>• Verifies transaction receipts and `ServicePaid` events on-chain.<br>• Enforces **idempotency**: never charges twice for the same `paymentId`.<br>• Computes SHA-256 content hashes for proof of delivery. |
| **`/agent`** | Python 3.11+, `web3.py v6+`, `httpx` | • Intercepts 402, parses invoice, signs `payService()` transactions.<br>• Verifies delivered payload against `contentHash`.<br>• **Strict rule:** NEVER implements client-side spending checks (e.g. `if spent > limit`). Budget gating must happen 100% on-chain. |
| **`/frontend`** | Next.js 14 (App Router), Tailwind CSS, `viem` | • Real-time display of Vault ETH Balance, Total Cap, and Spent Amount.<br>• Real-time table listening to `ServicePaid` events.<br>• Visual 402 inspector and one-click overspend attack simulation. |

---

## Part 2: Step-by-Step Implementation Plan

### Milestone 1: Smart Vault Contract (`/contracts`)
- [ ] **Contract Implementation (`contracts/AgentVault.sol`):**
  - State variables: `address public owner`, `address public agent`, `uint256 public spendLimit`, `uint256 public totalSpent`.
  - Canonical revert strings: `"NOT_OWNER"`, `"NOT_AUTHORIZED_AGENT"`, `"BUDGET_EXCEEDED"`, `"INSUFFICIENT_VAULT_BALANCE"`, `"PAYMENT_FAILED"`, `"EXCEEDS_BALANCE"`, `"WITHDRAW_FAILED"`.
  - Functions:
    - `payService(string calldata paymentId, address payable provider, uint256 amount, bytes32 contentHash) external`
    - `setLimit(uint256 _newLimit) external` (Owner only)
    - `setAgent(address _newAgent) external` (Owner only)
    - `withdraw(uint256 amount) external` (Owner only, via `.call`)
    - `receive() external payable` (Funding fallback)
  - Events: `ServicePaid(string indexed paymentId, address indexed provider, uint256 amount, bytes32 contentHash)`, `LimitSet(uint256 newLimit)`.
- [ ] **Automated Test Suite (`contracts/test/AgentVault.test.js`):**
  - Normal payment within limit succeeds and emits `ServicePaid`.
  - Unauthorized caller reverts with `"NOT_AUTHORIZED_AGENT"`.
  - Payment pushing `totalSpent > spendLimit` hard-reverts with `"BUDGET_EXCEEDED"`.
  - Contract with insufficient ETH balance reverts with `"INSUFFICIENT_VAULT_BALANCE"`.
  - Owner withdrawal works with low-level `.call`.
- [ ] **Deployment Script (`contracts/scripts/deploy.js`):**
  - Deploys `AgentVault` to local Hardhat node or Sepolia testnet.
  - Automatically exports contract address and ABI to a shared JSON configuration file.

---

### Milestone 2: Mock 402 Service Provider (`/provider`)
- [ ] **Provider Setup (`provider/main.py`, `provider/schemas.py`, `provider/store.py`):**
  - Dependencies: `fastapi>=0.100.0`, `uvicorn>=0.22.0`, `web3>=6.0.0`, `pydantic`.
  - Implement Pydantic models matching `data-schema.md`: `InvoiceChallenge`, `HTTP402Payload`, `PaymentClaimRequest`, `DeliveryReceipt`.
- [ ] **Challenge Endpoint (`POST /api/v1/service/:serviceId`):**
  - When called without headers, returns `HTTP 402 Payment Required` with `WWW-Authenticate: x402` header and structured JSON invoice (`paymentId`, `recipient`, `amountWei`, `expiresAt`).
- [ ] **Fulfillment & On-Chain Verification:**
  - When called with `X-Payment-Id` and `X-Payment-TxHash`:
    - **Idempotency Check:** If `paymentId` is already marked `FULFILLED`, return cached output with `idempotencyHit: true` at zero cost.
    - **On-Chain Verification:** Use `web3.py` to inspect `txHash`. Confirm `receipt.status == 1`, verify recipient matches provider address, and verify amount paid matches invoice.
    - **Delivery:** Compute SHA-256 `contentHash` of output payload, store record in cache, and return `HTTP 200 OK`.

---

### Milestone 3: AI Agent Core & Overspend Simulation (`/agent`)
- [ ] **Agent Runtime (`agent/agent.py`):**
  - Uses `httpx` and `web3.py v6+`.
  - Holds only the private key for `agentSigner`.
  - **Full automated loop:**
    1. Sends unauthenticated request to provider $\rightarrow$ catches `HTTP 402`.
    2. Parses invoice parameters (`paymentId`, `recipient`, `amountWei`).
    3. Formats and broadcasts `AgentVault.payService(...)` transaction.
    4. Waits for transaction receipt.
    5. Re-queries provider with payment headers and receives deliverable.
    6. Verifies payload SHA-256 hash matches returned `contentHash`.
    7. Tests idempotency by repeating request with same `paymentId` and asserting zero extra charge.
- [ ] **Overspend Attack Simulation (`agent/simulate_overspend.py`):**
  - Simulates a compromised or runaway agent attempting to purchase a compute batch costing more than remaining `spendLimit`.
  - **Zero client-side check:** The script directly submits the transaction to the EVM.
  - Verifies that the contract hard-reverts with `"BUDGET_EXCEEDED"`, halts the agent, and leaves the vault balance 100% intact.

---

### Milestone 4: Owner Dashboard (`/frontend`)
- [ ] **Next.js 14 App Router UI (`frontend/`):**
  - Built with Tailwind CSS and `viem`.
  - **Vault Stats Panel:** Real-time ETH balance, spend limit, total spent, and visual budget utilization gauge.
  - **Live 402 Handshake Terminal:** Step-by-step visual stream showing request $\rightarrow$ 402 challenge $\rightarrow$ on-chain settlement $\rightarrow$ 200 delivery.
  - **On-Chain Activity Table:** Real-time event listener watching `ServicePaid` events via `viem.watchContractEvent`.
  - **Exploit Defense Demo:** Interactive button that triggers the overspend script and highlights the on-chain `"BUDGET_EXCEEDED"` security block in the UI.

---

## Part 3: Verification & Acceptance Criteria

1. **Smart Contract Verification:**
   ```bash
   cd contracts && npx hardhat test
   ```
   *Expectation:* 100% passing tests, confirming access control, CEI state updates, and EVM revert on overspend.
2. **Provider & Agent E2E Integration:**
   * Step 1: Start local node (`npx hardhat node`).
   * Step 2: Deploy `AgentVault` funded with 1.0 ETH, `spendLimit` = 0.05 ETH.
   * Step 3: Start FastAPI provider (`uvicorn main:app --port 8000`).
   * Step 4: Run `python3 agent/agent.py`.
     * *Expectation:* Successful 402 handshake $\rightarrow$ On-chain tx $\rightarrow$ 200 OK delivery with verified SHA-256 hash $\rightarrow$ Successful idempotent retry.
   * Step 5: Run `python3 agent/simulate_overspend.py`.
     * *Expectation:* Script attempts payment of 0.1 ETH $\rightarrow$ Transaction reverts on-chain with `"BUDGET_EXCEEDED"` $\rightarrow$ Agent logs security block; 0 ETH lost.
3. **Frontend Verification:**
   * Run `npm run dev` in `/frontend`.
   * Verify real-time event updates and metric changes as transactions are processed.

---

## Part 4: Specific Review Prompts for Gemini / External Reviewer

When sharing this document with Gemini for double-checking, here are recommended questions to ask:

1. **Security & Invariants:** Does `AgentVault.sol` properly guard against reentrancy, unauthorized withdrawals, and arbitrary balance drains? Is the Checks-Effects-Interactions (CEI) implementation airtight?
2. **Protocol Compatibility:** Does the HTTP 402 handshake and headers (`WWW-Authenticate: x402`, `X-Payment-Id`, `X-Payment-TxHash`) adhere cleanly to emerging machine payment standards (such as L402/x402)?
3. **Idempotency & Replay Protection:** Does the provider's receipt verification and caching logic prevent replay attacks and double-charging?
4. **Architectural Simplicity:** Is the division of responsibilities between `/contracts`, `/provider`, `/agent`, and `/frontend` clean, minimal, and fully aligned with the requirements?

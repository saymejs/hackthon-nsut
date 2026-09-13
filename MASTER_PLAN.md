# Autonomous Agent Safe Payments (HTTP 402 + Smart Vault)
## Master Blueprint & Implementation Plan

This document consolidates all project specifications in their canonical order, followed by the system understanding and the milestone execution plan.

---

## Table of Contents
1. [PRD (Product Requirements Document)](#1-prd-product-requirements-document)
2. [Technical Specification](#2-technical-specification)
3. [App Flow & State Machine](#3-app-flow--state-machine)
4. [Data Schema Specification](#4-data-schema-specification)
5. [Agent Execution Rules](#5-agent-execution-rules)
6. [System Understanding in Plain English](#6-system-understanding-in-plain-english)
7. [Step-by-Step Implementation Plan](#7-step-by-step-implementation-plan)

---

## 1. PRD (Product Requirements Document)

### Problem Statement
Autonomous AI agents with direct access to private keys or payment channels can rapidly drain balances through hallucinations, adversarial prompt injection, or broken recursive loops. Existing software-level checks inside the agent logic are suggestions, not guarantees.

### Product Overview
A non-custodial, deterministic agent payment framework implementing machine payments (HTTP 402). The agent autonomously discovers paid services, pays on-chain via a dedicated smart vault, and cryptographically records proofs of delivery. Spending allowances are enforced strictly at the smart contract level—making budget overruns physically impossible.

### Core User Flow
1. **Owner Setup:** Human owner deploys `AgentVault.sol`, funds it with native testnet ETH, assigns the agent's signer address, and defines a strict spend ceiling.
2. **402 Handshake:** The agent makes a standard HTTP request to a paid mock provider and receives an `HTTP 402 Payment Required` payload containing price, recipient address, and an invoice ID.
3. **Smart Vault Execution:** The agent calls `AgentVault.payService()`. The contract checks `totalSpent + amount <= spendLimit`, sends ETH to the provider, logs delivery proof, and records the spend on-chain.
4. **Idempotent Delivery:** The agent claims the resource with the transaction proof. The provider delivers the data with a SHA-256 content hash. If the agent retries, the provider returns cached data without charging again.
5. **Overspend Protection Demo:** The agent is given a malicious or runaway prompt to overspend. The transaction is hard-reverted on-chain (`BUDGET_EXCEEDED`), proving external enforcement.

### Scope
* **In-Scope (MVP):**
  * EVM smart contract budget vault.
  * Standalone mock service provider running HTTP 402 endpoints.
  * Python/Node.js autonomous agent runtime.
  * Idempotency check on provider requests.
  * Content hash (proof of delivery) event logging.
  * Scripted overspend test case triggering a hard revert.
* **Out-of-Scope:**
  * Fiat/credit card payment rails.
  * Multi-token ERC-20 swap logic.
  * Full-scale production MPC key rotation.
  * Multi-page user auth systems.

---

## 2. Technical Specification

### Architecture Overview
* **Smart Contract Layer (`/contracts`):** Solidity `^0.8.20` running on local Hardhat/Anvil or Ethereum Sepolia Testnet.
* **Mock Service Provider (`/provider`):** Python FastAPI (or Express.js) serving paid endpoints protected by HTTP 402 headers.
* **AI Agent Core (`/agent`):** Python 3.11+ using `web3.py` (v6+) and `httpx`/`requests`.
* **Dashboard (`/frontend`):** Next.js 14+ (App Router), Tailwind CSS, `viem`/`wagmi` for contract event reading.

### Component Boundaries
* **The Agent:** Has no raw access to an unrestricted wallet. It only holds the key authorized to call `AgentVault.payService()`.
* **The Vault:** Tracks `spendLimit` and `totalSpent`. Disallows any transfer exceeding `spendLimit` via EVM revert.
* **The Provider:** Generates deterministic `paymentId`s, calculates `sha256(payload)` for delivery receipts, and enforces idempotency via an in-memory or SQLite key-value store.

### Security & Pattern Requirements
* All state updates (`totalSpent += amount`) must occur **before** external low-level calls (`.call{value: amount}("")`) to prevent reentrancy (Checks-Effects-Interactions pattern).
* Transfers to the owner inside `withdraw()` must use low-level `.call` rather than `.transfer()` to support smart contract wallets.

---

## 3. App Flow & State Machine

### State 1: Initialization
* Human owner deploys `AgentVault(agentAddress, spendLimit)`.
* Human deposits initial ETH into the contract via `receive()`.

### State 2: Machine Payment Handshake (HTTP 402)
1. Agent requests `POST /api/v1/service/compute`.
2. Provider checks authorization/payment header. None found.
3. Provider responds with `402 Payment Required` + JSON body:
   * `paymentId`: Unique identifier string.
   * `payTo`: Provider payout address.
   * `amountWei`: Cost of request in Wei.

### State 3: On-Chain Settlement
1. Agent processes 402 payload and constructs `payService(paymentId, payTo, amountWei, contentHash)`.
2. EVM checks:
   * `msg.sender == agent`
   * `totalSpent + amount <= spendLimit`
   * `contractBalance >= amount`
3. EVM increments `totalSpent += amount`, forwards ETH to `payTo`, and emits `ServicePaid`.

### State 4: Idempotent Fulfill & Delivery
1. Agent re-requests `POST /api/v1/service/compute` sending headers:
   * `X-Payment-Id: <paymentId>`
   * `X-Payment-TxHash: <txHash>`
2. Provider validates transaction on-chain (or checks `paymentId` status).
3. Provider marks invoice `FULFILLED` and returns payload + SHA-256 digest.
4. **Retry Test:** If agent submits the same `paymentId` again, provider returns the cached output immediately at zero cost.

### State 5: Budget Breach Attempt (Failure Case)
1. Agent attempts to pay for a request that pushes `totalSpent > spendLimit`.
2. Smart contract execution reverts with `BUDGET_EXCEEDED`.
3. Agent terminal and UI capture and display the revert error.

---

## 4. Data Schema Specification

### 4.1 HTTP 402 Machine Payment Protocol Schemas

#### Service Invocation Request (Unauthenticated)
* **Endpoint:** `POST /api/v1/service/:serviceId`
* **Headers:** `Content-Type: application/json`
```json
{
  "serviceId": "compute-task-v1",
  "parameters": {
    "taskType": "matrix_multiplication",
    "workloadUnits": 50
  },
  "clientCallbackUrl": null
}
```

#### HTTP 402 Payment Challenge Response
* **Status:** `402 Payment Required`
* **Headers:**
  * `WWW-Authenticate: x402 token_type="ETH", network="sepolia"`
  * `Content-Type: application/json`
```json
{
  "status": 402,
  "error": "Payment Required",
  "protocol": "x402",
  "version": "1.0",
  "invoice": {
    "paymentId": "inv_98a7f4c2-28e4-4a21-8f90-e123456789ab",
    "recipient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "amountWei": "1000000000000000",
    "amountEth": "0.001",
    "chainId": 11155111,
    "serviceEndpoint": "/api/v1/service/compute-task-v1",
    "expiresAt": 1773334800,
    "nonce": 42
  }
}
```

#### Paid Resource Fulfillment Request (Retry with Proof)
* **Endpoint:** `POST /api/v1/service/:serviceId`
* **Headers:**
  * `Content-Type: application/json`
  * `X-Payment-Id: inv_98a7f4c2-28e4-4a21-8f90-e123456789ab`
  * `X-Payment-TxHash: 0x4a5b6c7d8e9f...`
```json
{
  "serviceId": "compute-task-v1",
  "paymentId": "inv_98a7f4c2-28e4-4a21-8f90-e123456789ab",
  "txHash": "0x4a5b6c7d8e9f...",
  "agentAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
}
```

#### Service Delivery Response (HTTP 200 OK)
* **Status:** `200 OK`
```json
{
  "status": 200,
  "paymentId": "inv_98a7f4c2-28e4-4a21-8f90-e123456789ab",
  "delivered": true,
  "idempotencyHit": false,
  "result": {
    "computedOutput": "Matrix resolution output stream: [0.981, 0.441, 0.119]",
    "executionTimeMs": 142
  },
  "contentHash": "0xa6c9b7410de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
  "deliveredAt": 1773334812
}
```

### 4.2 Smart Contract Interface (`AgentVault.sol`)
```solidity
address public owner;
address public agent;
uint256 public spendLimit;
uint256 public totalSpent;

function setLimit(uint256 _newLimit) external;
function setAgent(address _newAgent) external;
function payService(
    string calldata paymentId,
    address payable provider,
    uint256 amount,
    bytes32 contentHash
) external;
function withdraw(uint256 amount) external;

event ServicePaid(
    string indexed paymentId,
    address indexed provider,
    uint256 amount,
    bytes32 contentHash
);
event LimitSet(uint256 newLimit);
```

#### Canonical Revert Reasons
* `"NOT_OWNER"`
* `"NOT_AUTHORIZED_AGENT"`
* `"BUDGET_EXCEEDED"`
* `"INSUFFICIENT_VAULT_BALANCE"`
* `"PAYMENT_FAILED"`
* `"EXCEEDS_BALANCE"`
* `"WITHDRAW_FAILED"`

---

## 5. Agent Execution Rules

1. **Project Organization:**
   * `/contracts` — All Solidity source code, deploy scripts, and Hardhat tests.
   * `/provider` — Mock HTTP 402 server and invoice persistence logic.
   * `/agent` — Agent runtime, payment automation, and exploit simulation scripts.
   * `/frontend` — Minimal Next.js UI.
   * *Do NOT create additional root-level directories or rearrange this structure.*
2. **Core Constraints:**
   * **Enforce at the Contract Layer:** NEVER write client-side spending checks like `if (agentSpent > limit)` in Python or JavaScript to simulate budget enforcement. All budget gating MUST happen inside `AgentVault.sol` via `require()`.
   * **Security Discipline:** Always increment `totalSpent` before sending ETH via `.call{value: amount}("")`.
   * **Idempotency is Mandatory:** The provider must never charge twice for an identical `paymentId`.
   * **Dependency Versions:**
     * Python: `web3>=6.0.0`, `fastapi>=0.100.0`, `uvicorn>=0.22.0`.
     * Node: `ethers@6` or `viem`. Never mix Ethers v5 with v6.
3. **Coding Style & Cleanliness:**
   * Keep the code minimal, readable, and functional.
   * Do not introduce extraneous libraries or third-party auth services.

---

## 6. System Understanding in Plain English

```
   [ Human Owner ]
          │ (Deploys & sets spendLimit, e.g. 0.05 ETH)
          ▼
   ┌───────────────┐
   │ AgentVault.sol│ ◄────── ETH Vault Balance (1.0 ETH)
   └───────▲───────┘
           │ 2. payService(paymentId, payTo, amount)
           │    [EVM Invariant: totalSpent + amount <= spendLimit]
           │
   ┌───────┴───────┐           1. POST /service/compute (no auth)         ┌───────────────┐
   │               │ ───────────────────────────────────────────────────► │               │
   │               │ ◄─────────────────────────────────────────────────── │               │
   │   AI Agent    │           402 Payment Required (invoice, amount)     │  Mock 402     │
   │   (Python)    │                                                      │  Provider     │
   │               │ 3. POST /service/compute + X-Payment-TxHash          │  (FastAPI)    │
   │               │ ───────────────────────────────────────────────────► │               │
   │               │ ◄─────────────────────────────────────────────────── │               │
   └───────────────┘           200 OK + Payload + SHA-256 Digest          └───────────────┘
```

1. **Why Smart Contracts?** Software-level agent limits can be tricked or hallucinated away. By putting the limit in an immutable EVM contract (`AgentVault`), budget enforcement is guaranteed by math and consensus.
2. **The 402 Handshake:** Standard machine-to-machine commerce. The service requests payment via HTTP 402, the agent pays on-chain, and then claims the resource with transaction proof.
3. **Idempotency:** The provider verifies payment once, caches the result under `paymentId`, and subsequent retries are free.
4. **The Overspend Test:** When ordered to breach the budget, the agent's transaction hard-reverts on-chain with `"BUDGET_EXCEEDED"`, guaranteeing zero financial loss.

---

## 7. Step-by-Step Implementation Plan

### Milestone 1: Smart Vault Contract (`/contracts`)
- [ ] Create `contracts/AgentVault.sol` with state variables (`owner`, `agent`, `spendLimit`, `totalSpent`).
- [ ] Implement `payService()` with strict CEI pattern and canonical revert strings (`"BUDGET_EXCEEDED"`, etc.).
- [ ] Implement `withdraw()` using low-level `.call` for smart wallet support.
- [ ] Write unit tests in `contracts/test/AgentVault.test.js` covering normal payment, overspend revert, and access control.
- [ ] Write deploy script `contracts/scripts/deploy.js`.

### Milestone 2: Mock 402 Provider Server (`/provider`)
- [ ] Setup FastAPI server with endpoints in `provider/main.py`.
- [ ] Implement `POST /api/v1/service/:serviceId` returning HTTP 402 challenge with `WWW-Authenticate: x402`.
- [ ] Implement in-memory/SQLite idempotency cache (`paymentId` -> record).
- [ ] Implement payment claim verification against the EVM receipt and `ServicePaid` event.
- [ ] Implement delivery with SHA-256 content hash and zero-cost idempotent replay.

### Milestone 3: AI Agent Core & Overspend Script (`/agent`)
- [ ] Implement `agent/agent.py` using `httpx` and `web3.py v6+`.
- [ ] Intercept HTTP 402, sign `payService()`, await receipt, and re-request with headers.
- [ ] Verify returned payload SHA-256 hash against `contentHash`.
- [ ] Test idempotent retry (re-send same `paymentId`, verify `idempotencyHit: true`).
- [ ] Implement `agent/simulate_overspend.py`: trigger a transaction exceeding `spendLimit` and capture the on-chain `"BUDGET_EXCEEDED"` revert.

### Milestone 4: Owner Dashboard (`/frontend`)
- [ ] Scaffold minimal Next.js 14 App Router project with Tailwind CSS and `viem`.
- [ ] Build Vault Overview card: live ETH balance, spend limit, total spent, and utilization gauge.
- [ ] Build Live Handshake Stream: visualize 402 challenge, transaction hash, and SHA-256 deliverable.
- [ ] Build Event Table listening to real-time `ServicePaid` contract events.
- [ ] Add "Simulate Runaway Agent" button to trigger the overspend test and display the security block.

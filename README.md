# Agent SafePay (W3A-1) — Autonomous Agent Safe Payments

> **A non-custodial, deterministic payment framework implementing machine payments (HTTP 402) with on-chain budget vault protection.**

---

## 1. Problem Statement
Autonomous AI agents with direct access to private keys or credit cards can rapidly drain balances through hallucinations, prompt injections, or recursive infinite loops. Software-level spend checks inside Python/Node.js logic are suggestions, not guarantees.

## 2. Our Solution: Consensus-Enforced Budget Vault
We insert an immutable EVM smart contract (`AgentVault.sol`) between the agent and service providers:
* **Separation of Roles:** Human owner deploys the vault, funds it with ETH, and sets a strict cumulative `spendLimit`. The AI agent holds a restricted signer key that can *only* call `payService()`.
* **Hard EVM Invariant:** The contract enforces `require(totalSpent + amount <= spendLimit, "BUDGET_EXCEEDED")`. Overspend attempts are hard-reverted at the consensus layer. Zero ETH lost.
* **HTTP 402 Machine Payments:** Standardized machine-to-machine commerce with automated invoicing and SHA-256 proof of delivery.
* **Strict Idempotency:** The provider never charges twice for the same `paymentId`.

---

## 3. Architecture & Protocol Flow

```
   [ Human Owner ]
          │ (Deploys & deposits ETH, sets spendLimit)
          ▼
   ┌───────────────┐
   │ AgentVault.sol│ ◄────── ETH Vault Balance (1.0 ETH)
   └───────▲───────┘
           │ 2. payService(paymentId, payTo, amount, contentHash)
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

---

## 4. Repository Structure

```
hackthon-nsut/
├── contracts/               # Solidity ^0.8.20 Smart Contract & Hardhat Tests
│   ├── contracts/
│   │   └── AgentVault.sol   # CEI pattern, spendLimit, ServicePaid event
│   ├── test/
│   │   └── AgentVault.test.js # 14/14 automated unit tests (100% coverage)
│   ├── scripts/
│   │   └── deploy.js        # Deployment & ABI exporter
│   ├── hardhat.config.js    # Hardhat local node configuration
│   └── deployed_vault.json  # Exported contract address and full ABI
│
├── provider/                # Mock HTTP 402 Service Provider (Python FastAPI)
│   ├── main.py              # 402 challenge, receipt verification, idempotency
│   ├── requirements.txt     # fastapi, uvicorn, web3, pydantic, httpx
│   └── test_provider.py     # 3/3 automated provider integration tests
│
├── frontend/                # Next.js 14 App Router + Tailwind CSS Dashboard
│   ├── src/app/             # Tactile Neumorphic Google Stitch design
│   ├── src/components/      # 5 Command Bay views (Overview, Guard, Tx, Policies, Logs)
│   ├── src/lib/             # Viem contract client & live USD oracle formatters
│   └── package.json         # Next.js 14, viem, tailwindcss
│
├── deployed_vault.json      # Shared deployment metadata mirror
├── MASTER_PLAN.md           # Master blueprint & canonical specification
└── IMPLEMENTATION_PLAN_REVIEW.md # Technical review document
```

---

## 5. Quickstart Guide

### A. Smart Contracts (`/contracts`)
```bash
cd contracts
npm install

# Run the 14 automated unit tests:
npx hardhat test

# Deploy locally:
npx hardhat run scripts/deploy.js
```

### B. Mock HTTP 402 Service Provider (`/provider`)
```bash
cd provider
pip install -r requirements.txt

# Run the automated provider tests (402 Challenge, Delivery, Idempotency):
python3 test_provider.py

# Start the live API server:
uvicorn main:app --reload --port 8000
```

### C. Frontend Dashboard (`/frontend`)
```bash
cd frontend
npm install

# Start the Next.js development server:
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 6. Live Attack Simulation Demo

1. Open **`http://localhost:3000`** in your browser.
2. Click **"Trigger Standard Purchase (0.001 ETH / ~$2.50)"**:
   - Observes normal HTTP 402 negotiation, on-chain vault settlement, and proof-of-delivery logging.
3. Click **"Simulate Overspend Attack (Attempt 0.1 ETH / ~$250.00)"**:
   - Simulates a runaway loop or prompt injection attempting to exceed the remaining allowance.
   - The EVM hard-reverts with **`BUDGET_EXCEEDED`**.
   - Displays the prominent red warning banner proving **0 ETH ($0.00) was lost**.

---

## 7. License
MIT

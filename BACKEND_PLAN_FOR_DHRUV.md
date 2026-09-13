# Backend & Autonomous Agent Architecture Plan (For Dhruv)
## Project: Agent SafePay (W3A-1) — Autonomous Agent Safe Payments

> **A non-custodial, deterministic payment framework implementing machine payments (HTTP 402) with on-chain budget vault protection.**

---

## 1. Project Overview & Mental Model

### The Problem
Autonomous AI agents with direct access to private keys or credit cards can rapidly drain balances through hallucinations, prompt injections, or recursive infinite loops. Software-level spend checks inside Python or Node.js logic (`if spent > limit`) are suggestions, not guarantees—an attacker or a prompt injection can bypass them.

### Our Solution: Smart Contract Budget Circuit Breaker
We place an immutable EVM smart contract (`AgentVault.sol`) between the agent and service providers:
* **Separation of Roles:** The human owner deploys the vault, funds it with ETH, and sets a strict cumulative `spendLimit`. The AI agent holds a restricted signer key that can *only* call `payService()`.
* **Hard EVM Invariant:** The contract enforces `require(totalSpent + amount <= spendLimit, "BUDGET_EXCEEDED")`. Overspend attempts are hard-reverted at the consensus layer. Zero ETH lost.
* **HTTP 402 Machine Payments:** Standardized machine-to-machine commerce with automated invoicing and SHA-256 proof of delivery.
* **Strict Idempotency:** The provider never charges twice for the same `paymentId`.

```
                       [ Human Owner ]
                              │ (Deploys & deposits ETH, sets spendLimit)
                              ▼
                       ┌───────────────┐
                       │ AgentVault.sol│ ◄────── Locked Vault Balance (e.g. 1.0 ETH)
                       └───────▲───────┘
                               │ 2. payService(paymentId, payTo, amountWei, contentHash)
                               │    [EVM Invariant: totalSpent + amount <= spendLimit]
                               │
┌──────────────────────────────┴──────────────────────────────┐
│  AI Autonomous Agent Runtime (/agent)                       │
│                                                             │
│  [User Prompt] ──► [LLM Brain (OpenAI / Gemini / Claude)]   │
│                             │                               │
│                      Decides to use                         │
│                    Paid External Tool                       │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              │ 1. POST /api/v1/service/compute (no auth)
                              ▼
                       ┌───────────────┐
                       │   Mock 402    │ ◄─── 402 Payment Required (invoice, amountWei)
                       │   Provider    │
                       │   (FastAPI)   │ ───► 3. POST /api/v1/service/compute
                       └───────────────┘         Headers: X-Payment-Id, X-Payment-TxHash
                                                 Returns: 200 OK + Payload + SHA-256
```

---

## 2. Current Status of the Repository

The foundation has already been tested, built, and committed:

| Layer | Directory | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | `/contracts` | Solidity `^0.8.20`, Hardhat | ✅ **14/14 unit tests passing** (100% coverage). Implements CEI pattern, low-level `.call` withdrawals, and canonical reverts. |
| **Contract Deployment** | `deployed_vault.json` | JSON ABI + Address | ✅ Exported contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (local Hardhat node). |
| **Mock 402 Provider** | `/provider` | Python FastAPI, Web3.py | ✅ **3/3 integration tests passing**. Issues 402 challenges, verifies on-chain receipts, and enforces idempotency cache. |
| **Frontend Dashboard** | `/frontend` | Next.js 14, Tailwind CSS, Viem | ✅ Running on `http://localhost:3000` with dark tactile UI, dual ETH/USD conversions, 5 interactive Command Bay tabs, and live attack simulations. |

---

## 3. What You (Dhruv) Need to Build in `/agent`

You will build the autonomous runtime that connects an AI LLM to our smart contract and the 402 provider:
1. **`vault_client.py`**: Web3.py wrapper that queries vault state and signs/broadcasts `AgentVault.payService()` transactions.
2. **`service_client.py`**: HTTP client that sends requests, catches `HTTP 402`, triggers on-chain payment, and submits the proof headers (`X-Payment-Id`, `X-Payment-TxHash`).
3. **`ai_agent.py`**: The AI agent core using LLM function calling (OpenAI, Gemini, Anthropic, or local model) that autonomously decides to execute compute tasks, verifies delivery hashes, and safely handles `BUDGET_EXCEEDED` reverts.
4. **`simulate_overspend.py`**: Attack script demonstrating that runaway agent prompts or infinite loops cannot drain the vault beyond the `spendLimit`.

---

## 4. The Exact Machine Payment Wire Specification

### Step 1: Initial Unauthenticated Request
The agent requests compute from the provider:
* **Method:** `POST http://127.0.0.1:8000/api/v1/service/compute`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "taskType": "matrix_multiplication",
  "workloadUnits": 50
}
```

### Step 2: HTTP 402 Payment Challenge
The provider responds with `HTTP 402 Payment Required`:
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
    "chainId": 31337,
    "serviceEndpoint": "/api/v1/service/compute",
    "expiresAt": 1773334800,
    "nonce": 42
  }
}
```

### Step 3: On-Chain Settlement via Smart Vault
The agent calls `AgentVault.payService()` using its authorized private key:
```solidity
AgentVault.payService(
    string calldata paymentId,       // "inv_98a7f4c2..."
    address payable provider,        // "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    uint256 amount,                  // 1000000000000000 (0.001 ETH)
    bytes32 contentHash              // bytes32(0) or sha256 commitment
)
```
* **EVM Checks:**
  1. `msg.sender == agent` (`"NOT_AUTHORIZED_AGENT"`)
  2. `totalSpent + amount <= spendLimit` (`"BUDGET_EXCEEDED"`)
  3. `address(this).balance >= amount` (`"INSUFFICIENT_VAULT_BALANCE"`)
* When successful, emits `ServicePaid(paymentId, provider, amount, contentHash)`.

### Step 4: Claim Deliverable with Payment Proof
The agent calls the provider again with the proof headers:
* **Method:** `POST http://127.0.0.1:8000/api/v1/service/compute`
* **Headers:**
  * `Content-Type: application/json`
  * `X-Payment-Id: inv_98a7f4c2-28e4-4a21-8f90-e123456789ab`
  * `X-Payment-TxHash: 0x4a5b6c7d8e9f...`
* **Response (HTTP 200 OK):**
```json
{
  "status": 200,
  "paymentId": "inv_98a7f4c2-28e4-4a21-8f90-e123456789ab",
  "delivered": true,
  "idempotencyHit": false,
  "result": {
    "taskType": "matrix_multiplication",
    "workloadUnits": 50,
    "matrixResultStream": [0.981, 0.441, 0.119, 0.762, 0.334],
    "executionNode": "node-us-east-402",
    "executionTimeMs": 14,
    "timestamp": 1773334812
  },
  "contentHash": "0xa6c9b7410de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
  "deliveredAt": 1773334812
}
```

### Step 5: Idempotent Retries (Zero Cost)
If the agent sends the request again with the same `X-Payment-Id`, the provider returns the cached response with `"idempotencyHit": true` without requiring another payment.

---

## 5. Ready-to-Use Implementation Code

### A. Dependencies (`agent/requirements.txt`)
```text
web3>=6.11.0
httpx>=0.25.0
pydantic>=2.0.0
python-dotenv>=1.0.0
openai>=1.0.0
```

---

### B. Smart Vault Web3 Client (`agent/vault_client.py`)
```python
import json
import os
from web3 import Web3

class VaultClient:
    def __init__(
        self,
        rpc_url: str = "http://127.0.0.1:8545",
        vault_address: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        # Default Hardhat Account #1 (Agent Signer address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 or Account #2)
        agent_private_key: str = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    ):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = self.w3.eth.account.from_key(agent_private_key)
        self.vault_address = Web3.to_checksum_address(vault_address)
        
        # Load contract ABI from deployed_vault.json
        abi_path = os.path.join(os.path.dirname(__file__), "..", "deployed_vault.json")
        with open(abi_path, "r") as f:
            data = json.load(f)
            self.abi = data["abi"]
            
        self.contract = self.w3.eth.contract(address=self.vault_address, abi=self.abi)

    def get_vault_status(self) -> dict:
        """Returns spend limit, total spent, and remaining allowance in Wei."""
        spend_limit = self.contract.functions.spendLimit().call()
        total_spent = self.contract.functions.totalSpent().call()
        balance = self.w3.eth.get_balance(self.vault_address)
        return {
            "spendLimitWei": spend_limit,
            "totalSpentWei": total_spent,
            "remainingAllowanceWei": max(0, spend_limit - total_spent),
            "vaultBalanceWei": balance
        }

    def pay_service(
        self,
        payment_id: str,
        provider_address: str,
        amount_wei: int,
        content_hash_bytes: bytes = b"\x00" * 32
    ) -> str:
        """
        Executes payService() on AgentVault.sol.
        Reverts with 'BUDGET_EXCEEDED' if totalSpent + amount > spendLimit.
        """
        provider_checksum = Web3.to_checksum_address(provider_address)
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        gas_price = self.w3.eth.gas_price

        tx = self.contract.functions.payService(
            payment_id,
            provider_checksum,
            amount_wei,
            content_hash_bytes
        ).build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gas": 250000,
            "gasPrice": gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt.status != 1:
            raise RuntimeError("Transaction execution failed on-chain.")
            
        return tx_hash.hex()
```

---

### C. HTTP 402 Payment Interceptor (`agent/service_client.py`)
```python
import httpx
from vault_client import VaultClient

class AutonomousPaymentHandler:
    def __init__(self, vault_client: VaultClient, provider_url: str = "http://127.0.0.1:8000"):
        self.vault = vault_client
        self.provider_url = provider_url

    def execute_paid_request(self, endpoint: str, payload: dict) -> dict:
        url = f"{self.provider_url}{endpoint}"
        
        # 1. Probe request without payment headers
        res = httpx.post(url, json=payload)
        
        # 2. Handle HTTP 402 Challenge
        if res.status_code == 402:
            data = res.json()
            invoice = data.get("invoice", {})
            payment_id = invoice["paymentId"]
            recipient = invoice["recipient"]
            amount_wei = int(invoice["amountWei"])
            
            print(f"💰 402 Payment Required received: {payment_id} | Cost: {amount_wei} Wei")
            
            # 3. Pay via Smart Contract Vault
            print("⛓️ Executing on-chain payment via AgentVault.sol...")
            tx_hash = self.vault.pay_service(payment_id, recipient, amount_wei)
            print(f"✅ On-chain Settlement confirmed! TxHash: {tx_hash}")
            
            # 4. Re-request resource with payment proofs
            headers = {
                "X-Payment-Id": payment_id,
                "X-Payment-TxHash": tx_hash
            }
            fulfilled_res = httpx.post(url, json=payload, headers=headers)
            fulfilled_res.raise_for_status()
            return fulfilled_res.json()
            
        elif res.status_code == 200:
            return res.json()
        else:
            res.raise_for_status()
```

---

### D. AI Agent LLM Hookup (`agent/ai_agent.py`)
```python
import json
from openai import OpenAI
from vault_client import VaultClient
from service_client import AutonomousPaymentHandler

vault = VaultClient()
payment_handler = AutonomousPaymentHandler(vault)

# Define tools available to the LLM
tools = [
    {
        "type": "function",
        "function": {
            "name": "run_cloud_compute",
            "description": "Executes intensive matrix math on external GPU cluster. Requires HTTP 402 payment settled via smart vault.",
            "parameters": {
                "type": "object",
                "properties": {
                    "taskType": {"type": "string", "default": "matrix_multiplication"},
                    "workloadUnits": {"type": "integer", "description": "Workload unit size (1-100)"}
                },
                "required": ["workloadUnits"]
            }
        }
    }
]

def run_agent(prompt: str):
    client = OpenAI()
    messages = [{"role": "user", "content": prompt}]
    
    print(f"\n👤 User Prompt: {prompt}")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools
    )
    
    msg = response.choices[0].message
    if msg.tool_calls:
        for tool_call in msg.tool_calls:
            if tool_call.function.name == "run_cloud_compute":
                args = json.loads(tool_call.function.arguments)
                print(f"🧠 AI Agent triggered tool 'run_cloud_compute': {args}")
                
                try:
                    result = payment_handler.execute_paid_request(
                        endpoint="/api/v1/service/compute",
                        payload=args
                    )
                    print(f"📦 Result Received: {result['result']}")
                    print(f"🔒 SHA-256 Content Hash: {result['contentHash']}")
                    
                    messages.append(msg)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result)
                    })
                    
                    final_res = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=messages
                    )
                    print(f"\n🤖 Final Answer:\n{final_res.choices[0].message.content}")
                    
                except Exception as e:
                    if "BUDGET_EXCEEDED" in str(e):
                        print("\n🛑 SECURITY INVARIANT ENFORCED: On-chain transaction reverted with BUDGET_EXCEEDED!")
                        print("🛡️ Overspend prevented. 0 ETH lost.")
                    else:
                        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_agent("Please calculate the optimal matrix transformation for 50 workload units using cloud compute.")
```

---

### E. Overspend Exploit Simulation (`agent/simulate_overspend.py`)
```python
from vault_client import VaultClient

def test_overspend():
    vault = VaultClient()
    status = vault.get_vault_status()
    print("--- Current Vault Status ---")
    print(f"Spend Limit: {status['spendLimitWei']} Wei")
    print(f"Total Spent: {status['totalSpentWei']} Wei")
    print(f"Remaining:   {status['remainingAllowanceWei']} Wei")
    
    # Attempt an intentional overspend (e.g. 10 ETH)
    overspend_amount = Web3.to_wei(10, "ether")
    print(f"\n⚔️ Simulating attack: Attempting payment of 10 ETH...")
    
    try:
        vault.pay_service(
            payment_id="exploit_attempt_001",
            provider_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            amount_wei=overspend_amount
        )
        print("❌ FATAL: Attack succeeded! (Vault bug)")
    except Exception as e:
        if "BUDGET_EXCEEDED" in str(e):
            print("✅ SUCCESS: EVM hard-reverted with 'BUDGET_EXCEEDED'!")
            print("🔒 Circuit breaker held. Zero funds were stolen.")
        else:
            print(f"Reverted with: {e}")

if __name__ == "__main__":
    test_overspend()
```

---

## 6. End-to-End Running Checklist

To run the complete system locally for the hackathon demo:

1. **Terminal 1 — Hardhat Node:**
   ```bash
   cd contracts
   npx hardhat node
   ```

2. **Terminal 2 — Deploy Contract:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Terminal 3 — Mock 402 Provider:**
   ```bash
   cd provider
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. **Terminal 4 — Frontend Dashboard:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Open http://localhost:3000 to see live vault metrics & transactions
   ```

5. **Terminal 5 — AI Agent Core:**
   ```bash
   cd agent
   pip install -r requirements.txt
   python ai_agent.py
   ```

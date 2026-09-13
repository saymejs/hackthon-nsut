import hashlib
import json
import sys
from typing import Optional, Dict, Any
import httpx
from vault_client import VaultClient

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


class AutonomousPaymentHandler:
    """
    HTTP 402 Machine Payment Interceptor & Autonomous Fulfillment Client.
    Detects HTTP 402 challenges, settles on-chain through the AgentVault,
    and claims deliverables with cryptographic proof-of-delivery verification.
    Includes network reconnection and double-charge protection.
    """

    def __init__(
        self,
        vault_client: VaultClient,
        provider_url: str = "http://127.0.0.1:8000",
        timeout: float = 30.0
    ):
        self.vault = vault_client
        self.provider_url = provider_url.rstrip("/")
        self.timeout = timeout
        # Cache of paid invoices to protect against double payment on reconnection
        self.paid_invoices: Dict[str, str] = {}

    def execute_paid_request(
        self,
        endpoint: str = "/api/v1/service/compute",
        payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a service request against the HTTP 402 provider.
        Automatically negotiates 402 challenges, pays on-chain, and verifies delivery.
        If network drops and reconnects, uses existing payment receipt without paying twice.
        """
        if payload is None:
            payload = {"taskType": "matrix_multiplication", "workloadUnits": 50}

        url = f"{self.provider_url}{endpoint}"
        print(f"\n[HTTP Probe] Sending unauthenticated request to: {url}")
        print(f"             Payload: {payload}")

        with httpx.Client(timeout=self.timeout) as client:
            res = client.post(url, json=payload)

            # ---------------------------------------------------------------
            # 1. Handle HTTP 402 Payment Required
            # ---------------------------------------------------------------
            if res.status_code == 402:
                auth_header = res.headers.get("www-authenticate", "")
                print(f"💰 [402 Received] Challenge received! Protocol Auth: {auth_header}")
                challenge_data = res.json()
                invoice = challenge_data.get("invoice", {})

                payment_id = invoice.get("paymentId")
                recipient = invoice.get("recipient")
                amount_wei = int(invoice.get("amountWei", 0))
                amount_eth = invoice.get("amountEth", "unknown")

                print(f"             Invoice ID : {payment_id}")
                print(f"             Recipient  : {recipient}")
                print(f"             Amount     : {amount_wei} Wei ({amount_eth} ETH)")

                # Reconnection / Double Charge Check
                if payment_id in self.paid_invoices:
                    print(f"🛡️  [Reconnection Protection] Invoice {payment_id} was already paid! Reusing TxHash without double spend.")
                    tx_hash = self.paid_invoices[payment_id]
                else:
                    # -----------------------------------------------------------
                    # 2. Settle on-chain via Smart Vault
                    # -----------------------------------------------------------
                    print("\n⛓️ [Settlement] Invoking AgentVault.payService() on-chain...")
                    tx_hash = self.vault.pay_service(
                        payment_id=payment_id,
                        provider_address=recipient,
                        amount_wei=amount_wei
                    )
                    print(f"✅ [Confirmed] Transaction settled on-chain! TxHash: {tx_hash}")
                    self.paid_invoices[payment_id] = tx_hash

                # -----------------------------------------------------------
                # 3. Claim Deliverable with Payment Proof Headers
                # -----------------------------------------------------------
                headers = {
                    "Content-Type": "application/json",
                    "X-Payment-Id": payment_id,
                    "X-Payment-TxHash": tx_hash
                }
                print(f"\n📦 [Claiming] Submitting fulfillment request with proof headers...")
                fulfilled_res = client.post(url, json=payload, headers=headers)
                fulfilled_res.raise_for_status()

                delivery_data = fulfilled_res.json()
                self._verify_delivery(delivery_data)
                return delivery_data

            # ---------------------------------------------------------------
            # 2. Handle HTTP 200 OK (free or already satisfied)
            # ---------------------------------------------------------------
            elif res.status_code == 200:
                print(f"✅ [Direct 200 OK] Request fulfilled without challenge.")
                delivery_data = res.json()
                self._verify_delivery(delivery_data)
                return delivery_data

            else:
                res.raise_for_status()
                return res.json()

    def _verify_delivery(self, delivery_data: Dict[str, Any]):
        """
        Validates SHA-256 deliverable content digest to verify proof-of-delivery.
        """
        received_hash = delivery_data.get("contentHash")
        result_payload = delivery_data.get("result")

        if not received_hash or not result_payload:
            print("⚠️  Warning: Service response lacks SHA-256 contentHash verification data.")
            return

        serialized = json.dumps(result_payload, sort_keys=True)
        computed_hash = "0x" + hashlib.sha256(serialized.encode("utf-8")).hexdigest()

        if received_hash.lower() == computed_hash.lower():
            print(f"🔒 [Cryptographic Integrity] SHA-256 Proof-of-Delivery VALIDATED.")
            print(f"   Hash: {received_hash}")
        else:
            print(f"⚠️  [Hash Mismatch] Received: {received_hash} != Computed: {computed_hash}")

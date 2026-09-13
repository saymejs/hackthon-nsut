import json
import hashlib
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=================================================");
    print("   Testing HTTP 402 Provider Server & Idempotency")
    print("=================================================");

    # -----------------------------------------------------------------------
    # Test 1: Unauthenticated Call Returns HTTP 402 + Invoice Challenge
    # -----------------------------------------------------------------------
    print("\n[Test 1] Sending unauthenticated POST request...")
    resp1 = client.post(
        "/api/v1/service/compute",
        json={"taskType": "matrix_multiplication", "workloadUnits": 50}
    )

    print(f"Status Code: {resp1.status_code}")
    assert resp1.status_code == 402, f"Expected 402, got {resp1.status_code}"

    # Verify WWW-Authenticate header
    auth_header = resp1.headers.get("www-authenticate")
    print(f"WWW-Authenticate Header: {auth_header}")
    assert auth_header is not None and "x402" in auth_header, "Missing or invalid WWW-Authenticate header"

    # Verify payload format
    payload1 = resp1.json()
    assert payload1.get("status") == 402
    assert "invoice" in payload1
    invoice = payload1["invoice"]
    payment_id = invoice["paymentId"]
    recipient = invoice["recipient"]
    amount_wei = invoice["amountWei"]

    print(f"Received Payment Challenge:")
    print(f"  - Payment ID : {payment_id}")
    print(f"  - Recipient  : {recipient}")
    print(f"  - Amount Wei : {amount_wei}")
    print(">>> PASS: Unauthenticated call correctly triggered HTTP 402 challenge.")

    # -----------------------------------------------------------------------
    # Test 2: Paid Call with TxProof Returns HTTP 200 + Content Hash
    # -----------------------------------------------------------------------
    print("\n[Test 2] Submitting paid fulfillment request with payment proof...")
    mock_tx_hash = f"0xmock_{hashlib.sha256(payment_id.encode()).hexdigest()}"

    resp2 = client.post(
        "/api/v1/service/compute",
        json={"taskType": "matrix_multiplication", "workloadUnits": 50},
        headers={
            "X-Payment-Id": payment_id,
            "X-Payment-TxHash": mock_tx_hash
        }
    )

    print(f"Status Code: {resp2.status_code}")
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"

    payload2 = resp2.json()
    assert payload2.get("delivered") is True
    assert payload2.get("idempotencyHit") is False
    assert "contentHash" in payload2
    assert payload2["contentHash"].startswith("0x")
    content_hash_1 = payload2["contentHash"]

    print(f"Delivery Confirmed:")
    print(f"  - Delivered       : {payload2['delivered']}")
    print(f"  - Idempotency Hit : {payload2['idempotencyHit']}")
    print(f"  - Content Hash    : {content_hash_1}")
    print(">>> PASS: Paid request verified and resource delivered with SHA-256 digest.")

    # -----------------------------------------------------------------------
    # Test 3: Idempotent Replay Returns Cached Output (Zero Cost)
    # -----------------------------------------------------------------------
    print("\n[Test 3] Replaying identical request with same Payment ID...")
    resp3 = client.post(
        "/api/v1/service/compute",
        json={"taskType": "matrix_multiplication", "workloadUnits": 50},
        headers={
            "X-Payment-Id": payment_id,
            "X-Payment-TxHash": mock_tx_hash
        }
    )

    print(f"Status Code: {resp3.status_code}")
    assert resp3.status_code == 200, f"Expected 200, got {resp3.status_code}"

    payload3 = resp3.json()
    assert payload3.get("delivered") is True
    assert payload3.get("idempotencyHit") is True, "Expected idempotencyHit to be True on replay!"
    assert payload3["contentHash"] == content_hash_1, "Content hash must match original delivery"
    assert payload3["result"] == payload2["result"], "Result payload must be identical from cache"

    print(f"Idempotent Delivery Confirmed:")
    print(f"  - Idempotency Hit : {payload3['idempotencyHit']} (Zero cost replay)")
    print(f"  - Hash Matches    : {payload3['contentHash'] == content_hash_1}")
    print(">>> PASS: Idempotency enforced. Provider returned cached output without charging.")

    print("\n=================================================");
    print("   ALL 3 PROVIDER TESTS PASSED SUCCESSFULLY!     ");
    print("=================================================");

if __name__ == "__main__":
    run_tests()

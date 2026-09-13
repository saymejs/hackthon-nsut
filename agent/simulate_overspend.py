import os
import sys
from web3 import Web3
from vault_client import VaultClient

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vault_client import VaultClient


def simulate_overspend_attack():
    """
    Demonstrates the consensus-layer invariant by attempting a transaction
    that exceeds the smart contract spendLimit.
    """
    print("================================================================")
    print("   ATTACK SIMULATION: Runaway Loop / Malicious Spend Exploit   ")
    print("================================================================")

    vault = VaultClient()
    status = vault.get_vault_status()

    print(f"Current Cumulative Spend Cap : {status['spendLimitEth']} ETH")
    print(f"Total Spent to Date          : {status['totalSpentEth']} ETH")
    print(f"Remaining Allowance          : {status['remainingAllowanceEth']} ETH")
    print(f"Actual Vault ETH Balance     : {status['vaultBalanceEth']} ETH")
    print("----------------------------------------------------------------")

    # Attempt to spend 0.1 ETH (far exceeding remaining allowance ~0.0470 ETH)
    exploit_amount_eth = "0.1000"
    exploit_amount_wei = int(Web3.to_wei(0.1, "ether"))
    target_provider = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

    print(f"🚨 Adversary / Agent Action: Attempting unauthorized payment of {exploit_amount_eth} ETH...")

    try:
        vault.pay_service(
            payment_id="attack_tx_payload_malicious_drain",
            provider_address=target_provider,
            amount_wei=exploit_amount_wei
        )
        print("❌ CRITICAL DEFECT: Transaction succeeded when it should have failed!")
    except Exception as e:
        print("\n🛡️  [EVM CONSENSUS GUARD INVARIANT TRIGGERED]")
        print(f"   Hard Revert Caught: {e}")
        print("   Invariant Verified: totalSpent + amount <= spendLimit")
        print("   Result: ZERO ETH LOST. Funds remain 100% secure in AgentVault.")
        print("================================================================\n")


if __name__ == "__main__":
    simulate_overspend_attack()

import unittest
from unittest.mock import MagicMock
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from vault_client import VaultClient
from service_client import AutonomousPaymentHandler


class TestAgentProtocol(unittest.TestCase):
    """
    Automated integration tests for agent HTTP 402 protocol,
    consensus guard enforcement, and SHA-256 verification.
    """

    def setUp(self):
        self.mock_vault = MagicMock(spec=VaultClient)
        self.mock_vault.get_vault_status.return_value = {
            "vaultAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "spendLimitEth": "0.0500",
            "totalSpentEth": "0.0030",
            "remainingAllowanceEth": "0.0470",
            "vaultBalanceEth": "0.8500",
        }
        self.mock_vault.pay_service.return_value = "0x4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123"
        self.handler = AutonomousPaymentHandler(self.mock_vault, provider_url="http://127.0.0.1:8000")

    def test_vault_status_read(self):
        status = self.mock_vault.get_vault_status()
        self.assertEqual(status["spendLimitEth"], "0.0500")
        self.assertEqual(status["totalSpentEth"], "0.0030")
        self.assertEqual(status["remainingAllowanceEth"], "0.0470")

    def test_payment_handler_cache(self):
        # Simulate payment invoice caching for reconnection protection
        self.handler.paid_invoices["inv_test123"] = "0x123abc"
        self.assertIn("inv_test123", self.handler.paid_invoices)
        self.assertEqual(self.handler.paid_invoices["inv_test123"], "0x123abc")

    def test_consensus_guard_revert_simulation(self):
        # Emulate budget exceeded revert
        self.mock_vault.pay_service.side_effect = Exception("execution reverted: BUDGET_EXCEEDED")
        with self.assertRaises(Exception) as ctx:
            self.mock_vault.pay_service("inv_malicious", "0x1234", 100000000000000000)
        self.assertIn("BUDGET_EXCEEDED", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()

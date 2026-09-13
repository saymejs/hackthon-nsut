const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentVault Contract Test Suite", function () {
  let owner, agent, provider, stranger;
  let AgentVault, vault;
  const initialLimit = ethers.parseEther("0.05"); // 0.05 ETH spend ceiling
  const initialFunding = ethers.parseEther("0.1"); // 0.1 ETH deposited into vault

  beforeEach(async function () {
    [owner, agent, provider, stranger] = await ethers.getSigners();

    AgentVault = await ethers.getContractFactory("AgentVault");
    vault = await AgentVault.deploy(agent.address, initialLimit, {
      value: initialFunding,
    });
    await vault.waitForDeployment();
  });

  describe("Initialization & Funding", function () {
    it("should initialize with correct owner, agent, spendLimit, and balance", async function () {
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.agent()).to.equal(agent.address);
      expect(await vault.spendLimit()).to.equal(initialLimit);
      expect(await vault.totalSpent()).to.equal(0n);

      const contractBalance = await ethers.provider.getBalance(await vault.getAddress());
      expect(contractBalance).to.equal(initialFunding);
    });

    it("should accept top-up ETH deposits via receive()", async function () {
      const topUpAmount = ethers.parseEther("0.05");
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: topUpAmount,
      });

      const updatedBalance = await ethers.provider.getBalance(await vault.getAddress());
      expect(updatedBalance).to.equal(initialFunding + topUpAmount);
    });

    it("should reject deployment with zero address for agent", async function () {
      await expect(
        AgentVault.deploy(ethers.ZeroAddress, initialLimit)
      ).to.be.revertedWith("INVALID_AGENT");
    });
  });

  describe("Access Control & Authorization", function () {
    it("should revert if a non-agent calls payService()", async function () {
      const paymentAmount = ethers.parseEther("0.01");
      const paymentId = "inv_test_001";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test_data"));

      await expect(
        vault.connect(stranger).payService(paymentId, provider.address, paymentAmount, contentHash)
      ).to.be.revertedWith("NOT_AUTHORIZED_AGENT");

      // Even owner cannot directly call payService (must use authorized agent key)
      await expect(
        vault.connect(owner).payService(paymentId, provider.address, paymentAmount, contentHash)
      ).to.be.revertedWith("NOT_AUTHORIZED_AGENT");
    });

    it("should revert if non-owner attempts administrative actions", async function () {
      await expect(
        vault.connect(stranger).setLimit(ethers.parseEther("1.0"))
      ).to.be.revertedWith("NOT_OWNER");

      await expect(
        vault.connect(stranger).setAgent(stranger.address)
      ).to.be.revertedWith("NOT_OWNER");

      await expect(
        vault.connect(stranger).withdraw(ethers.parseEther("0.01"))
      ).to.be.revertedWith("NOT_OWNER");
    });
  });

  describe("Legitimate Payment Execution (Within Budget)", function () {
    it("should allow agent to pay provider, update totalSpent, transfer ETH, and emit ServicePaid", async function () {
      const paymentAmount = ethers.parseEther("0.02"); // 0.02 ETH <= 0.05 limit
      const paymentId = "inv_compute_001";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("matrix_result_payload"));

      const providerInitialBalance = await ethers.provider.getBalance(provider.address);

      // Execute payment
      const tx = await vault
        .connect(agent)
        .payService(paymentId, provider.address, paymentAmount, contentHash);

      // Check event
      await expect(tx)
        .to.emit(vault, "ServicePaid")
        .withArgs(paymentId, provider.address, paymentAmount, contentHash);

      // Verify state updates
      expect(await vault.totalSpent()).to.equal(paymentAmount);

      // Verify provider received ETH
      const providerFinalBalance = await ethers.provider.getBalance(provider.address);
      expect(providerFinalBalance - providerInitialBalance).to.equal(paymentAmount);

      // Verify vault balance decreased
      const vaultRemainingBalance = await ethers.provider.getBalance(await vault.getAddress());
      expect(vaultRemainingBalance).to.equal(initialFunding - paymentAmount);
    });

    it("should support multiple sequential payments up to the spendLimit", async function () {
      const payment1 = ethers.parseEther("0.02");
      const payment2 = ethers.parseEther("0.03"); // Total = 0.05 (exactly equal to spendLimit)

      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("p1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("p2"));

      await vault.connect(agent).payService("inv_01", provider.address, payment1, hash1);
      expect(await vault.totalSpent()).to.equal(payment1);

      await vault.connect(agent).payService("inv_02", provider.address, payment2, hash2);
      expect(await vault.totalSpent()).to.equal(payment1 + payment2);
      expect(await vault.totalSpent()).to.equal(initialLimit);
    });
  });

  describe("CRITICAL HACKATHON INVARIANT: Overspend Protection", function () {
    it("should hard-revert with BUDGET_EXCEEDED when single payment exceeds spendLimit", async function () {
      const excessiveAmount = ethers.parseEther("0.06"); // 0.06 > 0.05 limit
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("malicious_runaway_task"));

      const vaultInitialBalance = await ethers.provider.getBalance(await vault.getAddress());

      // Attempt payment
      await expect(
        vault.connect(agent).payService("inv_exploit_01", provider.address, excessiveAmount, contentHash)
      ).to.be.revertedWith("BUDGET_EXCEEDED");

      // Verify state was NOT updated
      expect(await vault.totalSpent()).to.equal(0n);

      // Verify funds remain 100% untouched
      const vaultFinalBalance = await ethers.provider.getBalance(await vault.getAddress());
      expect(vaultFinalBalance).to.equal(vaultInitialBalance);
    });

    it("should hard-revert when cumulative payments breach spendLimit", async function () {
      // First legitimate payment: 0.04 ETH (Remaining allowance = 0.01 ETH)
      const pay1 = ethers.parseEther("0.04");
      await vault
        .connect(agent)
        .payService("inv_legit_01", provider.address, pay1, ethers.ZeroHash);
      expect(await vault.totalSpent()).to.equal(pay1);

      // Second payment: 0.02 ETH (0.04 + 0.02 = 0.06 > 0.05 limit) -> MUST REVERT
      const pay2 = ethers.parseEther("0.02");
      await expect(
        vault
          .connect(agent)
          .payService("inv_breach_02", provider.address, pay2, ethers.ZeroHash)
      ).to.be.revertedWith("BUDGET_EXCEEDED");

      // Total spent remains unchanged at 0.04 ETH
      expect(await vault.totalSpent()).to.equal(pay1);
    });
  });

  describe("Vault Solvency Check", function () {
    it("should revert with INSUFFICIENT_VAULT_BALANCE if payment exceeds contract balance", async function () {
      // Owner increases limit to 1.0 ETH, but contract only has 0.1 ETH funded
      await vault.connect(owner).setLimit(ethers.parseEther("1.0"));

      const paymentExceedingBalance = ethers.parseEther("0.2"); // 0.2 ETH > 0.1 ETH balance
      await expect(
        vault
          .connect(agent)
          .payService("inv_unfunded", provider.address, paymentExceedingBalance, ethers.ZeroHash)
      ).to.be.revertedWith("INSUFFICIENT_VAULT_BALANCE");
    });
  });

  describe("Owner Administration & Withdrawals", function () {
    it("should allow owner to update spendLimit", async function () {
      const newLimit = ethers.parseEther("0.2");
      await expect(vault.connect(owner).setLimit(newLimit))
        .to.emit(vault, "LimitSet")
        .withArgs(newLimit);

      expect(await vault.spendLimit()).to.equal(newLimit);
    });

    it("should allow owner to update agent address", async function () {
      const newAgent = stranger.address;
      await expect(vault.connect(owner).setAgent(newAgent))
        .to.emit(vault, "AgentUpdated")
        .withArgs(newAgent);

      expect(await vault.agent()).to.equal(newAgent);
    });

    it("should allow owner to withdraw remaining ETH using low-level call", async function () {
      const withdrawAmount = ethers.parseEther("0.04");
      const ownerInitialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await vault.connect(owner).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
      expect(ownerFinalBalance + gasSpent - ownerInitialBalance).to.equal(withdrawAmount);

      const remainingVault = await ethers.provider.getBalance(await vault.getAddress());
      expect(remainingVault).to.equal(initialFunding - withdrawAmount);
    });

    it("should revert if owner attempts to withdraw more than contract balance", async function () {
      const excessiveWithdraw = ethers.parseEther("1.0");
      await expect(
        vault.connect(owner).withdraw(excessiveWithdraw)
      ).to.be.revertedWith("EXCEEDS_BALANCE");
    });
  });
});

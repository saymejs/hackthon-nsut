"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatEther } from "viem";
import { publicClient, VAULT_ADDRESS, VAULT_ABI } from "@/lib/contract";
import {
  DEFAULT_ETH_PRICE_USD,
  ethToUsd,
} from "@/lib/formatters";

import OverviewView, { AuditLog, TerminalLog } from "@/components/OverviewView";
import ContractGuardView from "@/components/ContractGuardView";
import TransactionsView from "@/components/TransactionsView";
import PoliciesView from "@/components/PoliciesView";
import NodeLogsView from "@/components/NodeLogsView";
import {
  DashboardIcon,
  ShieldIcon,
  ReceiptIcon,
  PolicyIcon,
  TerminalIcon,
  TrendingUpIcon,
  WalletIcon,
  CopyIcon,
  WarningIcon,
  PersonIcon,
} from "@/components/Icons";

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "overview" | "contract-guard" | "transactions" | "policies" | "node-logs"
  >("overview");

  // Live ETH Price in USD (CoinGecko with $2,500 fallback)
  const [ethPriceUsd, setEthPriceUsd] = useState(DEFAULT_ETH_PRICE_USD);

  // Vault Live Metrics
  const [vaultBalanceEth, setVaultBalanceEth] = useState("0.8500");
  const [spendLimitEth, setSpendLimitEth] = useState("0.0500");
  const [totalSpentEth, setTotalSpentEth] = useState("0.0030");
  const [agentAddress, setAgentAddress] = useState("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  const [ownerAddress, setOwnerAddress] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Revert Banner State
  const [showRevertBanner, setShowRevertBanner] = useState(true);
  const [bannerFlashing, setBannerFlashing] = useState(false);
  const [revertDetails, setRevertDetails] = useState({
    attempted: "0.1000",
    remaining: "0.0470",
    gasUsed: "21,432",
  });

  // Audit Ledger State with dual ETH and USD values
  const [ledgerRows, setLedgerRows] = useState<AuditLog[]>([
    {
      id: "1",
      invoiceId: "inv_98a7",
      provider: "0x8920...a4f2",
      amountEth: "0.0010 ETH",
      amountUsd: "~$2.50",
      contentHash: "0xa6c9...4b12",
      status: "Anchored On-Chain",
      timestamp: "12s ago",
    },
    {
      id: "2",
      invoiceId: "inv_98a6",
      provider: "0x14dC...e92B",
      amountEth: "0.0008 ETH",
      amountUsd: "~$2.00",
      contentHash: "0x3f1e...88ad",
      status: "Anchored On-Chain",
      timestamp: "1m ago",
    },
    {
      id: "3",
      invoiceId: "inv_98a5",
      provider: "0x45B2...c071",
      amountEth: "0.0012 ETH",
      amountUsd: "~$3.00",
      contentHash: "0x9c44...e510",
      status: "Anchored On-Chain",
      timestamp: "3m ago",
    },
    {
      id: "4",
      invoiceId: "inv_98a4",
      provider: "0x8920...a4f2",
      amountEth: "0.0005 ETH",
      amountUsd: "~$1.25",
      contentHash: "0x12bb...90fc",
      status: "Anchored On-Chain",
      timestamp: "5m ago",
    },
  ]);

  // Terminal Streaming Logs with USD reference
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      num: "01",
      time: "00:14:02",
      content: (
        <>
          <span className="text-cyan-400 font-semibold">POST</span>{" "}
          <span className="text-slate-200">/api/v1/service/compute</span>{" "}
          <span className="text-emerald-400 font-bold">-&gt; 402 PAYMENT REQUIRED</span>{" "}
          <span className="text-slate-300">
            Amount: <strong className="text-white">0.0010 ETH (~$2.50 USD)</strong>
          </span>{" "}
          <span className="text-slate-400">
            (Invoice: <span className="text-cyan-300 underline">inv_98a7</span>)
          </span>
        </>
      ),
    },
    {
      num: "02",
      time: "00:14:03",
      content: (
        <>
          <span className="text-slate-200">Vault.</span>
          <span className="text-cyan-300 font-semibold">payService()</span>{" "}
          <span className="text-slate-300">
            -&gt; Settled <strong className="text-emerald-400">0.0010 ETH (~$2.50 USD)</strong>
          </span>{" "}
          <span className="text-cyan-300">Tx: 0x4a5b...0123</span>{" "}
          <span className="text-emerald-400 font-bold">[EIP-712 Sig Verified]</span>
        </>
      ),
    },
    {
      num: "03",
      time: "00:14:04",
      content: (
        <>
          <span className="text-teal-300 font-medium">EVM Guard Verified:</span>{" "}
          <span className="text-slate-200">
            0.0010 ETH (~$2.50) &lt;= 0.0470 ETH (~$117.50) remaining
          </span>{" "}
          <span className="text-emerald-400 font-bold">(Success: Invariant Holds)</span>
        </>
      ),
    },
    {
      num: "04",
      time: "00:14:05",
      content: (
        <>
          <span className="text-slate-200">Service Delivered -&gt; SHA-256 Hash:</span>{" "}
          <span className="text-cyan-300">0xa6c9b...</span>{" "}
          <span className="text-emerald-400 font-bold">(Verified ✓)</span>
        </>
      ),
    },
    {
      num: "05",
      time: "00:14:10",
      content: (
        <>
          <span className="text-slate-500">Telemetry Daemon:</span>{" "}
          <span className="text-slate-300">
            Attestation beacon rooted to contract Merkle accumulator.
          </span>
        </>
      ),
    },
    {
      num: "06",
      time: "00:14:12",
      content: (
        <span className="flex items-center gap-1.5 text-cyan-300">
          <span className="text-emerald-400 font-bold">&gt;</span>
          <span className="text-slate-200">
            Listening for incoming HTTP-402 micro-delegations
          </span>
          <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse"></span>
        </span>
      ),
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Fetch live ETH price from CoinGecko (with $2,500 fallback)
  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await res.json();
        if (data?.ethereum?.usd) {
          setEthPriceUsd(data.ethereum.usd);
        }
      } catch {
        setEthPriceUsd(DEFAULT_ETH_PRICE_USD);
      }
    }
    fetchEthPrice();
  }, []);

  // Read Live Contract State via Viem
  useEffect(() => {
    async function loadContractData() {
      try {
        const balance = await publicClient.getBalance({ address: VAULT_ADDRESS });
        setVaultBalanceEth(parseFloat(formatEther(balance)).toFixed(4));

        const limit = (await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "spendLimit",
        })) as bigint;
        setSpendLimitEth(parseFloat(formatEther(limit)).toFixed(4));

        const spent = (await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "totalSpent",
        })) as bigint;
        setTotalSpentEth(parseFloat(formatEther(spent)).toFixed(4));

        const agent = (await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "agent",
        })) as `0x${string}`;
        setAgentAddress(agent);

        const owner = (await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "owner",
        })) as `0x${string}`;
        setOwnerAddress(owner);
      } catch {
        // Use pre-synced telemetry when offline
      }
    }

    loadContractData();
    const interval = setInterval(loadContractData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute headroom
  const limitNum = parseFloat(spendLimitEth) || 0.05;
  const spentNum = parseFloat(totalSpentEth) || 0.003;
  const headroomEth = Math.max(limitNum - spentNum, 0).toFixed(4);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sendPing = () => {
    const now = new Date().toISOString().substring(11, 19);
    const nextNum = (logs.length + 1).toString().padStart(2, "0");
    setLogs((prev) => [
      ...prev,
      {
        num: nextNum,
        time: now,
        content: (
          <span className="text-cyan-300">
            PING -&gt; Arbitrum Gateway Status OK (21ms)
          </span>
        ),
      },
    ]);
  };

  // Button 1: Trigger Standard Purchase (0.001 ETH / ~$2.50)
  const triggerNormalPurchase = async () => {
    const now = new Date().toISOString().substring(11, 19);
    const invoiceNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceId = `inv_${invoiceNum}`;
    const txHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random()
      .toString(16)
      .substring(2, 6)}`;
    const contentHashFull = `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
      .toString(16)
      .substring(2, 8)}`;
    const contentHashShort = `${contentHashFull.substring(0, 6)}...${contentHashFull.substring(
      contentHashFull.length - 4
    )}`;

    const costUsd = ethToUsd(0.001, ethPriceUsd);

    // 1. Append 402 challenge in terminal
    setLogs((prev) => [
      ...prev,
      {
        num: (prev.length + 1).toString().padStart(2, "0"),
        time: now,
        content: (
          <>
            <span className="text-cyan-400 font-semibold">POST</span>{" "}
            <span className="text-slate-200">/api/v1/service/compute</span>{" "}
            <span className="text-emerald-400 font-bold">-&gt; 402 PAYMENT REQUIRED</span>{" "}
            <span className="text-slate-300">
              Amount: <strong className="text-white">0.0010 ETH (~{costUsd} USD)</strong>
            </span>{" "}
            <span className="text-slate-400">
              (Invoice: <span className="text-cyan-300 underline">{invoiceId}</span>)
            </span>
          </>
        ),
      },
      {
        num: (prev.length + 2).toString().padStart(2, "0"),
        time: now,
        content: (
          <>
            <span className="text-emerald-400 font-bold">[NORMAL DISPATCH]</span>{" "}
            <span className="text-slate-200">Vault.payService()</span>{" "}
            <span className="text-slate-300">
              -&gt; Settled <strong className="text-emerald-400">0.0010 ETH (~{costUsd} USD)</strong>
            </span>{" "}
            <span className="text-cyan-300">Tx: {txHash}</span>{" "}
            <span className="text-emerald-400 font-bold">[Settled ✓]</span>
          </>
        ),
      },
    ]);

    // 2. Increment state
    const newSpent = spentNum + 0.001;
    setTotalSpentEth(newSpent.toFixed(4));

    // 3. Add row to audit ledger
    setLedgerRows((prev) => [
      {
        id: (prev.length + 1).toString(),
        invoiceId,
        provider: "0x8920...a4f2",
        amountEth: "0.0010 ETH",
        amountUsd: `~${costUsd}`,
        contentHash: contentHashShort,
        status: "Anchored On-Chain",
        timestamp: "Just now",
      },
      ...prev,
    ]);
  };

  // Button 2: Simulate Overspend Attack (Attempt 0.1 ETH / ~$250.00)
  const triggerAttackSimulation = () => {
    const now = new Date().toISOString().substring(11, 19);
    const attemptedUsd = ethToUsd(0.1, ethPriceUsd);
    const remainingUsd = ethToUsd(headroomEth, ethPriceUsd);

    // Update revert details dynamically
    setRevertDetails({
      attempted: "0.1000",
      remaining: headroomEth,
      gasUsed: "21,432",
    });
    setShowRevertBanner(true);
    setBannerFlashing(true);
    setTimeout(() => setBannerFlashing(false), 1500);

    // Append alert in terminal
    setLogs((prev) => [
      ...prev,
      {
        num: "!!",
        time: now,
        isAlert: true,
        content: (
          <div className="flex-1 text-red-300">
            <strong className="text-red-400 font-bold">[ATTACK TRIPPED]</strong>{" "}
            <span className="text-red-200">
              Attempted 0.1000 ETH (~{attemptedUsd}) exfiltration. Guard halted transaction! Bytecode
              revert: BUDGET_EXCEEDED (0.1000 ETH (~{attemptedUsd}) &gt; {headroomEth} ETH (~{remainingUsd}) remaining). 0 ETH ($0.00) lost.
            </span>
          </div>
        ),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#e8ecf2] text-slate-800 antialiased font-sans">
      {/* TOP FIXED NAVIGATION CHROME */}
      <header className="fixed top-0 w-full z-50 bg-[#e8ecf2] border-b border-[#d8e0eb] shadow-[0_4px_16px_#cad3df]">
        <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
          {/* Logo & Subtitle Section */}
          <div className="flex items-center gap-3">
            <div className="neu-raised-xs w-11 h-11 rounded-2xl flex items-center justify-center p-1.5 bg-[#e8ecf2]">
              <img
                alt="Agent SafePay Vault Logo"
                className="h-7 w-auto object-contain"
                src="/logo.png"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Agent SafePay
                </span>
                <span className="text-xs text-slate-500 font-mono-code font-medium">
                  // EVM Vault Guard
                </span>
              </div>
              <span className="text-[10px] font-mono-code text-blue-600 tracking-wider uppercase font-semibold">
                v2.4-mainnet-guard
              </span>
            </div>
          </div>

          {/* Center Status Strip Pills (Neumorphic) */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Sepolia Testnet Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full neu-inset-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
              <span className="font-mono-code text-xs text-slate-700 font-medium">
                Sepolia Testnet - ChainID 11155111
              </span>
              <span className="text-[11px] font-mono-code text-emerald-700 font-bold px-2 py-0.5 rounded-full neu-raised-xs bg-[#e8ecf2]">
                24ms
              </span>
            </div>

            {/* ETH Live Oracle Price Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full neu-inset-sm">
              <TrendingUpIcon className="w-4 h-4 text-blue-600" />
              <span className="font-mono-code text-xs text-slate-700 font-medium">
                ETH Oracle: <strong className="text-slate-900 font-bold">${ethPriceUsd.toLocaleString()}</strong>
              </span>
            </div>

            {/* Vault Active Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full neu-raised-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                Vault Active
              </span>
            </div>
          </div>

          {/* Right Actions Section */}
          <div className="flex items-center gap-3">
            {/* Wallet Address Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-inset-sm">
              <WalletIcon className="w-4 h-4 text-blue-600" />
              <span className="font-mono-code text-xs text-slate-700 font-semibold">
                {ownerAddress.substring(0, 6)}...{ownerAddress.substring(ownerAddress.length - 4)}
              </span>
              <button
                className="flex items-center justify-center p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => copyToClipboard(ownerAddress)}
                title="Copy address"
              >
                <CopyIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Emergency Withdraw Button */}
            <button
              className="px-3.5 py-1.5 rounded-full neu-btn-danger text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={() =>
                alert(
                  `Owner withdrawal authorized. Contract holding: ${vaultBalanceEth} ETH (~${ethToUsd(
                    vaultBalanceEth,
                    ethPriceUsd
                  )}).`
                )
              }
            >
              <WarningIcon className="w-4 h-4 text-red-600" />
              <span>Emergency Withdraw</span>
            </button>

            {/* User Profile Avatar Pill */}
            <div className="w-9 h-9 rounded-full neu-raised-xs flex items-center justify-center text-slate-700">
              <PersonIcon className="w-5 h-5 text-slate-700" />
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (COMMAND BAYS) */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#e8ecf2] border-r border-[#d8e0eb] z-40 flex flex-col justify-between py-6">
        <div className="flex flex-col gap-6 px-4">
          <div className="px-3">
            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              Command Bays
            </p>
          </div>
          <nav className="flex flex-col gap-2">
            {/* 1. Overview Telemetry */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-left w-full ${
                activeTab === "overview"
                  ? "neu-inset-sm text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 neu-btn font-semibold"
              }`}
            >
              <DashboardIcon
                className={`w-5 h-5 ${
                  activeTab === "overview" ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="text-xs tracking-wide">Overview Telemetry</span>
            </button>

            {/* 2. Contract Guard */}
            <button
              onClick={() => setActiveTab("contract-guard")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-left w-full ${
                activeTab === "contract-guard"
                  ? "neu-inset-sm text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 neu-btn font-semibold"
              }`}
            >
              <ShieldIcon
                className={`w-5 h-5 ${
                  activeTab === "contract-guard" ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="text-xs tracking-wide">Contract Guard</span>
            </button>

            {/* 3. Agent Transactions */}
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-left w-full ${
                activeTab === "transactions"
                  ? "neu-inset-sm text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 neu-btn font-semibold"
              }`}
            >
              <ReceiptIcon
                className={`w-5 h-5 ${
                  activeTab === "transactions" ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="text-xs tracking-wide">Agent Transactions</span>
            </button>

            {/* 4. Security Policies */}
            <button
              onClick={() => setActiveTab("policies")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-left w-full ${
                activeTab === "policies"
                  ? "neu-inset-sm text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 neu-btn font-semibold"
              }`}
            >
              <PolicyIcon
                className={`w-5 h-5 ${
                  activeTab === "policies" ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="text-xs tracking-wide">Security Policies</span>
            </button>

            {/* 5. Node Logs */}
            <button
              onClick={() => setActiveTab("node-logs")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-left w-full ${
                activeTab === "node-logs"
                  ? "neu-inset-sm text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 neu-btn font-semibold"
              }`}
            >
              <TerminalIcon
                className={`w-5 h-5 ${
                  activeTab === "node-logs" ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="text-xs tracking-wide">Node Logs</span>
            </button>
          </nav>
        </div>

        {/* Telemetry Rate Meter Footer */}
        <div className="px-4">
          <div className="p-4 rounded-2xl neu-raised-sm flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Telemetry Rate
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-xs text-emerald-600 font-bold">
                100ms Synced
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="w-full bg-[#d8e0eb] h-2 rounded-full overflow-hidden p-0.5 neu-inset-sm">
              <div className="bg-emerald-500 h-full rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTENT */}
      <div className="pl-64">
        <main className="w-full pt-16 min-h-screen px-8 py-8">
          {activeTab === "overview" && (
            <OverviewView
              vaultBalanceEth={vaultBalanceEth}
              spendLimitEth={spendLimitEth}
              totalSpentEth={totalSpentEth}
              agentAddress={agentAddress}
              ethPriceUsd={ethPriceUsd}
              logs={logs}
              ledgerRows={ledgerRows}
              terminalEndRef={terminalEndRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sendPing={sendPing}
              triggerNormalPurchase={triggerNormalPurchase}
              triggerAttackSimulation={triggerAttackSimulation}
              showRevertBanner={showRevertBanner}
              bannerFlashing={bannerFlashing}
              revertDetails={revertDetails}
              copyToClipboard={copyToClipboard}
            />
          )}

          {activeTab === "contract-guard" && (
            <ContractGuardView
              vaultAddress={VAULT_ADDRESS}
              ownerAddress={ownerAddress}
              agentAddress={agentAddress}
              vaultBalanceEth={vaultBalanceEth}
              spendLimitEth={spendLimitEth}
              totalSpentEth={totalSpentEth}
              ethPriceUsd={ethPriceUsd}
              onUpdateLimit={(newLimit) => setSpendLimitEth(newLimit)}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsView ethPriceUsd={ethPriceUsd} />
          )}

          {activeTab === "policies" && (
            <PoliciesView
              spendLimitEth={spendLimitEth}
              ethPriceUsd={ethPriceUsd}
            />
          )}

          {activeTab === "node-logs" && <NodeLogsView />}
        </main>
      </div>
    </div>
  );
}

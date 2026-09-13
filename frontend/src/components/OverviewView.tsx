"use client";

import React, { RefObject } from "react";
import { ethToUsd } from "@/lib/formatters";
import {
  BankIcon,
  SpeedIcon,
  CheckCircleIcon,
  KeyIcon,
  LockIcon,
  CopyIcon,
  SearchIcon,
  FlaskIcon,
  PlayIcon,
  AlertTriangleIcon,
  WarningIcon,
  BoltIcon,
} from "@/components/Icons";

export interface AuditLog {
  id: string;
  invoiceId: string;
  provider: string;
  amountEth: string;
  amountUsd: string;
  contentHash: string;
  status: string;
  timestamp: string;
}

export interface TerminalLog {
  num: string;
  time: string;
  content: React.ReactNode;
  isAlert?: boolean;
}

interface OverviewViewProps {
  vaultBalanceEth: string;
  spendLimitEth: string;
  totalSpentEth: string;
  agentAddress: string;
  ethPriceUsd: number;
  logs: TerminalLog[];
  ledgerRows: AuditLog[];
  terminalEndRef: RefObject<HTMLDivElement>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sendPing: () => void;
  triggerNormalPurchase: () => void;
  triggerAttackSimulation: () => void;
  showRevertBanner: boolean;
  bannerFlashing: boolean;
  revertDetails: {
    attempted: string;
    remaining: string;
    gasUsed: string;
  };
  copyToClipboard: (text: string) => void;
}

export default function OverviewView({
  vaultBalanceEth,
  spendLimitEth,
  totalSpentEth,
  agentAddress,
  ethPriceUsd,
  logs,
  ledgerRows,
  terminalEndRef,
  searchQuery,
  setSearchQuery,
  sendPing,
  triggerNormalPurchase,
  triggerAttackSimulation,
  showRevertBanner,
  bannerFlashing,
  revertDetails,
  copyToClipboard,
}: OverviewViewProps) {
  // Compute percentage calculations
  const limitNum = parseFloat(spendLimitEth) || 0.05;
  const spentNum = parseFloat(totalSpentEth) || 0.003;
  const consumedPercent = Math.min(Math.round((spentNum / limitNum) * 100), 100);
  const headroomPercent = 100 - consumedPercent;
  const headroomEth = Math.max(limitNum - spentNum, 0).toFixed(4);

  const filteredLedger = ledgerRows.filter(
    (row) =>
      row.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.contentHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-6">
      {/* TOP STATUS STRIP / QUICK TELEMETRY */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-5 py-3 rounded-2xl neu-raised-sm text-slate-700">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Protocol Epoch
            </span>
            <span className="font-mono-code text-xs text-blue-600 font-bold px-2 py-0.5 rounded-full neu-inset-sm">
              #41
            </span>
          </div>
          <span className="text-slate-300 font-mono-code text-xs">•</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Guard Mode
            </span>
            <span className="px-2.5 py-1 rounded-full neu-raised-xs text-emerald-600 font-mono-code text-[11px] font-bold">
              AUTONOMOUS_ENFORCED
            </span>
          </div>
          <span className="text-slate-300 font-mono-code text-xs">•</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Rollup Target
            </span>
            <span className="font-mono-code text-xs text-slate-600 font-medium">
              Arbitrum One Nitro (Sequencer Synced)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono-code text-xs text-slate-600">
            <span>Base Gas:</span>
            <span className="text-blue-600 font-bold px-2 py-0.5 rounded-full neu-inset-sm">
              14.2 Gwei
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></div>
        </div>
      </div>

      {/* TOP ROW: VAULT INVARIANT & SPENDING GAUGE CARDS (3-COLUMN GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Vault Balance */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
                  <BankIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Total Vault Balance
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full neu-inset-sm text-slate-500 font-bold uppercase tracking-wider font-mono-code">
                Contract Holding
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold font-mono-code text-slate-900 tracking-tight">
                {vaultBalanceEth}
              </span>
              <span className="text-xl font-bold font-mono-code text-blue-600">ETH</span>
            </div>
            <div className="mt-2 font-mono-code text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                ≈ {ethToUsd(vaultBalanceEth, ethPriceUsd)} USD
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Oracle Sync: Live</span>
            </div>
          </div>

          {/* Solvency Indicator & Sparkline */}
          <div className="mt-6 pt-3 flex items-center justify-between px-3.5 py-2.5 rounded-2xl neu-inset-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono-code text-emerald-600 uppercase font-bold">
                100% Solvency Ratio
              </span>
            </div>
            <svg
              className="w-20 h-5 text-emerald-500 overflow-visible"
              fill="none"
              viewBox="0 0 80 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 16 L12 14 L24 15 L36 10 L48 11 L60 5 L72 7 L80 2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <circle className="animate-ping" cx="80" cy="2" fill="currentColor" r="2.5"></circle>
              <circle cx="80" cy="2" fill="currentColor" r="2"></circle>
            </svg>
          </div>
        </div>

        {/* Card 2: Spending Cap & Allowance */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
                  <SpeedIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Spending Cap &amp; Allowance
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full neu-inset-sm text-blue-600 font-bold font-mono-code">
                Epoch 41
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono-code text-xs mb-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Spend Limit:</span>
                <span className="text-slate-800 font-bold">
                  {spendLimitEth} ETH (~{ethToUsd(spendLimitEth, ethPriceUsd)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Spent:</span>
                <span className="text-blue-600 font-bold">
                  {totalSpentEth} ETH (~{ethToUsd(totalSpentEth, ethPriceUsd)})
                </span>
              </div>
            </div>

            {/* Recessed Inset Progress Track Gauge */}
            <div className="w-full mt-3">
              <div className="w-full h-3 rounded-full neu-inset-sm p-0.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full shadow-[0_0_8px_rgba(37,99,235,0.7)] transition-all duration-500"
                  style={{ width: `${consumedPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] font-mono-code text-blue-600 font-bold">
                  {consumedPercent}% Consumed
                </span>
                <span className="text-[11px] font-mono-code text-slate-400 font-medium">
                  {headroomPercent}% Headroom
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center gap-2 text-slate-600 font-mono-code text-xs">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">
              {headroomEth} ETH (~{ethToUsd(headroomEth, ethPriceUsd)}) unallocated headroom remaining in epoch #41
            </span>
          </div>
        </div>

        {/* Card 3: Agent Authority Key */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
                  <KeyIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Agent Authority Key
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full neu-inset-sm text-emerald-600 font-mono-code font-bold">
                <LockIcon className="w-3 h-3 text-emerald-600" />
                <span>Authorized Signer Only</span>
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              EVM Delegated Signer
            </div>

            {/* Recessed Credential Address Box */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl neu-inset font-mono-code text-xs text-slate-700">
              <span className="truncate font-semibold text-blue-600" id="agent-pubkey">
                {agentAddress}
              </span>
              <button
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                onClick={() => copyToClipboard(agentAddress)}
                title="Copy public key"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tactile Pills Row */}
          <div className="mt-4 pt-2 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full neu-raised-xs text-blue-600 text-[11px] font-bold font-mono-code">
              EIP-712 Gasless
            </span>
            <span className="px-3 py-1 rounded-full neu-raised-xs text-emerald-600 text-[11px] font-bold font-mono-code">
              x402 Micropayments Allowed
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: SPLIT SCREEN (TERMINAL + AUDIT LEDGER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Live x402 Protocol Terminal */}
        <div className="flex flex-col rounded-3xl neu-raised overflow-hidden min-h-[460px] p-2">
          {/* Terminal Window Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#e8ecf2]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 neu-inset-sm px-2 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
              </div>
              <span className="font-bold text-slate-800 text-sm tracking-tight ml-2">
                x402 Protocol Inspector
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-raised-xs font-mono-code text-[11px] text-emerald-600 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>18ms stream</span>
            </div>
          </div>

          {/* Recessed Inset Terminal Body */}
          <div
            className="flex-1 m-2 p-4 rounded-2xl neu-inset-terminal font-mono-code text-xs overflow-y-auto space-y-2 select-text"
            id="terminal-screen"
            style={{ maxHeight: "340px" }}
          >
            {logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  log.isAlert
                    ? "text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-500/20"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`select-none w-6 text-right font-medium ${
                    log.isAlert ? "text-red-400 font-bold" : "text-slate-600"
                  }`}
                >
                  {log.num}
                </span>
                <span className={log.isAlert ? "text-red-400" : "text-slate-500"}>
                  [{log.time}]
                </span>
                <div className="flex-1">{log.content}</div>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer Bar */}
          <div className="px-4 py-2.5 bg-[#e8ecf2] flex items-center justify-between text-slate-500 font-mono-code text-[11px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Auto-scroll: ON
              </span>
              <span>•</span>
              <span>Buffer: 256 lines</span>
            </div>
            <button
              className="neu-btn px-3 py-1 rounded-full text-blue-600 font-bold transition-all text-[11px] cursor-pointer"
              onClick={sendPing}
            >
              Send Ping
            </button>
          </div>
        </div>

        {/* Right Card: Proof-of-Delivery Audit Ledger */}
        <div className="flex flex-col rounded-3xl neu-raised overflow-hidden min-h-[460px] p-6">
          {/* Ledger Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Proof-of-Delivery Audit Ledger
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full neu-inset-sm text-blue-600 font-bold font-mono-code">
                  EVM Merkle Roots
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cryptographic payment attestations stored on Arbitrum nitro memory
              </p>
            </div>
            {/* Inset Neumorphic Search Input */}
            <div className="flex items-center gap-2 neu-inset px-3 py-1.5 rounded-full">
              <SearchIcon className="w-4 h-4 text-slate-400" />
              <input
                className="bg-transparent font-mono-code text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-36"
                placeholder="Filter invoice / hash..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Neumorphic Clean Table */}
          <div className="flex-1 overflow-x-auto rounded-2xl neu-inset-sm p-1">
            <table className="w-full text-left font-mono-code text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#d8e0eb]">
                  <th className="py-3 px-3">Invoice ID</th>
                  <th className="py-3 px-3">Provider Address</th>
                  <th className="py-3 px-3">Amount (ETH / USD)</th>
                  <th className="py-3 px-3">Content Hash</th>
                  <th className="py-3 px-3 text-right">Status Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8e0eb]/60">
                {filteredLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-blue-600">{row.invoiceId}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{row.provider}</td>
                    <td className="py-3 px-3">
                      <div className="text-blue-600 font-semibold">{row.amountEth}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{row.amountUsd}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        {row.contentHash}
                        <button
                          className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                          onClick={() => copyToClipboard(row.contentHash)}
                          title="Copy Content Hash"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-raised-xs text-emerald-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ledger Summary Footnote */}
          <div className="mt-4 pt-2 flex items-center justify-between text-slate-500 font-mono-code text-[11px]">
            <span className="text-slate-600">
              All proofs attested via SHA-256 pre-image commitments
            </span>
            <span className="text-blue-600 font-bold">Epoch Root: 0xbb82...7710</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION & SECURITY SIMULATION BAR */}
      <div className="p-8 rounded-3xl neu-raised flex flex-col gap-6">
        {/* Simulation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl neu-raised-xs flex items-center justify-center text-blue-600">
                <FlaskIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Interactive Demo &amp; Attack Simulation Controls
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test agent invariant enforcement against EVM smart contract guardrails
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono-code text-xs px-3 py-1.5 rounded-full neu-inset-sm text-slate-500">
            <span>Contract State:</span>
            <span className="text-emerald-600 font-bold">UNCOMPROMISED</span>
          </div>
        </div>

        {/* Buttons Row with Neumorphic Tactile Pill Styles */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Trigger Standard Purchase Button */}
          <button
            className="flex items-center gap-2 px-6 py-3.5 rounded-full neu-btn-primary font-bold text-sm cursor-pointer"
            id="btn-standard-purchase"
            onClick={triggerNormalPurchase}
          >
            <PlayIcon className="w-4 h-4" />
            <span>Trigger Standard Purchase (0.001 ETH / ~$2.50)</span>
          </button>

          {/* Simulate Overspend Attack Button */}
          <button
            className="flex items-center gap-2 px-6 py-3.5 rounded-full neu-btn-danger font-bold text-sm cursor-pointer"
            id="btn-attack-sim"
            onClick={triggerAttackSimulation}
          >
            <AlertTriangleIcon className="w-4 h-4" />
            <span>Simulate Overspend Attack (Attempt 0.1 ETH / ~$250.00)</span>
          </button>
        </div>

        {/* Prominent Status Alert Banner (Tactile Neumorphic Warning Surface) */}
        {showRevertBanner && (
          <div
            className={`relative overflow-hidden p-5 rounded-3xl neu-raised border-l-4 border-red-500 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              bannerFlashing ? "animate-pulse ring-2 ring-red-400" : ""
            }`}
            id="revert-banner"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl neu-raised-xs text-red-600 flex items-center justify-center bg-[#fdf2f2]">
                <WarningIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-700 tracking-tight">
                  ⚠️ [EVM REVERT CAUGHT] Error: BUDGET_EXCEEDED — Hard spending limit enforced by contract bytecode. Blocked attempt to spend 0.1 ETH (~$250.00). Agent halted; 0 ETH ($0.00) lost.
                </div>
                <div className="font-mono-code text-xs text-red-600/90 mt-1">
                  Execution call{" "}
                  <span className="font-bold text-slate-900 bg-red-100/70 px-1.5 py-0.5 rounded">
                    VaultGuard::verifyAndExecutePayment({revertDetails.attempted} ETH / ~{ethToUsd(revertDetails.attempted, ethPriceUsd)})
                  </span>{" "}
                  failed invariant check:{" "}
                  <span className="underline font-semibold">
                    {revertDetails.attempted} ETH (~{ethToUsd(revertDetails.attempted, ethPriceUsd)}) &gt; {revertDetails.remaining} ETH (~{ethToUsd(revertDetails.remaining, ethPriceUsd)}) remaining
                  </span>
                  .
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-4 py-2 rounded-full neu-inset-sm font-mono-code text-xs text-slate-700 flex items-center gap-2">
                <BoltIcon className="w-4 h-4 text-emerald-600" />
                <span>
                  Gas Used:{" "}
                  <strong className="text-blue-600 font-bold">{revertDetails.gasUsed}</strong>{" "}
                  (State rolled back completely; 0 ETH / $0.00 loss)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

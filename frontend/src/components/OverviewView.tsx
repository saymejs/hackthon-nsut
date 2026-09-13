"use client";

import React, { RefObject, useState } from "react";
import { ethToUsd } from "@/lib/formatters";
import Logo from "@/components/Logo";
import {
  SpeedIcon,
  CheckCircleIcon,
  LockIcon,
  CopyIcon,
  SearchIcon,
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
  triggerAgentRun?: () => void;
  isAgentRunning?: boolean;
  onEmergencyWithdraw?: () => void;
  isWithdrawPending?: boolean;
  showRevertBanner: boolean;
  bannerFlashing: boolean;
  revertDetails: {
    attempted: string;
    remaining: string;
    gasUsed: string;
  };
  copyToClipboard: (text: string) => void;
  copiedId?: string | null;
  onCopy?: (id: string, text: string) => void;
  activePolicyCount?: number;
  triggerIdempotencyReplay?: () => void;
  onOpenZombieModal?: () => void;
  idempotencyBadge?: string | null;
  onResetVault?: () => void;
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
  triggerAgentRun,
  isAgentRunning = false,
  onEmergencyWithdraw,
  isWithdrawPending = false,
  showRevertBanner,
  bannerFlashing,
  revertDetails,
  copyToClipboard,
  copiedId,
  onCopy,
  activePolicyCount = 4,
  triggerIdempotencyReplay,
  onOpenZombieModal,
  idempotencyBadge,
  onResetVault,
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
      row.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.contentHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyText = (id: string, text: string) => {
    if (onCopy) {
      onCopy(id, text);
    } else {
      copyToClipboard(text);
    }
  };

  const isDrained = parseFloat(vaultBalanceEth || "0") <= 0;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Dynamic Sub-header Stats Ribbon */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 rounded-3xl neu-raised text-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl neu-raised-xs flex items-center justify-center p-1 bg-[#e8ecf2]">
            <Logo variant="shield" className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-slate-800 tracking-tight">
            Security Status:
          </span>
          <span className="px-3 py-1 rounded-full neu-inset-sm text-emerald-600 font-mono-code text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero Budget Leaks Recorded</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full neu-raised-xs text-blue-600 font-mono-code text-[11px] font-bold">
            {activePolicyCount} Policies Enforced
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-code">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Arbitrum Nitro Sync:</span>
            <span className="text-emerald-600 font-bold">CONNECTED</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
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
              <div className="flex items-center gap-2.5 text-blue-600">
                <div className="w-10 h-10 rounded-2xl neu-raised-xs flex items-center justify-center p-1.5 bg-[#e8ecf2]">
                  <Logo variant="evm-guard" className="w-7 h-7" />
                </div>
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Total Vault Balance
                </span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full neu-inset-sm font-bold uppercase tracking-wider font-mono-code ${
                isDrained ? "text-red-600" : "text-slate-500"
              }`}>
                {isDrained ? "DRAINED / WITHDRAWN" : "Contract Holding"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-4xl font-extrabold font-mono-code tracking-tight ${
                isDrained ? "text-red-600" : "text-slate-900"
              }`}>
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
              <span className={`w-2 h-2 rounded-full ${isDrained ? "bg-red-500" : "bg-emerald-500"}`}></span>
              <span className={`text-[11px] font-mono-code uppercase font-bold ${
                isDrained ? "text-red-600" : "text-emerald-600"
              }`}>
                {isDrained ? "Vault Drained to Owner" : "100% Solvency Ratio"}
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

            {/* Tactile Inset Progress Bar */}
            <div className="w-full h-3 rounded-full neu-inset p-0.5 overflow-hidden my-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${consumedPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-2 font-mono-code text-slate-500 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600">
              {headroomPercent}% Headroom Available
            </span>
            <span className="text-[11px]">
              {headroomEth} ETH unallocated
            </span>
          </div>
        </div>

        {/* Card 3: Agent Authority Key */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="w-10 h-10 rounded-2xl neu-raised-xs flex items-center justify-center p-1.5 bg-[#e8ecf2]">
                  <Logo variant="agent-key" className="w-7 h-7" />
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

            {/* Recessed Credential Address Box with Copied Feedback */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl neu-inset font-mono-code text-xs text-slate-700">
              <span className="truncate font-semibold text-blue-600" id="agent-pubkey">
                {agentAddress}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {copiedId === "agent-address" && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                    Copied! ✓
                  </span>
                )}
                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                  onClick={() => handleCopyText("agent-address", agentAddress)}
                  title="Copy public key"
                >
                  {copiedId === "agent-address" ? (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
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

      {/* MIDDLE SECTION: TWO-COLUMN COMMAND BAY (CONSOLE + AUDIT LEDGER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Streaming Node Telemetry Console */}
        <div className="flex flex-col rounded-3xl neu-raised overflow-hidden min-h-[460px]">
          {/* Terminal Title Bar */}
          <div className="p-4 bg-[#e8ecf2] border-b border-[#d8e0eb] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block"></span>
              </div>
              <div className="flex items-center gap-2 font-mono-code text-xs text-slate-700 font-bold">
                <Logo variant="terminal" className="w-4 h-4" />
                <span>node-telemetry-daemon ~ v1.0.4-rc2</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono-code text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-emerald-600 font-bold">
                LIVE STREAM
              </span>
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
              <span>Buffer: {logs.length} lines</span>
            </div>
            <button
              type="button"
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
                <Logo variant="minimal" className="w-5 h-5" />
                <span className="font-bold text-slate-800 text-base tracking-tight">
                  Proof-of-Delivery Audit Ledger
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full neu-inset-sm text-blue-600 font-bold font-mono-code">
                  {ledgerRows.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cryptographic payment attestations stored on Arbitrum nitro memory &amp; Neon DB
              </p>
            </div>
            {/* Inset Neumorphic Search Input */}
            <div className="relative">
              <input
                className="w-48 pl-8 pr-3 py-1.5 rounded-full neu-inset text-xs font-mono-code text-slate-700 placeholder-slate-400 focus:outline-none"
                placeholder="Filter invoices / hashes..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Recessed Table Container */}
          <div className="flex-1 rounded-2xl neu-inset p-3 overflow-x-auto">
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
                        {row.contentHash.slice(0, 10)}...{row.contentHash.slice(-4)}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                          onClick={() => handleCopyText(`hash-${row.id}`, row.contentHash)}
                          title="Copy Content Hash"
                        >
                          {copiedId === `hash-${row.id}` ? (
                            <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                          ) : (
                            <CopyIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-raised-xs text-[10px] font-bold ${
                        row.status.includes("Withdrawn") || row.status.includes("DRAIN")
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          row.status.includes("Withdrawn") || row.status.includes("DRAIN")
                            ? "bg-red-500"
                            : "bg-emerald-500 animate-pulse"
                        }`}></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: SIMULATION CONTROLS & THREAT VERIFICATION BANNER */}
      <div className="flex flex-col gap-4 p-6 rounded-3xl neu-raised">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl neu-raised-xs flex items-center justify-center p-1 bg-[#e8ecf2]">
                <Logo variant="vault" className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">
                Live Attack Simulation &amp; Invariant Verification Suite
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test agent invariant enforcement against EVM smart contract guardrails and Neon DB synchronization
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono-code text-xs px-3 py-1.5 rounded-full neu-inset-sm text-slate-500">
            <span>Contract State:</span>
            <span className="text-emerald-600 font-bold">UNCOMPROMISED</span>
          </div>
        </div>

        {/* Buttons Grid with Neumorphic Tactile Pill Styles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {/* 1. Trigger Standard Purchase Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn-primary font-bold text-xs cursor-pointer shadow-sm transition-all"
            id="btn-standard-purchase"
            onClick={triggerNormalPurchase}
          >
            <PlayIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Standard Purchase (0.001 ETH)</span>
          </button>

          {/* 2. Trigger AI Autonomous Agent Run */}
          {triggerAgentRun && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn font-bold text-xs text-cyan-700 cursor-pointer disabled:opacity-50 hover:neu-inset transition-all"
              id="btn-agent-run"
              onClick={triggerAgentRun}
              disabled={isAgentRunning}
            >
              <BoltIcon className={`w-4 h-4 text-cyan-600 shrink-0 ${isAgentRunning ? "animate-spin" : ""}`} />
              <span className="truncate">{isAgentRunning ? "Running Agent..." : "Run AI Agent (Gemini 3.6)"}</span>
            </button>
          )}

          {/* 3. Simulate Overspend Attack Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn-danger font-bold text-xs cursor-pointer hover:neu-inset transition-all"
            id="btn-attack-sim"
            onClick={triggerAttackSimulation}
          >
            <AlertTriangleIcon className="w-4 h-4 shrink-0 text-red-600" />
            <span className="truncate">Simulate Overspend Attack</span>
          </button>

          {/* 4. Wi-Fi Disconnection & Anti-Double-Charge Idempotency Replay Button */}
          {triggerIdempotencyReplay && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn font-bold text-xs text-cyan-800 cursor-pointer hover:neu-inset border border-cyan-300 transition-all"
              id="btn-wifi-replay"
              onClick={triggerIdempotencyReplay}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-cyan-600 shrink-0">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
              <span className="truncate">Simulate Wi-Fi Replay (0 ETH)</span>
            </button>
          )}

          {/* 5. Zombie Agent Defense & Time-Decaying Budget Button */}
          {onOpenZombieModal && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn font-bold text-xs text-indigo-700 cursor-pointer hover:neu-inset border border-indigo-200 transition-all"
              id="btn-zombie-defense"
              onClick={onOpenZombieModal}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-indigo-600 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="truncate">Zombie Agent Defense (TTLs)</span>
            </button>
          )}

          {/* 6. Emergency Withdrawal Shortcut Button or Reset */}
          {isDrained && onResetVault ? (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-btn-primary font-bold text-xs cursor-pointer shadow-sm transition-all"
              onClick={onResetVault}
            >
              <CheckCircleIcon className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate">Re-fund Collateral &amp; Reset</span>
            </button>
          ) : onEmergencyWithdraw ? (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl neu-raised-xs hover:neu-inset text-amber-700 font-bold text-xs cursor-pointer border border-amber-300 transition-all"
              onClick={onEmergencyWithdraw}
              disabled={isWithdrawPending}
            >
              <WarningIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">{isWithdrawPending ? "Withdrawing..." : "Emergency Vault Withdrawal"}</span>
            </button>
          ) : null}
        </div>

        {/* Idempotency / Double Charge Protection Notification */}
        {idempotencyBadge && (
          <div className="p-4 rounded-2xl neu-inset-sm bg-cyan-50/80 border border-cyan-300 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3 text-cyan-900 text-xs font-bold">
              <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
              <span>{idempotencyBadge}</span>
            </div>
            <span className="text-[10px] font-mono-code text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full border border-cyan-300 font-bold">
              ZERO DUPLICATE CHARGE ENFORCED
            </span>
          </div>
        )}

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

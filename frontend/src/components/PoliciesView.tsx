"use client";

import React from "react";
import { ethToUsd } from "@/lib/formatters";
import Logo from "@/components/Logo";
import {
  LockIcon,
  CheckCircleIcon,
  ReplayIcon,
  BoltIcon,
  ShieldIcon,
  WarningIcon,
} from "@/components/Icons";

export interface PoliciesState {
  whitelistEnabled: boolean;
  circuitBreakerEnabled: boolean;
  idempotencyStrict: boolean;
  eip712Only: boolean;
}

interface PoliciesViewProps {
  spendLimitEth: string;
  ethPriceUsd: number;
  policies: PoliciesState;
  onTogglePolicy: (key: keyof PoliciesState) => void;
}

export default function PoliciesView({
  spendLimitEth,
  ethPriceUsd,
  policies,
  onTogglePolicy,
}: PoliciesViewProps) {
  // Compute enforced count: 1 immutable (Spend Ceiling) + any enabled toggles
  const activeTogglesCount = Object.values(policies).filter(Boolean).length;
  const totalEnforced = 1 + activeTogglesCount;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-3xl neu-raised text-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl neu-raised-xs flex items-center justify-center p-1.5 bg-[#e8ecf2]">
              <Logo variant="shield" className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              Active Security Guard Policies
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full neu-inset-sm font-mono-code text-[11px] font-bold transition-all ${
              totalEnforced >= 4 ? "text-emerald-600" : "text-amber-600"
            }`}>
              {totalEnforced} OF 5 ENFORCED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rules governing autonomous agent execution, transaction limits, and adversary containment.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono-code text-xs px-3.5 py-1.5 rounded-full neu-raised-xs text-emerald-600 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero Budget Leaks Recorded</span>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy 1: Hard Cumulative Spend Ceiling */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">Hard Spend Ceiling Invariant</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-blue-600 font-mono-code text-[10px] font-bold">
                IMMUTABLE
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Contract rejects any transaction pushing <code className="font-mono-code text-slate-800">totalSpent &gt; spendLimit</code>. 
              Cannot be overridden by agent prompts or software logic.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Configured Ceiling:</span>
              <span className="font-bold text-slate-900">{spendLimitEth} ETH (~{ethToUsd(spendLimitEth, ethPriceUsd)})</span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-emerald-600 flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>Enforced by EVM Bytecode Invariant</span>
          </div>
        </div>

        {/* Policy 2: HTTP 402 Idempotency Rule */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ReplayIcon className={`w-5 h-5 ${policies.idempotencyStrict ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="font-bold text-slate-900 text-sm">Strict Idempotency &amp; Replay Guard</span>
              </div>
              {/* Tactile Toggle */}
              <button
                type="button"
                onClick={() => onTogglePolicy("idempotencyStrict")}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  policies.idempotencyStrict ? "bg-emerald-100" : "bg-slate-200"
                }`}
                title={policies.idempotencyStrict ? "Disable Idempotency Guard" : "Enable Idempotency Guard"}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    policies.idempotencyStrict ? "ml-6 bg-emerald-500" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Mock provider stores fulfillment under <code className="font-mono-code text-slate-800">paymentId</code>. Re-submitting an already paid invoice serves cached deliverable at $0 cost.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Replay Protection:</span>
              <span className={`font-bold ${policies.idempotencyStrict ? "text-emerald-600" : "text-amber-600"}`}>
                {policies.idempotencyStrict ? "ACTIVE (Zero-Cost Cache)" : "DISABLED (Permissive Replays)"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            {policies.idempotencyStrict ? "✓ Double-charging prevented across all provider endpoints." : "⚠️ Warning: Invoices may be susceptible to multiple charges."}
          </div>
        </div>

        {/* Policy 3: Provider Destination Whitelist */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-5 h-5 ${policies.whitelistEnabled ? "text-blue-600" : "text-slate-400"}`} />
                <span className="font-bold text-slate-900 text-sm">Destination Provider Whitelist</span>
              </div>
              <button
                type="button"
                onClick={() => onTogglePolicy("whitelistEnabled")}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  policies.whitelistEnabled ? "bg-blue-100" : "bg-slate-200"
                }`}
                title={policies.whitelistEnabled ? "Disable Whitelist" : "Enable Whitelist"}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    policies.whitelistEnabled ? "ml-6 bg-blue-600" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Blocks payments to unverified contracts or arbitrary personal addresses. Agent can only fund registered machine payment providers.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Whitelisted Providers:</span>
              <span className={`font-bold ${policies.whitelistEnabled ? "text-slate-900" : "text-amber-600"}`}>
                {policies.whitelistEnabled ? "3 Approved Endpoints" : "DISABLED (All Addresses Permitted)"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            {policies.whitelistEnabled ? "✓ Prevents exfiltration to hacker-controlled wallets." : "⚠️ Warning: Payments allowed to arbitrary external destinations."}
          </div>
        </div>

        {/* Policy 4: Automated Circuit Breaker */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BoltIcon className={`w-5 h-5 ${policies.circuitBreakerEnabled ? "text-amber-600" : "text-slate-400"}`} />
                <span className="font-bold text-slate-900 text-sm">Automated Circuit Breaker</span>
              </div>
              <button
                type="button"
                onClick={() => onTogglePolicy("circuitBreakerEnabled")}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  policies.circuitBreakerEnabled ? "bg-amber-100" : "bg-slate-200"
                }`}
                title={policies.circuitBreakerEnabled ? "Disable Circuit Breaker" : "Enable Circuit Breaker"}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    policies.circuitBreakerEnabled ? "ml-6 bg-amber-500" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Temporarily halts agent invocation if more than 2 consecutive on-chain reverts occur within a 60-second window.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Threshold:</span>
              <span className={`font-bold ${policies.circuitBreakerEnabled ? "text-amber-700" : "text-slate-500"}`}>
                {policies.circuitBreakerEnabled ? "2 Reverts / 60s Window" : "DISABLED (No Software Throttling)"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            {policies.circuitBreakerEnabled ? "✓ Prevents gas drain from repeated recursive loop failures." : "⚠️ Caution: High risk of gas drain under infinite loop conditions."}
          </div>
        </div>
      </div>

      {/* Threat Containment Ledger */}
      <div className="p-6 rounded-3xl neu-raised flex flex-col gap-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <ShieldIcon className="w-4 h-4 text-emerald-600" />
          <span>Threat Containment Incident Report</span>
        </h3>
        <div className="p-4 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between border-b border-[#d8e0eb] pb-2">
            <span className="text-slate-500">Incident #001:</span>
            <span className="text-emerald-700 font-bold">NEUTRALIZED (100% CONTAINED)</span>
          </div>
          <div className="text-slate-600">
            <strong>Vector:</strong> Adversarial Prompt Overspend Exploit (Attempted: 0.1000 ETH / ~$250.00).
          </div>
          <div className="text-slate-600">
            <strong>Defense Triggered:</strong> <code className="text-red-600 font-bold">AgentVault::payService() -&gt; require(totalSpent + amount &lt;= spendLimit, &quot;BUDGET_EXCEEDED&quot;)</code>.
          </div>
          <div className="text-slate-600">
            <strong>Financial Impact:</strong> $0.00 lost. State rolled back at EVM execution boundary.
          </div>
        </div>
      </div>
    </div>
  );
}

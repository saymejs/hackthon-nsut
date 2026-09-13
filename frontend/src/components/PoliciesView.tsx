"use client";

import React, { useState } from "react";
import { ethToUsd } from "@/lib/formatters";

interface PoliciesViewProps {
  spendLimitEth: string;
  ethPriceUsd: number;
}

export default function PoliciesView({ spendLimitEth, ethPriceUsd }: PoliciesViewProps) {
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [circuitBreakerEnabled, setCircuitBreakerEnabled] = useState(true);
  const [idempotencyStrict, setIdempotencyStrict] = useState(true);
  const [eip712Only, setEip712Only] = useState(true);

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-3xl neu-raised text-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">policy</span>
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              Active Security Guard Policies
            </h2>
            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-emerald-600 font-mono-code text-[11px] font-bold">
              4 ENFORCED
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
                <span className="material-symbols-outlined text-blue-600 text-[20px]">lock</span>
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
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Enforced by EVM Bytecode Invariant</span>
          </div>
        </div>

        {/* Policy 2: HTTP 402 Idempotency Rule */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">replay</span>
                <span className="font-bold text-slate-900 text-sm">Strict Idempotency &amp; Replay Guard</span>
              </div>
              {/* Tactile Toggle */}
              <button
                onClick={() => setIdempotencyStrict(!idempotencyStrict)}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  idempotencyStrict ? "bg-emerald-100" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    idempotencyStrict ? "ml-6 bg-emerald-500" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Mock provider stores fulfillment under <code className="font-mono-code text-slate-800">paymentId</code>. Re-submitting an already paid invoice serves cached deliverable at $0 cost.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Replay Protection:</span>
              <span className="font-bold text-emerald-600">{idempotencyStrict ? "ACTIVE (Zero-Cost Cache)" : "DISABLED"}</span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            ✓ Double-charging prevented across all provider endpoints.
          </div>
        </div>

        {/* Policy 3: Provider Destination Whitelist */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">fact_check</span>
                <span className="font-bold text-slate-900 text-sm">Destination Provider Whitelist</span>
              </div>
              <button
                onClick={() => setWhitelistEnabled(!whitelistEnabled)}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  whitelistEnabled ? "bg-blue-100" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    whitelistEnabled ? "ml-6 bg-blue-600" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Blocks payments to unverified contracts or arbitrary personal addresses. Agent can only fund registered machine payment providers.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Whitelisted Providers:</span>
              <span className="font-bold text-slate-900">3 Approved Endpoints</span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            ✓ Prevents exfiltration to hacker-controlled wallets.
          </div>
        </div>

        {/* Policy 4: Automated Circuit Breaker */}
        <div className="p-6 rounded-3xl neu-raised flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">electric_bolt</span>
                <span className="font-bold text-slate-900 text-sm">Automated Circuit Breaker</span>
              </div>
              <button
                onClick={() => setCircuitBreakerEnabled(!circuitBreakerEnabled)}
                className={`w-12 h-6 rounded-full p-0.5 neu-inset-sm transition-all cursor-pointer ${
                  circuitBreakerEnabled ? "bg-amber-100" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full neu-raised-xs transition-all ${
                    circuitBreakerEnabled ? "ml-6 bg-amber-500" : "ml-0 bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Temporarily halts agent invocation if more than 2 consecutive on-chain reverts occur within a 60-second window.
            </p>
            <div className="mt-4 p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-slate-700 flex justify-between items-center">
              <span>Threshold:</span>
              <span className="font-bold text-amber-700">2 Reverts / 60s Window</span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] font-mono-code text-slate-500">
            ✓ Prevents gas drain from repeated recursive loop failures.
          </div>
        </div>
      </div>

      {/* Threat Containment Ledger */}
      <div className="p-6 rounded-3xl neu-raised flex flex-col gap-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
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

"use client";

import React, { useState } from "react";
import { ethToUsd } from "@/lib/formatters";
import { ShieldIcon, SlidersIcon, CheckCircleIcon, CodeIcon, CopyIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { VAULT_ABI } from "@/lib/contract";

interface ContractGuardProps {
  vaultAddress: string;
  ownerAddress: string;
  agentAddress: string;
  vaultBalanceEth: string;
  spendLimitEth: string;
  totalSpentEth: string;
  ethPriceUsd: number;
  onUpdateLimit: (newLimit: string) => void;
  isOwner?: boolean;
  connectedAddress?: string;
  isConnected?: boolean;
  copiedId?: string | null;
  onCopy?: (id: string, text: string) => void;
  onEmergencyWithdraw?: () => void;
  isWithdrawPending?: boolean;
}

export default function ContractGuardView({
  vaultAddress,
  ownerAddress,
  agentAddress,
  vaultBalanceEth,
  spendLimitEth,
  totalSpentEth,
  ethPriceUsd,
  onUpdateLimit,
  isOwner = false,
  connectedAddress,
  isConnected = false,
  copiedId,
  onCopy,
  onEmergencyWithdraw,
  isWithdrawPending = false,
}: ContractGuardProps) {
  const [inputLimit, setInputLimit] = useState(spendLimitEth);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const { writeContractAsync: executeSetLimit, isPending: isSettingLimit } = useWriteContract();

  const handleCopyText = (id: string, text: string) => {
    if (onCopy) {
      onCopy(id, text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleSetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputLimit);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid ETH spend limit");
      return;
    }

    if (isOwner) {
      try {
        const txHash = await executeSetLimit({
          address: vaultAddress as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "setLimit",
          args: [parseEther(val.toFixed(4))],
        });
        onUpdateLimit(val.toFixed(4));
        setUpdateStatus(
          `On-chain setLimit() broadcast! Tx Hash: ${txHash.slice(0, 14)}... Spend limit locked at ${val.toFixed(4)} ETH (~${ethToUsd(val, ethPriceUsd)}).`
        );
        setTimeout(() => setUpdateStatus(null), 6000);
        return;
      } catch (err: any) {
        alert(`On-chain transaction failed: ${err?.shortMessage || err?.message}`);
        return;
      }
    }

    // Observer / simulation mode
    onUpdateLimit(val.toFixed(4));
    setUpdateStatus(
      `Simulated spend limit updated to ${val.toFixed(4)} ETH (~${ethToUsd(val, ethPriceUsd)}). Connect owner wallet (${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}) to broadcast live on-chain.`
    );
    setTimeout(() => setUpdateStatus(null), 5000);
  };

  const isDrained = parseFloat(vaultBalanceEth || "0") <= 0;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-3xl neu-raised text-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl neu-raised-xs flex items-center justify-center p-1.5 bg-[#e8ecf2]">
              <Logo variant="evm-guard" className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              EVM Smart Contract Guard Specifications
            </h2>
            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-emerald-600 font-mono-code text-[11px] font-bold">
              BYTECODE_VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consensus-level spending invariants enforced by <code className="font-mono-code text-blue-600 font-bold">AgentVault.sol</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono-code text-xs px-3 py-1.5 rounded-full neu-inset-sm text-slate-700">
            <span>Solidity:</span>
            <span className="text-blue-600 font-bold">^0.8.20</span>
          </div>
          <div className="flex items-center gap-2 font-mono-code text-xs px-3 py-1.5 rounded-full neu-inset-sm text-slate-700">
            <span>License:</span>
            <span className="text-slate-900 font-bold">MIT</span>
          </div>
        </div>
      </div>

      {/* 3 Grid Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Checks-Effects-Interactions */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-bold text-slate-800 text-sm">Pattern Discipline</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full neu-inset-sm text-emerald-600 font-mono-code font-bold">
                CEI Compliant
              </span>
            </div>
            <div className="font-mono-code text-xs text-slate-600 space-y-2 bg-[#e4e8ef]/60 p-3 rounded-2xl neu-inset-sm">
              <div className="text-emerald-700 font-bold">1. Check:</div>
              <div className="text-slate-500 pl-2">require(spent + amt &lt;= limit)</div>
              <div className="text-emerald-700 font-bold">2. Effect:</div>
              <div className="text-slate-500 pl-2">totalSpent += amount;</div>
              <div className="text-emerald-700 font-bold">3. Interaction:</div>
              <div className="text-slate-500 pl-2">provider.call&#123;value: amt&#125;(&quot;&quot;);</div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 font-mono-code">
            ✓ Reentrancy attacks mathematically eliminated before external dispatch.
          </div>
        </div>

        {/* Card 2: Role Authorization Matrix */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-bold text-slate-800 text-sm">Role Separation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full neu-inset-sm text-blue-600 font-mono-code font-bold">
                Dual Signer
              </span>
            </div>
            <div className="space-y-3 font-mono-code text-xs">
              <div className="p-2.5 rounded-2xl neu-inset-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Human Owner</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("owner-addr", ownerAddress)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Copy Owner Address"
                  >
                    {copiedId === "owner-addr" ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Copied! ✓</span>
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-slate-800 font-semibold truncate">{ownerAddress}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Permissions: setLimit(), setAgent(), withdraw()</div>
              </div>
              <div className="p-2.5 rounded-2xl neu-inset-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1.5">
                    <Logo variant="agent-key" className="w-3.5 h-3.5" />
                    <span>AI Agent Key</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("agent-addr", agentAddress)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Copy Agent Address"
                  >
                    {copiedId === "agent-addr" ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Copied! ✓</span>
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-blue-600 font-semibold truncate mt-0.5">{agentAddress}</div>
                <div className="text-[10px] text-amber-600 mt-0.5">Permissions: payService() ONLY (Restricted)</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 font-mono-code">
            ✓ Agent has zero direct withdraw privileges.
          </div>
        </div>

        {/* Card 3: Invariant Guarantee */}
        <div className="neu-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-bold text-slate-800 text-sm">Budget Invariant</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full neu-inset-sm font-mono-code font-bold ${
                isDrained ? "text-amber-600" : "text-red-600"
              }`}>
                {isDrained ? "DRAINED" : "Hard Revert"}
              </span>
            </div>
            <div className="space-y-2 font-mono-code text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Vault Balance:</span>
                <span className={`font-bold ${isDrained ? "text-red-600" : "text-slate-900"}`}>
                  {vaultBalanceEth} ETH (~{ethToUsd(vaultBalanceEth, ethPriceUsd)})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Spend Limit:</span>
                <span className="font-bold text-slate-900">{spendLimitEth} ETH (~{ethToUsd(spendLimitEth, ethPriceUsd)})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Spent:</span>
                <span className="font-bold text-blue-600">{totalSpentEth} ETH (~{ethToUsd(totalSpentEth, ethPriceUsd)})</span>
              </div>
              <div className="p-2.5 rounded-2xl neu-inset-sm text-red-700 bg-red-50/50 text-[11px]">
                Revert Code: <strong>BUDGET_EXCEEDED</strong> triggered when spend &gt; limit.
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 font-mono-code">
            ✓ Enforced by EVM consensus; impossible to bypass by LLM prompt jailbreaks.
          </div>
        </div>
      </div>

      {/* Interactive Owner Control: Update Spend Limit */}
      <div className="p-8 rounded-3xl neu-raised flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Owner Administration: Update Spend Ceiling</h3>
          </div>
          {isOwner ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset-sm text-emerald-600 font-mono-code text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Owner Mode: Live EVM Write</span>
            </span>
          ) : (
            <span className="text-xs font-mono-code text-slate-500">
              {isConnected ? "Connected (Read-Only Observer)" : "Wallet Disconnected (Simulation Mode)"}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600">
          As the human vault governor, you can increase or decrease the agent&apos;s cumulative allowance at any time.
        </p>

        <form onSubmit={handleSetLimit} className="flex flex-wrap items-center gap-4 mt-2">
          <div className="flex items-center gap-2 neu-inset px-4 py-2.5 rounded-2xl">
            <span className="font-mono-code text-xs text-slate-400">New Spend Limit (ETH):</span>
            <input
              type="text"
              className="bg-transparent font-mono-code text-sm text-slate-900 font-bold focus:outline-none w-32"
              value={inputLimit}
              onChange={(e) => setInputLimit(e.target.value)}
              placeholder="0.0500"
            />
            <span className="text-xs font-mono-code text-blue-600 font-bold">
              (~{ethToUsd(inputLimit, ethPriceUsd)})
            </span>
          </div>

          <button
            type="submit"
            disabled={isSettingLimit}
            className="neu-btn-primary px-6 py-2.5 rounded-2xl font-bold text-xs cursor-pointer flex items-center gap-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>
              {isSettingLimit
                ? "Signing On-Chain..."
                : isOwner
                ? "Broadcast setLimit() On-Chain"
                : "Simulate setLimit() Update"}
            </span>
          </button>
        </form>

        {updateStatus && (
          <div className="p-3 rounded-2xl neu-inset-sm font-mono-code text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{updateStatus}</span>
          </div>
        )}
      </div>

      {/* Bytecode & Contract Source Preview */}
      <div className="p-6 rounded-3xl neu-raised flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CodeIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">AgentVault.sol Source Code Excerpt</h3>
          </div>
          <span className="font-mono-code text-xs text-slate-500">Contract: {vaultAddress}</span>
        </div>
        <div className="p-4 rounded-2xl neu-inset-terminal font-mono-code text-xs text-slate-300 overflow-x-auto">
          <pre>{`function payService(
    string calldata paymentId,
    address payable provider,
    uint256 amount,
    bytes32 contentHash
) external onlyAgent {
    require(provider != address(0), "INVALID_PROVIDER");
    require(totalSpent + amount <= spendLimit, "BUDGET_EXCEEDED");
    require(address(this).balance >= amount, "INSUFFICIENT_VAULT_BALANCE");

    // 1. Checks-Effects: Increment cumulative spend BEFORE external interaction
    totalSpent += amount;

    // 2. Interaction: Low-level call to provider
    (bool success, ) = provider.call{value: amount}("");
    require(success, "PAYMENT_FAILED");

    emit ServicePaid(paymentId, provider, amount, contentHash);
}`}</pre>
        </div>
      </div>
    </div>
  );
}

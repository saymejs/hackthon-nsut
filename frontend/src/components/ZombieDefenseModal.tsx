"use client";

import React, { useState, useEffect } from "react";
import Logo from "@/components/Logo";

interface SubAgent {
  id: number;
  name: string;
  parentAgent: string;
  walletAddress: string;
  spendAllowanceEth: string;
  spentEth: string;
  expiresAt: number;
  status: "ACTIVE" | "SEALED_EXPIRED" | "KILLED";
  secondsRemaining: number;
}

interface ZombieDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLockout: (lockedCount: number) => void;
}

export default function ZombieDefenseModal({
  isOpen,
  onClose,
  onSimulateLockout,
}: ZombieDefenseModalProps) {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lockoutActive, setLockoutActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadSubAgents() {
      try {
        const res = await fetch("/api/zombie-defense");
        const data = await res.json();
        if (data.success && data.subAgents) {
          setSubAgents(data.subAgents);
        }
      } catch (err) {
        console.error("Failed to load subagents", err);
      }
    }
    loadSubAgents();

    const interval = setInterval(() => {
      setSubAgents((prev) =>
        prev.map((s) => ({
          ...s,
          secondsRemaining: Math.max(0, s.secondsRemaining - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateCrash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zombie-defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lockout" }),
      });
      const data = await res.json();
      if (data.success) {
        setLockoutActive(true);
        setSubAgents((prev) =>
          prev.map((s) => ({
            ...s,
            status: "SEALED_EXPIRED",
            secondsRemaining: 0,
          }))
        );
        onSimulateLockout(data.lockedCount || 3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSwarm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zombie-defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success && data.subAgents) {
        setLockoutActive(false);
        const now = Math.floor(Date.now() / 1000);
        setSubAgents(
          data.subAgents.map((s: any) => ({
            ...s,
            secondsRemaining: Math.max(0, s.expiresAt - now),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#e8ecf2] rounded-3xl p-6 neu-raised border border-slate-300 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full neu-raised-xs hover:neu-inset flex items-center justify-center text-slate-500 font-bold text-sm cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl neu-inset-sm flex items-center justify-center text-cyan-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="w-6 h-6">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Zombie Agent Drain Defense
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                Time-Decaying Budgets
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic protocol self-destruct timers prevent abandoned sub-agents from burning funds.
            </p>
          </div>
        </div>

        {/* Threat Architecture Explainer */}
        <div className="mb-5 p-4 rounded-2xl neu-inset-sm border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="text-amber-600">⚠️ Enterprise Threat: The &ldquo;Zombie Agent Drain&rdquo;</span>
          </div>
          <p className="leading-relaxed">
            When an orchestrator AI crashes or is manually killed, background worker sub-agents keep running with open crypto allowances, burning funds on autopilot because traditional Web3 approvals never expire.
          </p>
          <div className="flex items-center gap-2 font-bold text-emerald-700 pt-1">
            <span>🛡️ Our Smart Vault Solution:</span>
            <span>Protocol-Enforced Self-Destruct Timers (Time-Decaying Budgets).</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Allowances seal themselves deterministically at the EVM protocol level upon TTL expiration. Zero human intervention or gas fees required to revoke.
          </p>
        </div>

        {/* Active Sub-Agent Swarm Table */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Spawned Sub-Agent Swarm (Live Allowances)
            </h3>
            <span className="text-[10px] font-mono-code bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300">
              Neon DB Synchronized
            </span>
          </div>

          <div className="space-y-2.5">
            {subAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-2xl neu-raised-xs flex items-center justify-between bg-[#edf1f7]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{agent.name}</span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      ({agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Allowance: <strong className="text-slate-700">{agent.spendAllowanceEth} ETH</strong> |
                    Spent: <span className="font-mono-code">{agent.spentEth} ETH</span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      agent.status === "SEALED_EXPIRED"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    }`}
                  >
                    <span>{agent.status === "SEALED_EXPIRED" ? "SEALED (EXPIRED)" : "ACTIVE"}</span>
                  </div>
                  <div className="text-[11px] font-mono-code text-slate-500 mt-1">
                    TTL: <strong className="text-cyan-700">{formatTime(agent.secondsRemaining)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Attack Simulation Button */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={handleSimulateCrash}
            disabled={loading || lockoutActive}
            className={`w-full py-3.5 rounded-full font-bold text-xs tracking-wide cursor-pointer flex items-center justify-center gap-2 ${
              lockoutActive
                ? "bg-emerald-600 text-white shadow-md cursor-default"
                : "neu-btn-danger"
            }`}
          >
            {lockoutActive ? (
              <span>✓ Orchestrator Crash Handled — All 3 Sub-Agents Auto-Sealed (0 ETH Lost)</span>
            ) : (
              <span>🚨 Simulate Orchestrator Crash (Trigger Zombie Auto-Seal)</span>
            )}
          </button>

          {lockoutActive && (
            <button
              type="button"
              onClick={handleResetSwarm}
              disabled={loading}
              className="w-full py-2.5 rounded-full neu-raised-xs hover:neu-inset text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
            >
              <span>🔄 Reset Swarm &amp; Re-Arm Timers (Repeat Demo)</span>
            </button>
          )}

          <p className="text-[10px] text-center text-slate-500 mt-2">
            Simulates a sudden fatal error where the orchestrator terminates without sending a revoke signal. Demonstrates automatic budget expiration.
          </p>
        </div>
      </div>
    </div>
  );
}

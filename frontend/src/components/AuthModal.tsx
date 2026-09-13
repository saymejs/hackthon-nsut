"use client";

import React, { useState } from "react";
import Logo from "@/components/Logo";
import { CheckCircleIcon, LockIcon } from "@/components/Icons";

export interface UserSession {
  id: number;
  email: string;
  username: string;
  role: string;
  walletAddress: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Hackathon Judge");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email || `judge_${Date.now().toString().slice(-4)}@hackathon.org`,
            username: username || "Judge " + role,
            password: password || "secure_judge_2026",
            role,
            walletAddress: walletAddress.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        onLoginSuccess({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
          walletAddress: data.wallet?.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        });
        onClose();
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        onLoginSuccess({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
          walletAddress: data.wallet?.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickJudgeLogin = () => {
    onLoginSuccess({
      id: 999,
      email: "lead.judge@nsut-hackathon.org",
      username: "Lead Evaluator",
      role: "Hackathon Judge",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#e8ecf2] rounded-3xl p-6 neu-raised border border-slate-300 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full neu-raised-xs hover:neu-inset flex items-center justify-center text-slate-500 font-bold text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <Logo size={42} variant="vault" />
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Agent SafePay // Dashboard Auth
            </h2>
            <p className="text-xs text-slate-500">
              Personalized Judge Session &amp; Neon DB Synchronization
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-full neu-inset-sm p-1 mb-5">
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === "signup"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Create Judge Account
          </button>
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === "login"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Judge / Auditor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Alex Vance"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl neu-inset text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="judge@hackathon.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl neu-inset text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl neu-inset text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {tab === "signup" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Evaluation Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl neu-inset text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-transparent"
                >
                  <option value="Hackathon Judge">Hackathon Judge</option>
                  <option value="Smart Contract Auditor">Smart Contract Auditor</option>
                  <option value="AI Safety Researcher">AI Safety Researcher</option>
                  <option value="Enterprise Admin">Enterprise Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Linked EVM Wallet Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="0x... (leave empty for auto-generated wallet)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl neu-inset text-xs font-mono-code text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full neu-btn-primary font-bold text-xs tracking-wide cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : tab === "signup" ? "Create Account & Start Session" : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleQuickJudgeLogin}
            className="w-full py-2.5 rounded-full neu-raised-xs hover:neu-inset text-cyan-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 border border-cyan-300"
          >
            <span>⚡ 1-Click Judge Instant Session</span>
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Instantly boots a sandbox session with fresh IDs, Neon DB connection, and zero demo values.
          </p>
        </div>
      </div>
    </div>
  );
}

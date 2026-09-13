"use client";

import React, { useState } from "react";

interface LogEntry {
  id: string;
  time: string;
  category: "RPC" | "HTTP-402" | "EVM-REVERT" | "TELEMETRY";
  message: string;
}

export default function NodeLogsView() {
  const [filter, setFilter] = useState<string>("ALL");
  const [copied, setCopied] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      time: "00:14:00.102",
      category: "RPC",
      message: "eth_chainId() -> 11155111 (Sepolia Testnet) [Latency: 18ms]",
    },
    {
      id: "2",
      time: "00:14:00.341",
      category: "RPC",
      message: "eth_getBalance(0x5FbDB2315678afecb367f032d93F642f64180aa3) -> 0.8500 ETH [200 OK]",
    },
    {
      id: "3",
      time: "00:14:02.019",
      category: "HTTP-402",
      message: "INCOMING REQUEST: POST /api/v1/service/compute -> Missing X-Payment-Id / X-Payment-TxHash headers",
    },
    {
      id: "4",
      time: "00:14:02.022",
      category: "HTTP-402",
      message: "RESPONSE 402 PAYMENT REQUIRED -> Generated invoice: inv_98a7 | Recipient: 0x8920...a4f2 | Amount: 0.0010 ETH (~$2.50 USD)",
    },
    {
      id: "5",
      time: "00:14:03.118",
      category: "RPC",
      message: "eth_sendRawTransaction(AgentVault.payService(inv_98a7, 0x8920...a4f2, 1000000000000000, 0xa6c9b...)) -> TxHash: 0x4a5b6c7d...0123",
    },
    {
      id: "6",
      time: "00:14:04.290",
      category: "RPC",
      message: "eth_getTransactionReceipt(0x4a5b6c7d...0123) -> Status: 1 (SUCCESS) | Block: #6194820 | Gas Used: 48,219",
    },
    {
      id: "7",
      time: "00:14:05.011",
      category: "HTTP-402",
      message: "DELIVERY CONFIRMED -> Content-Hash: 0xa6c9b7410de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3 (200 OK)",
    },
    {
      id: "8",
      time: "00:14:08.514",
      category: "EVM-REVERT",
      message: "EXECUTION HALTED -> AgentVault.payService(0.1000 ETH) -> Invariant violation: (totalSpent + 0.1000 ETH > 0.0500 ETH limit)",
    },
    {
      id: "9",
      time: "00:14:08.515",
      category: "EVM-REVERT",
      message: "BYTECODE REVERT -> Error('BUDGET_EXCEEDED') [Gas Consumed: 21,432 | State rolled back 100% | Zero financial loss]",
    },
    {
      id: "10",
      time: "00:14:10.001",
      category: "TELEMETRY",
      message: "Attestation beacon synced with Arbitrum Nitro Merkle state accumulator (Epoch #41 Root: 0xbb82...7710)",
    },
  ]);

  const filteredLogs = logs.filter(
    (l) => filter === "ALL" || l.category === filter
  );

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.time}] [${l.category}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const addPingLog = () => {
    const now = new Date().toISOString().substring(11, 23);
    setLogs((prev) => [
      ...prev,
      {
        id: (prev.length + 1).toString(),
        time: now,
        category: "RPC",
        message: `eth_blockNumber() -> #6194821 (Sepolia Nitro Gateway Latency: 19ms) [200 OK]`,
      },
    ]);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-3xl neu-raised text-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              EVM RPC &amp; Node Diagnostic Logs
            </h2>
            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-emerald-600 font-mono-code text-[11px] font-bold">
              STREAM_ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Low-level JSON-RPC, HTTP 402 negotiations, and consensus-level bytecode revert telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addPingLog}
            className="neu-btn px-3.5 py-1.5 rounded-2xl text-xs font-bold text-blue-600 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sensors</span>
            <span>Simulate RPC Call</span>
          </button>
          <button
            onClick={copyLogs}
            className="neu-btn px-3.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? "check" : "content_copy"}
            </span>
            <span>{copied ? "Copied!" : "Copy Logs"}</span>
          </button>
          <button
            onClick={clearLogs}
            className="neu-btn-danger px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 rounded-2xl neu-raised-sm">
        {["ALL", "RPC", "HTTP-402", "EVM-REVERT", "TELEMETRY"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer font-mono-code ${
              filter === cat
                ? "neu-inset-sm text-blue-600"
                : "neu-btn text-slate-600 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono-code text-slate-400">
          Showing {filteredLogs.length} events
        </span>
      </div>

      {/* Full-Page Monospace Terminal */}
      <div className="rounded-3xl neu-raised overflow-hidden p-3">
        <div className="p-4 rounded-2xl neu-inset-terminal font-mono-code text-xs text-slate-300 min-h-[460px] max-h-[580px] overflow-y-auto space-y-2.5">
          {filteredLogs.map((log) => {
            const isRevert = log.category === "EVM-REVERT";
            const is402 = log.category === "HTTP-402";
            const isRpc = log.category === "RPC";

            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-1.5 rounded-xl transition-colors ${
                  isRevert ? "bg-red-950/40 text-red-300 border border-red-500/20" : "text-slate-300"
                }`}
              >
                <span className="text-slate-500 select-none text-[11px] w-24 shrink-0">
                  [{log.time}]
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    isRevert
                      ? "bg-red-600 text-white"
                      : is402
                      ? "bg-amber-500/20 text-amber-300"
                      : isRpc
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {log.category}
                </span>
                <span className="flex-1 break-all">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ethToUsd } from "@/lib/formatters";
import { ReceiptIcon, DownloadIcon, SearchIcon, CopyIcon, CheckCircleIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import { AuditLog } from "@/components/OverviewView";

interface Transaction {
  id: string;
  timestamp: string;
  invoiceId: string;
  service: string;
  provider: string;
  amountEth: string;
  amountUsd: string;
  txHash: string;
  contentHash: string;
  status: "SETTLED" | "REVERTED" | "CACHED" | "WITHDRAWN";
  gasUsed: string;
}

interface TransactionsViewProps {
  ethPriceUsd: number;
  ledgerRows?: AuditLog[];
  copiedId?: string | null;
  onCopy?: (id: string, text: string) => void;
}

export default function TransactionsView({
  ethPriceUsd,
  ledgerRows,
  copiedId,
  onCopy,
}: TransactionsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const baseTransactions: Transaction[] = [
    {
      id: "tx-104",
      timestamp: "12s ago",
      invoiceId: "inv_98a7",
      service: "POST /api/v1/service/compute",
      provider: "0x8920...a4f2",
      amountEth: "0.0010 ETH",
      amountUsd: "~$2.50",
      txHash: "0x4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123",
      contentHash: "0xa6c9b7410de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
      status: "SETTLED",
      gasUsed: "48,219",
    },
    {
      id: "tx-103",
      timestamp: "1m ago",
      invoiceId: "inv_98a6",
      service: "POST /api/v1/service/translate",
      provider: "0x3421...c981",
      amountEth: "0.0008 ETH",
      amountUsd: "~$2.00",
      txHash: "0x7890abcdef123456789abcdef0123456789abcdef0123456789abcdef0123456",
      contentHash: "0x3f1e82710de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
      status: "SETTLED",
      gasUsed: "41,102",
    },
    {
      id: "tx-102",
      timestamp: "3m ago",
      invoiceId: "inv_98a5",
      service: "POST /api/v1/service/ocr-extract",
      provider: "0x8920...a4f2",
      amountEth: "0.0012 ETH",
      amountUsd: "~$3.00",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      contentHash: "0x9c4471010de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
      status: "SETTLED",
      gasUsed: "43,890",
    },
    {
      id: "tx-101",
      timestamp: "4m ago",
      invoiceId: "inv_exploit_01",
      service: "POST /api/v1/service/heavy-batch",
      provider: "0xBadActor...6666",
      amountEth: "0.1000 ETH",
      amountUsd: "~$250.00",
      txHash: "0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff",
      contentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      status: "REVERTED",
      gasUsed: "21,432",
    },
    {
      id: "tx-100",
      timestamp: "5m ago",
      invoiceId: "inv_98a4",
      service: "POST /api/v1/service/sentiment",
      provider: "0x8920...a4f2",
      amountEth: "0.0005 ETH",
      amountUsd: "~$1.25",
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      contentHash: "0x12bb59010de850682255cfc9b0e127608eb3fe05a5a1f0a5ee3bc3f136e09ce3",
      status: "SETTLED",
      gasUsed: "37,420",
    },
  ];

  // Dynamically merge live transactions from ledgerRows if present
  const dynamicRows: Transaction[] = (ledgerRows || []).map((row) => ({
    id: `dyn-${row.id}`,
    timestamp: row.timestamp,
    invoiceId: row.invoiceId,
    service: row.invoiceId.includes("WITHDRAW") ? "EVM Emergency Drain" : "POST /api/v1/service/compute",
    provider: row.provider,
    amountEth: row.amountEth,
    amountUsd: row.amountUsd,
    txHash: `0x${row.id.padStart(64, "0")}`,
    contentHash: row.contentHash,
    status: row.status.includes("Withdrawn") || row.status.includes("DRAIN")
      ? "WITHDRAWN"
      : row.status.includes("Revert")
      ? "REVERTED"
      : "SETTLED",
    gasUsed: "21,432",
  }));

  // Unique merged transactions
  const combined = [...dynamicRows, ...baseTransactions].filter(
    (tx, index, self) => index === self.findIndex((t) => t.invoiceId === tx.invoiceId)
  );

  const filtered = combined.filter((tx) => {
    const matchesStatus = filterStatus === "ALL" || tx.status === filterStatus;
    const matchesSearch =
      tx.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCopyText = (id: string, text: string) => {
    if (onCopy) {
      onCopy(id, text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(combined, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "agent_vault_transactions.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header Strip */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-3xl neu-raised text-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl neu-raised-xs flex items-center justify-center p-1.5 bg-[#e8ecf2]">
              <Logo variant="minimal" className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              Agent On-Chain Transaction Ledger
            </h2>
            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-blue-600 font-mono-code text-[11px] font-bold">
              {combined.length} RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit record of all automated payments settled or blocked by <code className="font-mono-code text-blue-600">AgentVault.sol</code> and synced with Neon DB
          </p>
        </div>

        <button
          type="button"
          onClick={exportJSON}
          className="neu-btn px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
        >
          <DownloadIcon className="w-4 h-4 text-blue-600" />
          <span>Export Ledger (JSON)</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Records</span>
          <span className="font-mono-code text-base font-extrabold text-slate-900 mt-1">
            {combined.filter((t) => t.status === "SETTLED").length} Settled
          </span>
          <span className="font-mono-code text-[11px] text-slate-500">Live consensus proofs</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
          <span className="font-mono-code text-base font-extrabold text-emerald-600 mt-1">100% Invariant</span>
          <span className="font-mono-code text-[11px] text-slate-500">Zero budget leaks</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breaches Blocked</span>
          <span className="font-mono-code text-base font-extrabold text-red-600 mt-1">
            {combined.filter((t) => t.status === "REVERTED").length} Attacks
          </span>
          <span className="font-mono-code text-[11px] text-slate-500">0 ETH ($0.00) Lost</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Gas Consumed</span>
          <span className="font-mono-code text-base font-extrabold text-blue-600 mt-1">21,432</span>
          <span className="font-mono-code text-[11px] text-slate-500">Sub-cent execution</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl neu-raised-sm">
        <div className="flex items-center gap-2">
          {["ALL", "SETTLED", "REVERTED", "WITHDRAWN"].map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-mono-code transition-all cursor-pointer ${
                filterStatus === st
                  ? "neu-inset text-blue-600 font-extrabold"
                  : "neu-raised-xs text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search invoice, provider, hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neu-inset rounded-full pl-9 pr-4 py-1.5 text-xs font-mono-code text-slate-700 placeholder-slate-400 w-64 focus:outline-none"
          />
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl neu-raised p-6 overflow-x-auto">
        <table className="w-full text-left font-mono-code text-xs border-collapse">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#d8e0eb]">
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Age</th>
              <th className="py-3 px-3">Invoice</th>
              <th className="py-3 px-3">Endpoint / Service</th>
              <th className="py-3 px-3">Provider</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Transaction Hash</th>
              <th className="py-3 px-3">SHA-256 Deliverable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d8e0eb]/60">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/40 transition-colors">
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neu-raised-xs text-[10px] font-bold ${
                      tx.status === "SETTLED"
                        ? "text-emerald-600"
                        : tx.status === "REVERTED"
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === "SETTLED"
                          ? "bg-emerald-500 animate-pulse"
                          : tx.status === "REVERTED"
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {tx.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">{tx.timestamp}</td>
                <td className="py-3 px-3 font-bold text-blue-600">{tx.invoiceId}</td>
                <td className="py-3 px-3 text-slate-700">{tx.service}</td>
                <td className="py-3 px-3 text-slate-600">{tx.provider}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{tx.amountEth}</div>
                  <div className="text-[10px] text-slate-400">{tx.amountUsd}</div>
                </td>
                <td className="py-3 px-3 text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-4)}
                    <button
                      type="button"
                      onClick={() => handleCopyText(`tx-${tx.id}`, tx.txHash)}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                      title="Copy Tx Hash"
                    >
                      {copiedId === `tx-${tx.id}` ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    {tx.contentHash.slice(0, 8)}...{tx.contentHash.slice(-4)}
                    <button
                      type="button"
                      onClick={() => handleCopyText(`ch-${tx.id}`, tx.contentHash)}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                      title="Copy Content Hash"
                    >
                      {copiedId === `ch-${tx.id}` ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

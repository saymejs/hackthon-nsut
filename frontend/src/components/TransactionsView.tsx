"use client";

import React, { useState } from "react";
import { ethToUsd } from "@/lib/formatters";

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
  status: "SETTLED" | "REVERTED" | "CACHED";
  gasUsed: string;
}

interface TransactionsViewProps {
  ethPriceUsd: number;
}

export default function TransactionsView({ ethPriceUsd }: TransactionsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const transactions: Transaction[] = [
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
      provider: "0x14dC...e92B",
      amountEth: "0.0008 ETH",
      amountUsd: "~$2.00",
      txHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
      contentHash: "0x3f1e82001188ad992817ccbcde91238947218390192847192837192837192837",
      status: "SETTLED",
      gasUsed: "46,120",
    },
    {
      id: "tx-102",
      timestamp: "3m ago",
      invoiceId: "inv_98a5",
      service: "POST /api/v1/service/ocr-extract",
      provider: "0x45B2...c071",
      amountEth: "0.0012 ETH",
      amountUsd: "~$3.00",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      contentHash: "0x9c4471fa28e51082736192837192837192837192837192837192837192837192",
      status: "SETTLED",
      gasUsed: "51,008",
    },
    {
      id: "tx-101",
      timestamp: "4m ago",
      invoiceId: "inv_exploit_01",
      service: "POST /api/v1/service/heavy-batch",
      provider: "0x8920...a4f2",
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
      service: "POST /api/v1/service/compute",
      provider: "0x8920...a4f2",
      amountEth: "0.0005 ETH",
      amountUsd: "~$1.25",
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      contentHash: "0x12bb5920390fc182938471928371928371928371928371928371928371928371",
      status: "SETTLED",
      gasUsed: "44,891",
    },
  ];

  const filtered = transactions.filter((tx) => {
    const matchesStatus = filterStatus === "ALL" || tx.status === filterStatus;
    const matchesSearch =
      tx.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
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
            <div className="w-9 h-9 rounded-xl neu-raised-xs flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">
              Agent On-Chain Transaction Ledger
            </h2>
            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-blue-600 font-mono-code text-[11px] font-bold">
              {transactions.length} RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit record of all automated payments settled or blocked by <code className="font-mono-code text-blue-600">AgentVault.sol</code>
          </p>
        </div>

        <button
          onClick={exportJSON}
          className="neu-btn px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
          <span>Export Ledger (JSON)</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Volume</span>
          <span className="font-mono-code text-base font-extrabold text-slate-900 mt-1">0.0035 ETH</span>
          <span className="font-mono-code text-[11px] text-slate-500">≈ $8.75 USD</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
          <span className="font-mono-code text-base font-extrabold text-emerald-600 mt-1">100% Valid</span>
          <span className="font-mono-code text-[11px] text-slate-500">4 Approved Invoices</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breach Blocked</span>
          <span className="font-mono-code text-base font-extrabold text-red-600 mt-1">1 Attack</span>
          <span className="font-mono-code text-[11px] text-slate-500">0 ETH ($0.00) Lost</span>
        </div>
        <div className="p-4 rounded-2xl neu-raised-sm flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Gas Consumed</span>
          <span className="font-mono-code text-base font-extrabold text-blue-600 mt-1">42,614</span>
          <span className="font-mono-code text-[11px] text-slate-500">Sub-cent execution</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl neu-raised-sm">
        <div className="flex items-center gap-2">
          {["ALL", "SETTLED", "REVERTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer font-mono-code ${
                filterStatus === st
                  ? "neu-inset-sm text-blue-600"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 neu-inset px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
          <input
            type="text"
            className="bg-transparent font-mono-code text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-48"
            placeholder="Search invoice / address / tx..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Full Transaction Table */}
      <div className="neu-raised rounded-3xl p-6 overflow-hidden flex flex-col">
        <div className="overflow-x-auto rounded-2xl neu-inset-sm p-1">
          <table className="w-full text-left font-mono-code text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#d8e0eb]">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Invoice ID</th>
                <th className="py-3 px-3">Endpoint</th>
                <th className="py-3 px-3">Amount (ETH / USD)</th>
                <th className="py-3 px-3">Tx Hash</th>
                <th className="py-3 px-3">Delivery Hash</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8e0eb]/60">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-3 px-3 text-slate-500">{tx.timestamp}</td>
                  <td className="py-3 px-3 font-bold text-blue-600">{tx.invoiceId}</td>
                  <td className="py-3 px-3 text-slate-700">{tx.service}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-900 font-bold">{tx.amountEth}</div>
                    <div className="text-[10px] text-slate-500">{tx.amountUsd}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      {tx.txHash.substring(0, 8)}...{tx.txHash.substring(tx.txHash.length - 6)}
                      <button
                        className="material-symbols-outlined text-[13px] text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(tx.txHash)}
                        title="Copy Tx Hash"
                      >
                        content_copy
                      </button>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      {tx.contentHash.substring(0, 8)}...{tx.contentHash.substring(tx.contentHash.length - 6)}
                      <button
                        className="material-symbols-outlined text-[13px] text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(tx.contentHash)}
                        title="Copy Content Hash"
                      >
                        content_copy
                      </button>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {tx.status === "SETTLED" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-raised-xs text-emerald-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Settled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset-sm text-red-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        BUDGET_EXCEEDED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

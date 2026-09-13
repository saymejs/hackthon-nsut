import { NextRequest, NextResponse } from "next/server";
import { fetchTransactions, addTransaction, clearTransactions, isNeonConfigured } from "@/lib/db";

export async function GET() {
  try {
    const transactions = await fetchTransactions();
    return NextResponse.json({
      success: true,
      database: isNeonConfigured ? "Neon Serverless Postgres" : "Local Standby Memory Store",
      count: transactions.length,
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, paymentId, providerAddress, amountEth, amountUsd, contentHash, status, gasUsed } = body;

    if (!txHash || !amountEth) {
      return NextResponse.json({ success: false, error: "Missing required fields (txHash, amountEth)" }, { status: 400 });
    }

    const newTx = await addTransaction({
      txHash,
      paymentId: paymentId || `inv_${Date.now().toString(16)}`,
      providerAddress: providerAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      amountEth,
      amountUsd: amountUsd || "~$2.50",
      contentHash: contentHash || `0x${Date.now().toString(16).padEnd(40, "0")}`,
      status: status || "Anchored On-Chain",
      gasUsed: gasUsed || "21,000",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      database: isNeonConfigured ? "Neon Serverless Postgres" : "Local Standby Memory Store",
      transaction: newTx,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearTransactions();
    return NextResponse.json({
      success: true,
      database: isNeonConfigured ? "Neon Serverless Postgres" : "Local Standby Memory Store",
      message: "Transaction history cleared successfully for new judge session",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

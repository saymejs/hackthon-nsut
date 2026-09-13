import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { saveInvoice, getInvoice } from "@/lib/db";

export const dynamic = "force-dynamic";

// In-memory cache for idempotency and replay checks
const memoryCache: Record<string, any> = {};
const redeemedTxHashes: Record<string, string> = {};

const PROVIDER_WALLET = process.env.PROVIDER_WALLET || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const SERVICE_PRICE_WEI = process.env.SERVICE_PRICE_WEI || "1000000000000000"; // 0.001 ETH
const SERVICE_PRICE_ETH = "0.001";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337", 10);

export async function POST(req: NextRequest) {
  const xPaymentId = req.headers.get("x-payment-id");
  const xPaymentTxHash = req.headers.get("x-payment-txhash");
  const xAmountEth = req.headers.get("x-amount-eth");

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestedEth = body.amountEth || xAmountEth || SERVICE_PRICE_ETH;
  const numEth = parseFloat(requestedEth) || 0.001;
  const amountEth = numEth.toFixed(4);
  const amountWei = (BigInt(Math.floor(numEth * 1e18))).toString();

  // 1. Missing payment proof -> Return HTTP 402 Payment Required
  if (!xPaymentId || !xPaymentTxHash) {
    const paymentId = `inv_${crypto.randomUUID().slice(0, 8)}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const nonce = Math.floor(Math.random() * 100000);

    const inv = {
      paymentId,
      recipient: PROVIDER_WALLET,
      amountWei,
      amountEth,
      status: "UNPAID",
      expiresAt,
      nonce,
      createdAt: new Date().toISOString(),
    };

    await saveInvoice(inv);

    return NextResponse.json(
      {
        status: 402,
        error: "Payment Required",
        protocol: "x402",
        version: "1.0",
        invoice: {
          paymentId,
          recipient: PROVIDER_WALLET,
          amountWei,
          amountEth,
          chainId: CHAIN_ID,
          serviceEndpoint: "/api/service/compute",
          expiresAt,
          nonce,
        },
      },
      {
        status: 402,
        headers: {
          "WWW-Authenticate": 'x402 protocol="x402", token="ETH"',
        },
      }
    );
  }

  // 2. Idempotent hit (already fulfilled) - Double charge / reconnection protection
  if (memoryCache[xPaymentId]) {
    const record = memoryCache[xPaymentId];
    return NextResponse.json(
      {
        status: 200,
        paymentId: xPaymentId,
        delivered: true,
        idempotencyHit: true,
        result: record.result,
        contentHash: record.contentHash,
        deliveredAt: record.deliveredAt,
      },
      { status: 200 }
    );
  }

  // 3. Replay attack check
  const cleanTx = xPaymentTxHash.toLowerCase();
  if (redeemedTxHashes[cleanTx] && redeemedTxHashes[cleanTx] !== xPaymentId) {
    return NextResponse.json(
      { error: "REPLAY_DETECTED: Transaction hash already used for a different invoice" },
      { status: 400 }
    );
  }

  // 4. Compute deliverable & generate SHA-256 hash
  const workload = body.workloadUnits || 50;
  const taskType = body.taskType || "matrix_multiplication";

  const computedOutput = {
    taskType,
    workloadUnits: workload,
    amountEth,
    matrixResultStream: [0.981, 0.441, 0.119, 0.762, 0.334],
    executionNode: "stitch-serverless-compute-402",
    executionTimeMs: 14,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const serialized = JSON.stringify(computedOutput, Object.keys(computedOutput).sort());
  const contentHash = `0x${crypto.createHash("sha256").update(serialized).digest("hex")}`;
  const deliveredAt = Math.floor(Date.now() / 1000);

  memoryCache[xPaymentId] = {
    result: computedOutput,
    contentHash,
    deliveredAt,
  };
  redeemedTxHashes[cleanTx] = xPaymentId;

  // Mark invoice fulfilled in DB
  const existingInv = await getInvoice(xPaymentId);
  if (existingInv) {
    await saveInvoice({ ...existingInv, status: "FULFILLED" });
  }

  return NextResponse.json(
    {
      status: 200,
      paymentId: xPaymentId,
      delivered: true,
      idempotencyHit: false,
      result: computedOutput,
      contentHash,
      deliveredAt,
    },
    {
      status: 200,
      headers: {
        "X-Content-Hash": contentHash,
      },
    }
  );
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    providerWallet: PROVIDER_WALLET,
    servicePriceEth: SERVICE_PRICE_ETH,
    servicePriceWei: SERVICE_PRICE_WEI,
  });
}

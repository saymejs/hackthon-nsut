import { NextRequest, NextResponse } from "next/server";
import { fetchSubAgents, triggerZombieLockout, DbSubAgent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const subAgents = await fetchSubAgents();
  const now = Math.floor(Date.now() / 1000);

  // Check how many are active vs expired
  const enriched = subAgents.map((s) => ({
    ...s,
    secondsRemaining: Math.max(0, s.expiresAt - now),
    isZombieRisk: s.status === "ACTIVE" && s.expiresAt <= now,
  }));

  return NextResponse.json({
    success: true,
    count: enriched.length,
    activeCount: enriched.filter((s) => s.status === "ACTIVE" && s.secondsRemaining > 0).length,
    subAgents: enriched,
    protocolRule: "Time-Decaying Budget: Sub-agent allowances automatically self-destruct upon TTL expiry.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "lockout";

    if (action === "lockout" || action === "simulate_crash") {
      const result = await triggerZombieLockout();
      return NextResponse.json({
        success: true,
        action: "ZOMBIE_AUTO_SEAL_ENFORCED",
        lockedCount: result.lockedCount,
        subAgents: result.subAgents,
        zeroEthDrained: true,
        message: "Orchestrator disconnect simulated. Smart vault successfully sealed all sub-agent permissions.",
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "reset") {
      const now = Math.floor(Date.now() / 1000);
      const resetAgents = [
        {
          id: 1,
          name: "Worker-Scraper-01",
          parentAgent: "Orchestrator-Main",
          walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
          spendAllowanceEth: "0.0100",
          spentEth: "0.0020",
          expiresAt: now + 300,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Worker-GPUSolver-02",
          parentAgent: "Orchestrator-Main",
          walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
          spendAllowanceEth: "0.0150",
          spentEth: "0.0010",
          expiresAt: now + 420,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: "Worker-Indexer-03",
          parentAgent: "Orchestrator-Main",
          walletAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
          spendAllowanceEth: "0.0050",
          spentEth: "0.0000",
          expiresAt: now + 180,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
      ];
      return NextResponse.json({
        success: true,
        action: "RESET_COMPLETE",
        subAgents: resetAgents,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

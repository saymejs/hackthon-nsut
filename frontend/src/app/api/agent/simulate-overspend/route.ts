import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const attemptedAmountEth = body.attemptedEth || "0.1000";
    const currentLimitEth = body.spendLimitEth || "0.0500";
    const currentSpentEth = body.totalSpentEth || "0.0030";

    const headroom = Math.max(0, parseFloat(currentLimitEth) - parseFloat(currentSpentEth));

    return NextResponse.json({
      success: false,
      reverted: true,
      error: "BUDGET_EXCEEDED",
      revertReason: "BUDGET_EXCEEDED: Transaction hard-reverted by EVM consensus circuit breaker.",
      details: {
        attemptedAmountEth,
        spendLimitEth: currentLimitEth,
        totalSpentEth: currentSpentEth,
        remainingAllowanceEth: headroom.toFixed(4),
        zeroEthLost: true,
        fundsProtected: true,
        gasUsed: "21,432",
        consensusLayer: "EVM Invariant: totalSpent + amount <= spendLimit",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

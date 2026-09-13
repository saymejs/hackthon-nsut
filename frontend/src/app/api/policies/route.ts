import { NextRequest, NextResponse } from "next/server";
import { fetchPolicies, savePolicies, isNeonConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const policies = await fetchPolicies();
    return NextResponse.json({
      success: true,
      database: isNeonConfigured ? "Neon Serverless Postgres" : "Local Standby Memory Store",
      policies,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await savePolicies(body);
    return NextResponse.json({
      success: true,
      database: isNeonConfigured ? "Neon Serverless Postgres" : "Local Standby Memory Store",
      policies: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

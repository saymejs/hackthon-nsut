import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, role, walletAddress } = body;

    if (!email || !username) {
      return NextResponse.json(
        { error: "Email and username are required" },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const { user, wallet } = await createUser({
      email,
      username,
      passwordHash: password || "judge_pass",
      role: role || "judge",
      walletAddress,
    });

    return NextResponse.json({
      success: true,
      user,
      wallet,
      message: "Judge / User account created successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

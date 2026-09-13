import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, fetchUserWallets } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to sign in" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Please sign up to create a judge session." },
        { status: 404 }
      );
    }

    const wallets = await fetchUserWallets(user.id);
    const primaryWallet = wallets[0] || {
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      balanceEth: "0.8500",
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      wallet: primaryWallet,
      message: `Welcome back, ${user.username}!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Sign in failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDbClient, isNeonConfigured } from "@/lib/db";

export async function GET() {
  if (!isNeonConfigured) {
    return NextResponse.json({
      configured: false,
      status: "standby",
      message: "Neon Postgres is in local demo mode. To connect live serverless Neon DB, add DATABASE_URL=postgres://... in .env.local.",
    });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({
      configured: false,
      status: "error",
      message: "Failed to initialize Neon SQL client.",
    }, { status: 500 });
  }

  try {
    // Execute DDL for schema initialization
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(64) UNIQUE NOT NULL,
        recipient VARCHAR(64) NOT NULL,
        amount_wei NUMERIC(78, 0) NOT NULL,
        amount_eth VARCHAR(32) NOT NULL,
        chain_id INTEGER DEFAULT 31337,
        service_endpoint VARCHAR(255) DEFAULT '/api/service/compute',
        status VARCHAR(32) DEFAULT 'UNPAID',
        expires_at BIGINT NOT NULL,
        nonce BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        tx_hash VARCHAR(66) UNIQUE NOT NULL,
        payment_id VARCHAR(64),
        provider_address VARCHAR(64) NOT NULL,
        amount_eth VARCHAR(32) NOT NULL,
        amount_usd VARCHAR(32) NOT NULL,
        content_hash VARCHAR(66) NOT NULL,
        status VARCHAR(32) DEFAULT 'Anchored On-Chain',
        gas_used VARCHAR(32) DEFAULT '21,000',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_policies (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(64) NOT NULL,
        whitelist_enabled BOOLEAN DEFAULT TRUE,
        circuit_breaker_enabled BOOLEAN DEFAULT TRUE,
        idempotency_strict BOOLEAN DEFAULT TRUE,
        eip712_only BOOLEAN DEFAULT TRUE,
        daily_spend_limit_eth VARCHAR(32) DEFAULT '0.0500',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({
      configured: true,
      status: "connected",
      message: "Neon PostgreSQL tables initialized successfully (invoices, transactions, agent_policies).",
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      status: "query_error",
      error: err.message,
    }, { status: 500 });
  }
}

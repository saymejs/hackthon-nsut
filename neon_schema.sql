-- ============================================================================
-- Agent SafePay (W3A-1) Neon Serverless PostgreSQL Database Schema
-- Recommended Tables for Real-Time Machine Payments, Invoices, & Policy Guard
-- ============================================================================

-- 1. Invoices Table: Tracks HTTP 402 payment challenges and expiration
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(64) UNIQUE NOT NULL,
    recipient VARCHAR(64) NOT NULL,
    amount_wei NUMERIC(78, 0) NOT NULL,
    amount_eth VARCHAR(32) NOT NULL,
    chain_id INTEGER DEFAULT 31337,
    service_endpoint VARCHAR(255) DEFAULT '/api/service/compute',
    status VARCHAR(32) DEFAULT 'UNPAID', -- 'UNPAID', 'SETTLED', 'FULFILLED', 'EXPIRED'
    expires_at BIGINT NOT NULL,
    nonce BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 2. Transactions Table: On-chain settlements verified against AgentVault.sol
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

CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 3. Audit Attestations: Proof-of-delivery cryptographic records & Merkle roots
CREATE TABLE IF NOT EXISTS audit_attestations (
    id SERIAL PRIMARY KEY,
    epoch_root VARCHAR(66) NOT NULL,
    content_hash VARCHAR(66) NOT NULL,
    delivery_payload JSONB,
    signature VARCHAR(132),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Agent Policies: Runtime security parameters and circuit breaker settings
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

-- 5. Node Telemetry: Streaming execution logs and security alerts
CREATE TABLE IF NOT EXISTS node_telemetry (
    id SERIAL PRIMARY KEY,
    level VARCHAR(16) DEFAULT 'INFO', -- 'INFO', 'WARN', 'CRITICAL', 'ALERT'
    source VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON node_telemetry(created_at DESC);

-- Seed initial default policy if empty
INSERT INTO agent_policies (wallet_address, whitelist_enabled, circuit_breaker_enabled, idempotency_strict, eip712_only)
SELECT '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM agent_policies WHERE wallet_address = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');

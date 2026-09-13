import { neon } from "@neondatabase/serverless";

// Determine database connection string
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

export const isNeonConfigured = Boolean(DATABASE_URL && DATABASE_URL.startsWith("postgres"));

// Lazy-initialized SQL client
let sqlClient: ReturnType<typeof neon> | null = null;

export function getDbClient() {
  if (!isNeonConfigured) return null;
  if (!sqlClient) {
    try {
      sqlClient = neon(DATABASE_URL);
    } catch (err) {
      console.warn("Neon initialization warning:", err);
      return null;
    }
  }
  return sqlClient;
}

// ----------------------------------------------------------------------------
// In-Memory Fallback Store (Ensures 100% functionality when offline / demo)
// ----------------------------------------------------------------------------

export interface DbTransaction {
  id: string | number;
  txHash: string;
  paymentId: string;
  providerAddress: string;
  amountEth: string;
  amountUsd: string;
  contentHash: string;
  status: string;
  gasUsed: string;
  createdAt: string;
}

export interface DbPolicy {
  walletAddress: string;
  whitelistEnabled: boolean;
  circuitBreakerEnabled: boolean;
  idempotencyStrict: boolean;
  eip712Only: boolean;
  dailySpendLimitEth: string;
  updatedAt: string;
}

export interface DbInvoice {
  paymentId: string;
  recipient: string;
  amountWei: string;
  amountEth: string;
  status: string;
  expiresAt: number;
  nonce: number;
  createdAt: string;
}

let memoryTransactions: DbTransaction[] = [
  {
    id: 1,
    txHash: "0x4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123",
    paymentId: "inv_98a7",
    providerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    amountEth: "0.0010 ETH",
    amountUsd: "~$2.50",
    contentHash: "0xa6c9b3d142e88a09f51176b98e72c84ef3381ad7",
    status: "Anchored On-Chain",
    gasUsed: "21,432",
    createdAt: new Date(Date.now() - 12000).toISOString(),
  },
  {
    id: 2,
    txHash: "0x12b489adcf789456123456789abcdef0123456789abcdef0123456789abcdef0",
    paymentId: "inv_98a6",
    providerAddress: "0x14dC79964da2c08b23698B3D3cc7Ca32193d9955",
    amountEth: "0.0008 ETH",
    amountUsd: "~$2.00",
    contentHash: "0x3f1e78891244abce5678901234567890abcdef12",
    status: "Anchored On-Chain",
    gasUsed: "21,120",
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 3,
    txHash: "0x99a8bc45d2e0123456789abcdef0123456789abcdef0123456789abcdef01234",
    paymentId: "inv_98a5",
    providerAddress: "0x45B25987140f7b03b3E21b44B29BEfA0F11C8242",
    amountEth: "0.0012 ETH",
    amountUsd: "~$3.00",
    contentHash: "0x9c44567812034981adbcdef0123456789abcdef0",
    status: "Anchored On-Chain",
    gasUsed: "22,045",
    createdAt: new Date(Date.now() - 180000).toISOString(),
  },
];

let memoryPolicies: DbPolicy = {
  walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  whitelistEnabled: true,
  circuitBreakerEnabled: true,
  idempotencyStrict: true,
  eip712Only: true,
  dailySpendLimitEth: "0.0500",
  updatedAt: new Date().toISOString(),
};

let memoryInvoices: Record<string, DbInvoice> = {};

// ----------------------------------------------------------------------------
// Database Operations (Neon with Automatic Fallback)
// ----------------------------------------------------------------------------

export async function fetchTransactions(): Promise<DbTransaction[]> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          id, 
          tx_hash AS "txHash", 
          payment_id AS "paymentId", 
          provider_address AS "providerAddress", 
          amount_eth AS "amountEth", 
          amount_usd AS "amountUsd", 
          content_hash AS "contentHash", 
          status, 
          gas_used AS "gasUsed", 
          created_at AS "createdAt"
        FROM transactions 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      const list = rows as any[];
      if (Array.isArray(list) && list.length > 0) {
        return list as DbTransaction[];
      }
    } catch (err) {
      console.warn("Neon fetchTransactions query fallback:", err);
    }
  }
  return memoryTransactions;
}

export async function addTransaction(tx: Omit<DbTransaction, "id">): Promise<DbTransaction> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO transactions (
          tx_hash, payment_id, provider_address, amount_eth, amount_usd, content_hash, status, gas_used
        ) VALUES (
          ${tx.txHash}, ${tx.paymentId}, ${tx.providerAddress}, ${tx.amountEth}, ${tx.amountUsd}, ${tx.contentHash}, ${tx.status}, ${tx.gasUsed}
        )
        RETURNING 
          id, 
          tx_hash AS "txHash", 
          payment_id AS "paymentId", 
          provider_address AS "providerAddress", 
          amount_eth AS "amountEth", 
          amount_usd AS "amountUsd", 
          content_hash AS "contentHash", 
          status, 
          gas_used AS "gasUsed", 
          created_at AS "createdAt"
      `;
      const list = rows as any[];
      if (Array.isArray(list) && list.length > 0) {
        const newRecord = list[0] as DbTransaction;
        memoryTransactions = [newRecord, ...memoryTransactions];
        return newRecord;
      }
    } catch (err) {
      console.warn("Neon addTransaction fallback:", err);
    }
  }

  const newRecord: DbTransaction = {
    id: Date.now(),
    ...tx,
  };
  memoryTransactions = [newRecord, ...memoryTransactions];
  return newRecord;
}

export async function fetchPolicies(): Promise<DbPolicy> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          wallet_address AS "walletAddress",
          whitelist_enabled AS "whitelistEnabled",
          circuit_breaker_enabled AS "circuitBreakerEnabled",
          idempotency_strict AS "idempotencyStrict",
          eip712_only AS "eip712Only",
          daily_spend_limit_eth AS "dailySpendLimitEth",
          updated_at AS "updatedAt"
        FROM agent_policies
        LIMIT 1
      `;
      const list = rows as any[];
      if (Array.isArray(list) && list.length > 0) {
        return list[0] as DbPolicy;
      }
    } catch (err) {
      console.warn("Neon fetchPolicies fallback:", err);
    }
  }
  return memoryPolicies;
}

export async function savePolicies(p: Partial<DbPolicy>): Promise<DbPolicy> {
  memoryPolicies = {
    ...memoryPolicies,
    ...p,
    updatedAt: new Date().toISOString(),
  };

  const sql = getDbClient();
  if (sql) {
    try {
      await sql`
        UPDATE agent_policies
        SET 
          whitelist_enabled = ${memoryPolicies.whitelistEnabled},
          circuit_breaker_enabled = ${memoryPolicies.circuitBreakerEnabled},
          idempotency_strict = ${memoryPolicies.idempotencyStrict},
          eip712_only = ${memoryPolicies.eip712Only},
          updated_at = NOW()
        WHERE wallet_address = ${memoryPolicies.walletAddress}
      `;
    } catch (err) {
      console.warn("Neon savePolicies fallback:", err);
    }
  }
  return memoryPolicies;
}

export async function saveInvoice(inv: DbInvoice): Promise<void> {
  memoryInvoices[inv.paymentId] = inv;
  const sql = getDbClient();
  if (sql) {
    try {
      await sql`
        INSERT INTO invoices (
          payment_id, recipient, amount_wei, amount_eth, status, expires_at, nonce
        ) VALUES (
          ${inv.paymentId}, ${inv.recipient}, ${inv.amountWei}, ${inv.amountEth}, ${inv.status}, ${inv.expiresAt}, ${inv.nonce}
        )
        ON CONFLICT (payment_id) DO UPDATE SET status = EXCLUDED.status
      `;
    } catch (err) {
      console.warn("Neon saveInvoice fallback:", err);
    }
  }
}

export async function getInvoice(paymentId: string): Promise<DbInvoice | null> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          payment_id AS "paymentId",
          recipient,
          amount_wei AS "amountWei",
          amount_eth AS "amountEth",
          status,
          expires_at AS "expiresAt",
          nonce,
          created_at AS "createdAt"
        FROM invoices
        WHERE payment_id = ${paymentId}
      `;
      const list = rows as any[];
      if (Array.isArray(list) && list.length > 0) {
        return list[0] as DbInvoice;
      }
    } catch (err) {
      console.warn("Neon getInvoice fallback:", err);
    }
  }
  return memoryInvoices[paymentId] || null;
}

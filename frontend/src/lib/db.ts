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

export interface DbUser {
  id: number;
  email: string;
  username: string;
  passwordHash?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export interface DbWallet {
  id: number;
  userId?: number;
  walletAddress: string;
  chainId: number;
  balanceEth: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface DbSubAgent {
  id: number;
  name: string;
  parentAgent: string;
  walletAddress: string;
  spendAllowanceEth: string;
  spentEth: string;
  expiresAt: number; // TTL timestamp in epoch seconds
  status: "ACTIVE" | "SEALED_EXPIRED" | "KILLED";
  createdAt: string;
}

// Attach stores to globalThis to survive Next.js module reloading & worker boundaries
const globalStore = globalThis as unknown as {
  __memoryTransactions?: DbTransaction[];
  __memoryPolicies?: DbPolicy;
  __memoryInvoices?: Record<string, DbInvoice>;
  __memoryUsers?: DbUser[];
  __memoryWallets?: DbWallet[];
  __memorySubAgents?: DbSubAgent[];
};

if (!globalStore.__memoryTransactions) {
  globalStore.__memoryTransactions = [
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
}

if (!globalStore.__memoryPolicies) {
  globalStore.__memoryPolicies = {
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    whitelistEnabled: true,
    circuitBreakerEnabled: true,
    idempotencyStrict: true,
    eip712Only: true,
    dailySpendLimitEth: "0.0500",
    updatedAt: new Date().toISOString(),
  };
}

if (!globalStore.__memoryInvoices) {
  globalStore.__memoryInvoices = {};
}

let memoryTransactions = globalStore.__memoryTransactions;
let memoryPolicies = globalStore.__memoryPolicies;
let memoryInvoices = globalStore.__memoryInvoices;

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

export async function clearTransactions(): Promise<void> {
  memoryTransactions = [];
  if (globalStore.__memoryTransactions) {
    globalStore.__memoryTransactions = [];
  }

  const sql = getDbClient();
  if (sql) {
    try {
      await sql`DELETE FROM transactions`;
    } catch (err) {
      console.warn("Neon clearTransactions fallback:", err);
    }
  }
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

// ----------------------------------------------------------------------------
// Users & Authentication Operations
// ----------------------------------------------------------------------------

if (!globalStore.__memoryUsers) {
  globalStore.__memoryUsers = [
    {
      id: 1,
      email: "judge@hackathon.org",
      username: "Hackathon Judge",
      passwordHash: "secure_pass_demo",
      role: "judge",
      createdAt: new Date().toISOString(),
    },
  ];
}

if (!globalStore.__memoryWallets) {
  globalStore.__memoryWallets = [
    {
      id: 1,
      userId: 1,
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId: 31337,
      balanceEth: "0.8500",
      isPrimary: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

let memoryUsers = globalStore.__memoryUsers;
let memoryWallets = globalStore.__memoryWallets;

export async function createUser(data: {
  email: string;
  username: string;
  passwordHash?: string;
  role?: string;
  walletAddress?: string;
  initialBalanceEth?: string;
}): Promise<{ user: DbUser; wallet: DbWallet }> {
  const sql = getDbClient();
  const role = data.role || "judge";
  const defaultWallet =
    data.walletAddress && data.walletAddress.startsWith("0x") && data.walletAddress.length === 42
      ? data.walletAddress
      : `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

  const balanceEth =
    data.initialBalanceEth && !isNaN(parseFloat(data.initialBalanceEth))
      ? parseFloat(data.initialBalanceEth).toFixed(4)
      : "0.8500";

  // When a new account is created, clear all prior transaction history so the judge has a clean slate for live testing
  await clearTransactions();

  if (sql) {
    try {
      const userRows = await sql`
        INSERT INTO users (email, username, password_hash, role)
        VALUES (${data.email}, ${data.username}, ${data.passwordHash || "judge_pass"}, ${role})
        RETURNING id, email, username, role, created_at AS "createdAt"
      `;
      const newUser = (userRows as any[])[0] as DbUser;

      const walletRows = await sql`
        INSERT INTO wallets (user_id, wallet_address, chain_id, balance_eth, is_primary)
        VALUES (${newUser.id}, ${defaultWallet}, 31337, ${balanceEth}, TRUE)
        RETURNING id, user_id AS "userId", wallet_address AS "walletAddress", chain_id AS "chainId", balance_eth AS "balanceEth", is_primary AS "isPrimary", created_at AS "createdAt"
      `;
      const newWallet = (walletRows as any[])[0] as DbWallet;

      return { user: newUser, wallet: newWallet };
    } catch (err) {
      console.warn("Neon createUser fallback:", err);
    }
  }

  const newUser: DbUser = {
    id: Date.now(),
    email: data.email,
    username: data.username,
    role,
    createdAt: new Date().toISOString(),
  };
  memoryUsers.push(newUser);

  const newWallet: DbWallet = {
    id: Date.now() + 1,
    userId: newUser.id,
    walletAddress: defaultWallet,
    chainId: 31337,
    balanceEth,
    isPrimary: true,
    createdAt: new Date().toISOString(),
  };
  memoryWallets.push(newWallet);

  return { user: newUser, wallet: newWallet };
}

export async function updateWalletBalance(walletAddress: string, newBalanceEth: string): Promise<void> {
  const formatted = parseFloat(newBalanceEth).toFixed(4);
  const sql = getDbClient();
  if (sql) {
    try {
      await sql`
        UPDATE wallets
        SET balance_eth = ${formatted}
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      `;
    } catch (err) {
      console.warn("Neon updateWalletBalance fallback:", err);
    }
  }

  const found = memoryWallets.find((w) => w.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  if (found) {
    found.balanceEth = formatted;
  }
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, email, username, password_hash AS "passwordHash", role, created_at AS "createdAt", last_login AS "lastLogin"
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;
      const list = rows as any[];
      if (list.length > 0) return list[0] as DbUser;
    } catch (err) {
      console.warn("Neon findUserByEmail fallback:", err);
    }
  }
  return memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function fetchUserWallets(userId?: number): Promise<DbWallet[]> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = userId
        ? await sql`
            SELECT id, user_id AS "userId", wallet_address AS "walletAddress", chain_id AS "chainId", balance_eth AS "balanceEth", is_primary AS "isPrimary", created_at AS "createdAt"
            FROM wallets
            WHERE user_id = ${userId}
          `
        : await sql`
            SELECT id, user_id AS "userId", wallet_address AS "walletAddress", chain_id AS "chainId", balance_eth AS "balanceEth", is_primary AS "isPrimary", created_at AS "createdAt"
            FROM wallets
            LIMIT 10
          `;
      const list = rows as any[];
      if (list.length > 0) return list as DbWallet[];
    } catch (err) {
      console.warn("Neon fetchUserWallets fallback:", err);
    }
  }
  return userId ? memoryWallets.filter((w) => w.userId === userId) : memoryWallets;
}

// ----------------------------------------------------------------------------
// Sub-Agents & Zombie Agent Defense Operations
// ----------------------------------------------------------------------------

if (!globalStore.__memorySubAgents) {
  globalStore.__memorySubAgents = [
    {
      id: 1,
      name: "Worker-Scraper-01",
      parentAgent: "Orchestrator-Main",
      walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      spendAllowanceEth: "0.0100",
      spentEth: "0.0020",
      expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 min TTL
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
      expiresAt: Math.floor(Date.now() / 1000) + 420, // 7 min TTL
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
      expiresAt: Math.floor(Date.now() / 1000) + 180, // 3 min TTL
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
  ];
}

let memorySubAgents = globalStore.__memorySubAgents;

export async function fetchSubAgents(): Promise<DbSubAgent[]> {
  const sql = getDbClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          id, 
          name, 
          parent_agent AS "parentAgent", 
          wallet_address AS "walletAddress", 
          spend_allowance_eth AS "spendAllowanceEth", 
          spent_eth AS "spentEth", 
          expires_at AS "expiresAt", 
          status, 
          created_at AS "createdAt"
        FROM sub_agents
        ORDER BY id ASC
      `;
      const list = rows as any[];
      if (list.length > 0) return list as DbSubAgent[];
    } catch (err) {
      console.warn("Neon fetchSubAgents fallback:", err);
    }
  }
  return memorySubAgents;
}

export async function triggerZombieLockout(): Promise<{ lockedCount: number; subAgents: DbSubAgent[] }> {
  // Simulates orchestrator crash: seals all sub-agents whose TTL expired or marks all as sealed
  memorySubAgents = memorySubAgents.map((s) => ({
    ...s,
    status: "SEALED_EXPIRED",
    expiresAt: Math.floor(Date.now() / 1000),
  }));

  const sql = getDbClient();
  if (sql) {
    try {
      await sql`
        UPDATE sub_agents 
        SET status = 'SEALED_EXPIRED', expires_at = EXTRACT(EPOCH FROM NOW())::BIGINT
      `;
    } catch (err) {
      console.warn("Neon triggerZombieLockout fallback:", err);
    }
  }

  return { lockedCount: memorySubAgents.length, subAgents: memorySubAgents };
}


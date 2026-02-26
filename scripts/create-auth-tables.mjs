/**
 * Creates Better Auth tables via Neon HTTP API (no WebSocket needed).
 * Run: node scripts/create-auth-tables.mjs
 */
import { readFileSync } from 'fs';

// Parse .env.local manually
const envLocal = readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATABASE_URL=([^\n]+)/);
const DATABASE_URL = match?.[1]?.trim();

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Convert pooler URL to HTTP API endpoint
// postgresql://user:pass@host/db → https://host/sql
const url = new URL(DATABASE_URL.replace('postgresql://', 'https://').replace(/\?.*$/, ''));
const [user, password] = DATABASE_URL.match(/\/\/([^:]+):([^@]+)@/)?.[1]
  ? [DATABASE_URL.match(/\/\/([^:]+):/)?.[1], DATABASE_URL.match(/:([^@]+)@/)?.[1]]
  : [null, null];

const host = url.hostname;
const dbname = url.pathname.replace('/', '');

// Neon HTTP API
const apiUrl = `https://${host}/sql`;
const authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');

const statements = [
  `CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
  )`,
];

for (const sql of statements) {
  const tableName = sql.match(/TABLE IF NOT EXISTS "?(\w+)"?/)?.[1];
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Neon-Connection-String': DATABASE_URL,
      },
      body: JSON.stringify({ query: sql }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`✗ ${tableName}:`, data);
    } else {
      console.log(`✓ ${tableName} table ready`);
    }
  } catch (e) {
    console.error(`✗ ${tableName}:`, e.message);
  }
}

console.log('Done.');

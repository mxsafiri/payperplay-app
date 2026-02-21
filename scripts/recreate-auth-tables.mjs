import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  console.log('✓ user table');

  await sql`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "expiresAt" TIMESTAMP,
      password TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  console.log('✓ account table');

  await sql`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMP NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      token TEXT UNIQUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  console.log('✓ session table');

  await sql`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  console.log('✓ verification table');

  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user','account','session','verification')`;
  console.log('All Better Auth tables recreated:', tables.map(t => t.tablename));
}

run().catch(console.error);

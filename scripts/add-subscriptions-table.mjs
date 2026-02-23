import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    // 1. Create the enum (IF NOT EXISTS)
    await sql`
      DO $$ BEGIN
        CREATE TYPE sub_status AS ENUM ('trial', 'active', 'grace', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ sub_status enum created (or already exists)');

    // 2. Create the table (IF NOT EXISTS) — no existing data is touched
    await sql`
      CREATE TABLE IF NOT EXISTS platform_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        status sub_status NOT NULL DEFAULT 'trial',
        starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        grace_ends_at TIMESTAMP,
        trial_used BOOLEAN NOT NULL DEFAULT false,
        payment_intent_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ platform_subscriptions table created (or already exists)');

    // 3. Create indexes (IF NOT EXISTS)
    await sql`CREATE INDEX IF NOT EXISTS platform_sub_profile_id_idx ON platform_subscriptions(profile_id);`;
    await sql`CREATE INDEX IF NOT EXISTS platform_sub_status_idx ON platform_subscriptions(status);`;
    await sql`CREATE INDEX IF NOT EXISTS platform_sub_expires_at_idx ON platform_subscriptions(expires_at);`;
    console.log('✅ Indexes created');

    console.log('\n🎉 Migration complete — no existing data was modified.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

migrate();

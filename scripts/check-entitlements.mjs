import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Find the pending payment intent for the Snippe reference
const pis = await sql`SELECT id, user_id, content_id, amount_tzs, status, provider_reference FROM payment_intents WHERE status = 'pending'`;
console.log('Pending payment intents:', pis.length);

for (const pi of pis) {
  console.log(`  PI: ${pi.id} status=${pi.status} amount=${pi.amount_tzs} ref=${pi.provider_reference}`);
  
  // Mark as paid
  await sql`UPDATE payment_intents SET status = 'paid', paid_at = NOW() WHERE id = ${pi.id}`;
  console.log(`  -> Marked as paid`);
  
  // Check if entitlement exists
  const existing = await sql`SELECT id FROM entitlements WHERE user_id = ${pi.user_id} AND content_id = ${pi.content_id}`;
  if (existing.length === 0) {
    await sql`INSERT INTO entitlements (user_id, content_id, payment_intent_id) VALUES (${pi.user_id}, ${pi.content_id}, ${pi.id})`;
    console.log(`  -> Entitlement granted`);
  } else {
    console.log(`  -> Entitlement already exists`);
  }

  // Credit creator wallet
  const content = await sql`SELECT creator_id, title FROM content WHERE id = ${pi.content_id}`;
  if (content.length > 0) {
    const creatorId = content[0].creator_id;
    const platformFee = Math.round(pi.amount_tzs * 0.15);
    const creatorEarning = pi.amount_tzs - platformFee;
    
    const wallet = await sql`SELECT id, balance FROM creator_wallets WHERE creator_id = ${creatorId}`;
    if (wallet.length > 0) {
      const newBalance = wallet[0].balance + creatorEarning;
      await sql`UPDATE creator_wallets SET balance = ${newBalance}, total_earned = total_earned + ${creatorEarning}, updated_at = NOW() WHERE id = ${wallet[0].id}`;
      
      // Earning transaction
      await sql`INSERT INTO wallet_transactions (wallet_id, type, status, amount, balance_after, description, reference_type, reference_id) VALUES (${wallet[0].id}, 'earning', 'completed', ${creatorEarning}, ${newBalance}, ${'Sale: ' + content[0].title}, 'payment', ${pi.id})`;
      
      // Fee transaction
      await sql`INSERT INTO wallet_transactions (wallet_id, type, status, amount, balance_after, description, reference_type, reference_id) VALUES (${wallet[0].id}, 'fee', 'completed', ${-platformFee}, ${newBalance}, ${'Platform fee (15%): ' + content[0].title}, 'payment', ${pi.id})`;
      
      console.log(`  -> Creator wallet credited: +${creatorEarning} TZS (fee: ${platformFee})`);
    }
  }
}

console.log('\nDone!');

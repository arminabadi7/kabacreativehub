/**
 * Test direct transaction query to see what's in the database
 */

import { db } from './server/db.js';
import { affiliateTransactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from './server/storage.js';

async function test() {
  const affiliate = await storage.getAffiliateByUsername('mojgan');
  if (!affiliate) {
    console.log('Mojgan not found');
    process.exit(0);
  }
  
  console.log('Direct DB query for transactions:');
  const tx = await db.select().from(affiliateTransactions).where(eq(affiliateTransactions.affiliateId, affiliate.id));
  console.log(`Transactions found: ${tx.length}`);
  
  tx.forEach((t, idx) => {
    console.log(`  ${idx + 1}. ID: ${t.id}`);
    console.log(`     Amount: ${t.amount} cents = $${((t.amount || 0) / 100).toFixed(2)}`);
    console.log(`     Status: "${t.status}" (type: ${typeof t.status})`);
    console.log(`     Description: ${t.description || 'N/A'}`);
    console.log('');
  });
  
  const paid = tx.filter(t => String(t.status || '').toLowerCase().trim() === 'paid');
  console.log(`Paid transactions: ${paid.length}`);
  const total = paid.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  console.log(`Total Paid: ${total} cents = $${(total / 100).toFixed(2)}`);
  
  if (total === 175000) {
    console.log('\n⚠️  WARNING: Total is exactly $1,750.00 (Domination commission)!');
    console.log('   This suggests we might be counting wrong transactions or using wrong data source!');
  }
  
  process.exit(0);
}

test();







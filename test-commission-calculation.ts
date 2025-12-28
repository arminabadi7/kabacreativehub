/**
 * Test to see if commissionPaid flags are being used instead of transactions
 */

import { storage } from './server/storage.js';

async function test() {
  const affiliate = await storage.getAffiliateByUsername('mojgan');
  if (!affiliate) {
    console.log('Mojgan not found');
    process.exit(0);
  }
  
  // Test what getAffiliateCommissionStats returns
  const stats = await storage.getAffiliateCommissionStats(affiliate.id);
  console.log('getAffiliateCommissionStats result:');
  console.log({
    currentBalance: `$${(stats.currentBalance / 100).toFixed(2)}`,
    totalEarned: `$${(stats.totalEarned / 100).toFixed(2)}`,
    totalPaid: `$${(stats.totalPaid / 100).toFixed(2)}`,
  });
  
  // Check if maybe it's calculating from commissionPaid flags
  const allBookings = await storage.getBookings();
  const mojganBookings = allBookings.filter(
    (b) => b.affiliateUsername?.toLowerCase() === 'mojgan' && b.saleStatus === 'sold'
  );
  
  console.log('\nBookings with commissionPaid=true:');
  let totalFromCommissionPaid = 0;
  mojganBookings.forEach(b => {
    if (b.commissionPaid) {
      const commission = b.commissionAmount || 
        (b.tier === 'Growth' ? 100000 : 
         b.tier === 'Domination' ? 175000 : 
         b.tier === 'Empire' ? 336875 : 0);
      totalFromCommissionPaid += commission;
      console.log(`  - ${b.tier}: $${(commission / 100).toFixed(2)}`);
    }
  });
  console.log(`Total from commissionPaid flags: $${(totalFromCommissionPaid / 100).toFixed(2)}`);
  
  // Check transactions
  const transactions = await storage.getAffiliateTransactions(affiliate.id);
  const paidTransactions = transactions.filter(t => t.status?.toLowerCase() === 'paid');
  const totalFromTransactions = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  console.log(`\nTotal from transactions: $${(totalFromTransactions / 100).toFixed(2)}`);
  
  console.log('\nComparison:');
  console.log(`  Function returns: $${(stats.totalPaid / 100).toFixed(2)}`);
  console.log(`  From transactions: $${(totalFromTransactions / 100).toFixed(2)}`);
  console.log(`  From commissionPaid: $${(totalFromCommissionPaid / 100).toFixed(2)}`);
  
  if (Math.abs(stats.totalPaid - totalFromCommissionPaid) < 1) {
    console.log('\n⚠️  WARNING: Function result matches commissionPaid calculation!');
    console.log('   This suggests it might be using commissionPaid flags instead of transactions!');
  }
  
  if (Math.abs(stats.totalPaid - totalFromTransactions) < 1) {
    console.log('\n✅ Function result matches transactions calculation');
  }
  
  process.exit(0);
}

test();











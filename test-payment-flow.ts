/**
 * Test the payment flow: Pay Mojgan $100 and verify balance updates correctly
 */

import { storage } from './server/storage.js';

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow for Mojgan\n');
  console.log('='.repeat(60));
  
  try {
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Mojgan not found');
      return;
    }
    
    console.log(`\n✅ Found affiliate: ${affiliate.username} (ID: ${affiliate.id})\n`);
    
    // Get initial stats
    console.log('📊 BEFORE PAYMENT:');
    console.log('-'.repeat(60));
    const statsBefore = await storage.getAffiliateCommissionStats(affiliate.id);
    console.log(`  Current Balance: $${(statsBefore.currentBalance / 100).toFixed(2)}`);
    console.log(`  Total Earned: $${(statsBefore.totalEarned / 100).toFixed(2)}`);
    console.log(`  Total Paid: $${(statsBefore.totalPaid / 100).toFixed(2)}`);
    
    // Get current transactions
    const transactionsBefore = await storage.getAffiliateTransactions(affiliate.id);
    const paidBefore = transactionsBefore.filter(t => t.status?.toLowerCase() === 'paid');
    console.log(`  Paid Transactions Count: ${paidBefore.length}`);
    console.log(`  Total from transactions: $${(paidBefore.reduce((sum, t) => sum + (t.amount || 0), 0) / 100).toFixed(2)}`);
    
    // Simulate a $100 payment
    const paymentAmountCents = 10000; // $100.00
    console.log(`\n💸 SIMULATING PAYMENT: $${(paymentAmountCents / 100).toFixed(2)}`);
    console.log('-'.repeat(60));
    
    // Create transaction (simulating what the payment endpoint does)
    const transaction = await storage.createAffiliateTransaction({
      affiliateId: affiliate.id,
      affiliateUsername: affiliate.username,
      amount: paymentAmountCents,
      description: `Commission payment ($${(paymentAmountCents / 100).toFixed(2)})`,
      status: "paid",
      paidAt: new Date(),
    });
    
    console.log(`  ✅ Created transaction: ${transaction.id}`);
    console.log(`  Amount: $${(transaction.amount / 100).toFixed(2)}`);
    console.log(`  Status: ${transaction.status}`);
    
    // Mark bookings as paid (simulating what the payment endpoint does)
    await storage.markBookingsAsPaid(affiliate.id, paymentAmountCents);
    console.log(`  ✅ Marked bookings as paid`);
    
    // Get stats after payment
    console.log(`\n📊 AFTER PAYMENT:`);
    console.log('-'.repeat(60));
    const statsAfter = await storage.getAffiliateCommissionStats(affiliate.id);
    console.log(`  Current Balance: $${(statsAfter.currentBalance / 100).toFixed(2)}`);
    console.log(`  Total Earned: $${(statsAfter.totalEarned / 100).toFixed(2)}`);
    console.log(`  Total Paid: $${(statsAfter.totalPaid / 100).toFixed(2)}`);
    
    // Get transactions after payment
    const transactionsAfter = await storage.getAffiliateTransactions(affiliate.id);
    const paidAfter = transactionsAfter.filter(t => t.status?.toLowerCase() === 'paid');
    console.log(`  Paid Transactions Count: ${paidAfter.length}`);
    const totalFromTransactions = paidAfter.reduce((sum, t) => sum + (t.amount || 0), 0);
    console.log(`  Total from transactions: $${(totalFromTransactions / 100).toFixed(2)}`);
    
    // Calculate expected values
    const expectedTotalPaid = statsBefore.totalPaid + paymentAmountCents;
    const expectedBalance = statsBefore.currentBalance - paymentAmountCents;
    
    console.log(`\n✅ VALIDATION:`);
    console.log('-'.repeat(60));
    console.log(`  Expected Total Paid: $${(expectedTotalPaid / 100).toFixed(2)}`);
    console.log(`  Actual Total Paid: $${(statsAfter.totalPaid / 100).toFixed(2)}`);
    console.log(`  Match: ${statsAfter.totalPaid === expectedTotalPaid ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n  Expected Balance: $${(expectedBalance / 100).toFixed(2)}`);
    console.log(`  Actual Balance: $${(statsAfter.currentBalance / 100).toFixed(2)}`);
    console.log(`  Match: ${Math.abs(statsAfter.currentBalance - expectedBalance) < 1 ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n  Expected Total from Transactions: $${(expectedTotalPaid / 100).toFixed(2)}`);
    console.log(`  Actual Total from Transactions: $${(totalFromTransactions / 100).toFixed(2)}`);
    console.log(`  Match: ${totalFromTransactions === expectedTotalPaid ? '✅ YES' : '❌ NO'}`);
    
    // Check if function result matches transaction total
    if (statsAfter.totalPaid !== totalFromTransactions) {
      console.log(`\n⚠️  WARNING: Function result doesn't match transaction total!`);
      console.log(`  Function: $${(statsAfter.totalPaid / 100).toFixed(2)}`);
      console.log(`  Transactions: $${(totalFromTransactions / 100).toFixed(2)}`);
      console.log(`  Difference: $${Math.abs((statsAfter.totalPaid - totalFromTransactions) / 100).toFixed(2)}`);
    }
    
    // Simulate what the API endpoint would return
    console.log(`\n📱 API ENDPOINT RESPONSE (what affiliate dashboard would see):`);
    console.log('-'.repeat(60));
    
    // Direct DB query (like the API does now)
    const { db } = await import('./server/db.js');
    const { affiliateTransactions: at } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const directTransactions = await db
      .select()
      .from(at)
      .where(eq(at.affiliateId, affiliate.id));
    
    const paidDirect = directTransactions.filter(t => 
      t.status && t.status.toLowerCase() === 'paid'
    );
    const directTotalPaid = paidDirect.reduce((sum, t) => sum + (t.amount || 0), 0);
    const directBalance = statsAfter.totalEarned - directTotalPaid;
    
    const apiResponse = {
      currentBalance: {
        usd: (directBalance / 100).toFixed(2),
      },
      totalEarned: {
        usd: (statsAfter.totalEarned / 100).toFixed(2),
      },
      totalPaid: {
        usd: (directTotalPaid / 100).toFixed(2),
      },
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log(`\n  Direct DB Query Results:`);
    console.log(`    Total transactions: ${directTransactions.length}`);
    console.log(`    Paid transactions: ${paidDirect.length}`);
    console.log(`    Total Paid: $${(directTotalPaid / 100).toFixed(2)}`);
    console.log(`    Current Balance: $${(directBalance / 100).toFixed(2)}`);
    
    if (directTotalPaid !== expectedTotalPaid) {
      console.log(`\n⚠️  API would return wrong totalPaid!`);
      console.log(`  Expected: $${(expectedTotalPaid / 100).toFixed(2)}`);
      console.log(`  API would return: $${(directTotalPaid / 100).toFixed(2)}`);
    } else {
      console.log(`\n✅ API would return correct values!`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testPaymentFlow();












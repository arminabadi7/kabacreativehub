/**
 * Test to see what transactions are in the database for Mojgan
 */

import { storage } from './server/storage.js';

async function testMojganTransactions() {
  console.log('🔍 Testing Mojgan Transactions\n');
  console.log('='.repeat(60));
  
  try {
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Mojgan not found');
      return;
    }
    
    console.log(`\n✅ Affiliate: ${affiliate.username} (ID: ${affiliate.id})\n`);
    
    // Get all transactions
    const allTransactions = await storage.getAffiliateTransactions(affiliate.id);
    
    console.log('📋 All Transactions for Mojgan:');
    console.log('-'.repeat(60));
    console.log(`Total transactions found: ${allTransactions.length}\n`);
    
    allTransactions.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}:`);
      console.log(`  ID: ${tx.id}`);
      console.log(`  Amount: ${tx.amount} cents = $${((tx.amount || 0) / 100).toFixed(2)}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Description: ${tx.description || 'N/A'}`);
      console.log(`  Paid At: ${tx.paidAt ? new Date(tx.paidAt).toISOString() : 'N/A'}`);
      console.log(`  Created At: ${tx.createdAt ? new Date(tx.createdAt).toISOString() : 'N/A'}`);
      console.log(`  Affiliate ID: ${tx.affiliateId}`);
      console.log(`  Affiliate Username: ${tx.affiliateUsername || 'N/A'}`);
      console.log('');
    });
    
    // Filter paid transactions
    const paidTransactions = allTransactions.filter(t => t.status === 'paid');
    console.log(`\n💰 Paid Transactions: ${paidTransactions.length}`);
    console.log('-'.repeat(60));
    
    let totalPaid = 0;
    paidTransactions.forEach((tx, index) => {
      const amount = tx.amount || 0;
      totalPaid += amount;
      console.log(`  ${index + 1}. $${(amount / 100).toFixed(2)} - ${tx.description || 'Payment'}`);
      console.log(`     Status: ${tx.status}`);
      console.log(`     Paid At: ${tx.paidAt ? new Date(tx.paidAt).toISOString() : 'N/A'}`);
    });
    
    console.log(`\n  Total Paid: $${(totalPaid / 100).toFixed(2)}`);
    console.log(`  Expected: $2,200.00`);
    
    if (Math.abs(totalPaid - 220000) < 1) {
      console.log(`  ✅ Total matches expected value`);
    } else {
      console.log(`  ❌ MISMATCH! Difference: $${Math.abs((totalPaid - 220000) / 100).toFixed(2)}`);
    }
    
    // Check what getAffiliateCommissionStats returns
    const stats = await storage.getAffiliateCommissionStats(affiliate.id);
    console.log(`\n📊 getAffiliateCommissionStats() Result:`);
    console.log('-'.repeat(60));
    console.log(`  totalPaid: ${stats.totalPaid} cents = $${(stats.totalPaid / 100).toFixed(2)}`);
    console.log(`  currentBalance: ${stats.currentBalance} cents = $${(stats.currentBalance / 100).toFixed(2)}`);
    
    if (stats.totalPaid !== totalPaid) {
      console.log(`\n  ⚠️  WARNING: Function returns different totalPaid than manual calculation!`);
      console.log(`    Manual: $${(totalPaid / 100).toFixed(2)}`);
      console.log(`    Function: $${(stats.totalPaid / 100).toFixed(2)}`);
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

testMojganTransactions();




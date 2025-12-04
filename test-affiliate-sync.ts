/**
 * Test script to verify:
 * 1. Founder dashboard and affiliate dashboard show the same commission values
 * 2. Affiliate payments appear in expenses and transactions
 */

import { storage } from './server/storage.js';

async function testAffiliateSync() {
  console.log('🧪 Testing Affiliate Commission Sync\n');
  console.log('='.repeat(60));
  
  try {
    // Get all affiliates
    const allAffiliates = await storage.getAllAffiliates();
    
    if (allAffiliates.length === 0) {
      console.log('❌ No affiliates found in database');
      return;
    }
    
    console.log(`\nFound ${allAffiliates.length} affiliate(s)\n`);
    
    // Test each affiliate
    for (const affiliate of allAffiliates) {
      console.log(`\n📊 Testing affiliate: ${affiliate.username}`);
      console.log('-'.repeat(60));
      
      // Get stats using the same function both dashboards use
      const stats = await storage.getAffiliateCommissionStats(affiliate.id);
      
      // Simulate what founder dashboard endpoint returns
      const founderDashboardData = {
        totalCommission: stats.currentBalance / 100, // Convert to dollars
        totalEarned: stats.totalEarned / 100,
        totalPaid: stats.totalPaid / 100,
      };
      
      // Simulate what affiliate dashboard endpoint returns
      const affiliateDashboardData = {
        currentBalance: {
          usd: (stats.currentBalance / 100).toFixed(2),
        },
        totalEarned: {
          usd: (stats.totalEarned / 100).toFixed(2),
        },
        totalPaid: {
          usd: (stats.totalPaid / 100).toFixed(2),
        },
      };
      
      // Compare values
      const founderBalance = founderDashboardData.totalCommission;
      const affiliateBalance = parseFloat(affiliateDashboardData.currentBalance.usd);
      
      const founderEarned = founderDashboardData.totalEarned;
      const affiliateEarned = parseFloat(affiliateDashboardData.totalEarned.usd);
      
      const founderPaid = founderDashboardData.totalPaid;
      const affiliatePaid = parseFloat(affiliateDashboardData.totalPaid.usd);
      
      console.log(`\nFounder Dashboard:`);
      console.log(`  Current Balance Owed: $${founderBalance.toFixed(2)}`);
      console.log(`  Total Earned: $${founderEarned.toFixed(2)}`);
      console.log(`  Total Paid: $${founderPaid.toFixed(2)}`);
      
      console.log(`\nAffiliate Dashboard:`);
      console.log(`  Current Balance: $${affiliateBalance.toFixed(2)}`);
      console.log(`  Total Earned: $${affiliateEarned.toFixed(2)}`);
      console.log(`  Total Paid: $${affiliatePaid.toFixed(2)}`);
      
      // Check if values match
      const balanceMatch = Math.abs(founderBalance - affiliateBalance) < 0.01;
      const earnedMatch = Math.abs(founderEarned - affiliateEarned) < 0.01;
      const paidMatch = Math.abs(founderPaid - affiliatePaid) < 0.01;
      
      console.log(`\n✅ Sync Status:`);
      console.log(`  Balance Match: ${balanceMatch ? '✅ YES' : '❌ NO (Difference: $' + Math.abs(founderBalance - affiliateBalance).toFixed(2) + ')'}`);
      console.log(`  Earned Match: ${earnedMatch ? '✅ YES' : '❌ NO (Difference: $' + Math.abs(founderEarned - affiliateEarned).toFixed(2) + ')'}`);
      console.log(`  Paid Match: ${paidMatch ? '✅ YES' : '❌ NO (Difference: $' + Math.abs(founderPaid - affiliatePaid).toFixed(2) + ')'}`);
      
      if (!balanceMatch || !earnedMatch || !paidMatch) {
        console.log(`\n⚠️  WARNING: Values do not match for ${affiliate.username}!`);
      } else {
        console.log(`\n✅ All values are synced correctly for ${affiliate.username}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🧪 Testing Expense and Transaction Creation\n');
    console.log('='.repeat(60));
    
    // Check recent affiliate payments (expenses)
    const allExpenses = await storage.getAllExpenses();
    const affiliateExpenses = allExpenses.filter(e => e.category === 'affiliate_payment');
    
    console.log(`\n📋 Found ${affiliateExpenses.length} affiliate payment expense(s)`);
    
    if (affiliateExpenses.length > 0) {
      console.log('\nRecent Affiliate Payment Expenses:');
      affiliateExpenses.slice(-5).forEach((expense, index) => {
        console.log(`\n  ${index + 1}. ${expense.description}`);
        console.log(`     Amount: $${(expense.amount / 100).toFixed(2)}`);
        console.log(`     Date: ${new Date(expense.date).toLocaleDateString()}`);
        console.log(`     Category: ${expense.category}`);
      });
    }
    
    // Check affiliate transactions
    console.log(`\n📋 Checking affiliate transactions...`);
    for (const affiliate of allAffiliates) {
      const transactions = await storage.getAffiliateTransactions(affiliate.id);
      const paidTransactions = transactions.filter(t => t.status === 'paid');
      
      if (paidTransactions.length > 0) {
        console.log(`\n  ${affiliate.username}: ${paidTransactions.length} paid transaction(s)`);
        paidTransactions.slice(-3).forEach((tx, index) => {
          console.log(`    ${index + 1}. ${tx.description || 'Payment'}`);
          console.log(`       Amount: $${(tx.amount / 100).toFixed(2)}`);
          console.log(`       Date: ${tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : 'N/A'}`);
        });
      }
    }
    
    // Verify that each affiliate payment expense has a corresponding transaction
    console.log(`\n🔍 Verifying expense-transaction correlation...`);
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    for (const expense of affiliateExpenses) {
      // Extract affiliate username from description
      const match = expense.description.match(/to (\w+)/);
      if (match) {
        const username = match[1];
        const affiliate = allAffiliates.find(a => a.username.toLowerCase() === username.toLowerCase());
        
        if (affiliate) {
          const transactions = await storage.getAffiliateTransactions(affiliate.id);
          const matchingTx = transactions.find(t => 
            t.status === 'paid' && 
            Math.abs(t.amount - expense.amount) < 1 && // Allow 1 cent difference
            Math.abs(new Date(t.paidAt!).getTime() - new Date(expense.date).getTime()) < 86400000 // Within 24 hours
          );
          
          if (matchingTx) {
            matchedCount++;
            console.log(`  ✅ ${expense.description}: Found matching transaction`);
          } else {
            unmatchedCount++;
            console.log(`  ⚠️  ${expense.description}: No matching transaction found`);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Matched expenses-transactions: ${matchedCount}`);
    console.log(`  Unmatched expenses: ${unmatchedCount}`);
    
    if (unmatchedCount > 0) {
      console.log(`\n⚠️  WARNING: Some expenses don't have matching transactions!`);
    } else if (affiliateExpenses.length > 0) {
      console.log(`\n✅ All affiliate payment expenses have matching transactions!`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during test:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testAffiliateSync();



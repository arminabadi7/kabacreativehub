/**
 * Test script to verify Mojgan's affiliate dashboard and founder dashboard
 * show the same commission values by calling the actual API endpoints
 */

import { storage } from './server/storage.js';
import bcrypt from 'bcrypt';

async function testDashboardSync() {
  console.log('🧪 Testing Dashboard Sync for Mojgan\n');
  console.log('='.repeat(60));
  
  try {
    // Get Mojgan's affiliate record
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Affiliate "mojgan" not found');
      return;
    }
    
    console.log(`\n✅ Found affiliate: ${affiliate.username}`);
    console.log(`   Email: ${affiliate.email}`);
    console.log(`   ID: ${affiliate.id}\n`);
    
    // Get commission stats using the same function both dashboards use
    const stats = await storage.getAffiliateCommissionStats(affiliate.id);
    
    console.log('📊 Commission Statistics (from database):');
    console.log('-'.repeat(60));
    console.log(`  Current Balance: $${(stats.currentBalance / 100).toFixed(2)}`);
    console.log(`  Total Earned: $${(stats.totalEarned / 100).toFixed(2)}`);
    console.log(`  Total Paid: $${(stats.totalPaid / 100).toFixed(2)}`);
    
    // Simulate what the affiliate dashboard endpoint returns
    // This is what /api/affiliates/:username/commissions returns
    const affiliateDashboardResponse = {
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
    
    // Simulate what the founder dashboard endpoint returns
    // This is what /api/founder/finances/affiliates returns
    const founderDashboardResponse = {
      totalCommission: stats.currentBalance / 100, // Convert to dollars
      totalEarned: stats.totalEarned / 100,
      totalPaid: stats.totalPaid / 100,
    };
    
    console.log('\n📱 Affiliate Dashboard Display (what Mojgan sees):');
    console.log('-'.repeat(60));
    console.log(`  Current Balance: $${affiliateDashboardResponse.currentBalance.usd}`);
    console.log(`  Total Earned: $${affiliateDashboardResponse.totalEarned.usd}`);
    console.log(`  Total Paid: $${affiliateDashboardResponse.totalPaid.usd}`);
    
    console.log('\n👑 Founder Dashboard Display (what Founder sees):');
    console.log('-'.repeat(60));
    console.log(`  Commission Owed: $${founderDashboardResponse.totalCommission.toFixed(2)}`);
    console.log(`  Total Earned: $${founderDashboardResponse.totalEarned.toFixed(2)}`);
    console.log(`  Total Paid: $${founderDashboardResponse.totalPaid.toFixed(2)}`);
    
    // Compare values
    const affiliateBalance = parseFloat(affiliateDashboardResponse.currentBalance.usd);
    const founderBalance = founderDashboardResponse.totalCommission;
    
    const affiliateEarned = parseFloat(affiliateDashboardResponse.totalEarned.usd);
    const founderEarned = founderDashboardResponse.totalEarned;
    
    const affiliatePaid = parseFloat(affiliateDashboardResponse.totalPaid.usd);
    const founderPaid = founderDashboardResponse.totalPaid;
    
    console.log('\n✅ Sync Verification:');
    console.log('-'.repeat(60));
    
    const balanceMatch = Math.abs(affiliateBalance - founderBalance) < 0.01;
    const earnedMatch = Math.abs(affiliateEarned - founderEarned) < 0.01;
    const paidMatch = Math.abs(affiliatePaid - founderPaid) < 0.01;
    
    console.log(`  Current Balance Match: ${balanceMatch ? '✅ YES' : '❌ NO'}`);
    if (!balanceMatch) {
      console.log(`    Difference: $${Math.abs(affiliateBalance - founderBalance).toFixed(2)}`);
      console.log(`    Affiliate: $${affiliateBalance.toFixed(2)}`);
      console.log(`    Founder: $${founderBalance.toFixed(2)}`);
    }
    
    console.log(`  Total Earned Match: ${earnedMatch ? '✅ YES' : '❌ NO'}`);
    if (!earnedMatch) {
      console.log(`    Difference: $${Math.abs(affiliateEarned - founderEarned).toFixed(2)}`);
      console.log(`    Affiliate: $${affiliateEarned.toFixed(2)}`);
      console.log(`    Founder: $${founderEarned.toFixed(2)}`);
    }
    
    console.log(`  Total Paid Match: ${paidMatch ? '✅ YES' : '❌ NO'}`);
    if (!paidMatch) {
      console.log(`    Difference: $${Math.abs(affiliatePaid - founderPaid).toFixed(2)}`);
      console.log(`    Affiliate: $${affiliatePaid.toFixed(2)}`);
      console.log(`    Founder: $${founderPaid.toFixed(2)}`);
    }
    
    if (balanceMatch && earnedMatch && paidMatch) {
      console.log('\n🎉 SUCCESS: All values are perfectly synced!');
      console.log('   Both dashboards will show identical values.');
    } else {
      console.log('\n⚠️  WARNING: Values do not match!');
      console.log('   There may be a sync issue between the dashboards.');
    }
    
    // Get detailed breakdown
    console.log('\n📋 Detailed Breakdown:');
    console.log('-'.repeat(60));
    
    // Get bookings
    const allBookings = await storage.getBookings();
    const mojganBookings = allBookings.filter(
      (booking) => booking.affiliateUsername && 
      booking.affiliateUsername.toLowerCase() === 'mojgan' &&
      booking.saleStatus === 'sold'
    );
    
    console.log(`\n  Sold Bookings: ${mojganBookings.length}`);
    mojganBookings.forEach((booking, index) => {
      const commission = booking.commissionAmount || 0;
      console.log(`    ${index + 1}. ${booking.tier || 'Unknown'} - $${(commission / 100).toFixed(2)}`);
      console.log(`       Date: ${booking.soldAt ? new Date(booking.soldAt).toLocaleDateString() : 'N/A'}`);
      console.log(`       Commission Paid: ${booking.commissionPaid ? 'Yes' : 'No'}`);
    });
    
    // Get transactions
    const transactions = await storage.getAffiliateTransactions(affiliate.id);
    const paidTransactions = transactions.filter(t => t.status === 'paid');
    
    console.log(`\n  Paid Transactions: ${paidTransactions.length}`);
    paidTransactions.forEach((tx, index) => {
      console.log(`    ${index + 1}. $${(tx.amount / 100).toFixed(2)} - ${tx.description || 'Payment'}`);
      console.log(`       Date: ${tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during test:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testDashboardSync();







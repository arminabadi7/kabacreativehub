/**
 * Detailed test to find why Mojgan's balance shows $3,368.75 instead of $2,918.75
 */

import { storage } from './server/storage.js';

async function testMojganDetailed() {
  console.log('🔍 Detailed Investigation: Mojgan Balance Discrepancy\n');
  console.log('='.repeat(60));
  
  try {
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Mojgan not found');
      return;
    }
    
    console.log(`\n✅ Affiliate: ${affiliate.username} (ID: ${affiliate.id})\n`);
    
    // Get all bookings
    const allBookings = await storage.getBookings();
    const mojganBookings = allBookings.filter(
      (booking) => booking.affiliateUsername && 
      booking.affiliateUsername.toLowerCase() === 'mojgan' &&
      booking.saleStatus === 'sold'
    );
    
    console.log('📋 All Sold Bookings for Mojgan:');
    console.log('-'.repeat(60));
    mojganBookings.forEach((booking, index) => {
      console.log(`\n  Booking ${index + 1}:`);
      console.log(`    ID: ${booking.id}`);
      console.log(`    Tier: ${booking.tier || 'N/A'}`);
      console.log(`    Commission Amount (from DB): ${booking.commissionAmount || 'null'}`);
      console.log(`    Commission Amount (dollars): $${booking.commissionAmount ? (booking.commissionAmount / 100).toFixed(2) : '0.00'}`);
      console.log(`    Commission Paid: ${booking.commissionPaid ? 'Yes' : 'No'}`);
      console.log(`    Sold At: ${booking.soldAt ? new Date(booking.soldAt).toISOString() : 'N/A'}`);
    });
    
    // Calculate what getAffiliateCommissionStats should return
    const tierCommissions: Record<string, number> = {
      "Growth": 100000,
      "Domination": 175000,
      "Empire": 336875,
    };
    
    let calculatedTotalEarned = 0;
    console.log('\n💰 Manual Calculation:');
    console.log('-'.repeat(60));
    mojganBookings.forEach((booking, index) => {
      const commissionAmount = (booking.commissionAmount !== null && booking.commissionAmount !== undefined) 
        ? booking.commissionAmount 
        : (booking.tier ? (tierCommissions[booking.tier] || 0) : 0);
      calculatedTotalEarned += commissionAmount;
      console.log(`  Booking ${index + 1} (${booking.tier}): $${(commissionAmount / 100).toFixed(2)}`);
    });
    console.log(`  Total Earned: $${(calculatedTotalEarned / 100).toFixed(2)}`);
    
    // Get transactions
    const transactions = await storage.getAffiliateTransactions(affiliate.id);
    const paidTransactions = transactions.filter(t => t.status === 'paid');
    
    let calculatedTotalPaid = 0;
    console.log('\n💸 Paid Transactions:');
    console.log('-'.repeat(60));
    paidTransactions.forEach((tx, index) => {
      calculatedTotalPaid += tx.amount || 0;
      console.log(`  ${index + 1}. $${((tx.amount || 0) / 100).toFixed(2)} - ${tx.description || 'Payment'}`);
    });
    console.log(`  Total Paid: $${(calculatedTotalPaid / 100).toFixed(2)}`);
    
    const calculatedBalance = calculatedTotalEarned - calculatedTotalPaid;
    console.log(`\n  Calculated Balance: $${(calculatedBalance / 100).toFixed(2)}`);
    
    // Now get the actual stats from the function
    const stats = await storage.getAffiliateCommissionStats(affiliate.id);
    
    console.log('\n📊 getAffiliateCommissionStats() Result:');
    console.log('-'.repeat(60));
    console.log(`  currentBalance: ${stats.currentBalance} cents = $${(stats.currentBalance / 100).toFixed(2)}`);
    console.log(`  totalEarned: ${stats.totalEarned} cents = $${(stats.totalEarned / 100).toFixed(2)}`);
    console.log(`  totalPaid: ${stats.totalPaid} cents = $${(stats.totalPaid / 100).toFixed(2)}`);
    
    // Compare
    console.log('\n🔍 Comparison:');
    console.log('-'.repeat(60));
    if (Math.abs(calculatedBalance - stats.currentBalance) < 1) {
      console.log('  ✅ Manual calculation matches function result');
    } else {
      console.log('  ❌ MISMATCH!');
      console.log(`    Manual: $${(calculatedBalance / 100).toFixed(2)}`);
      console.log(`    Function: $${(stats.currentBalance / 100).toFixed(2)}`);
      console.log(`    Difference: $${Math.abs((calculatedBalance - stats.currentBalance) / 100).toFixed(2)}`);
    }
    
    // Check if $3,368.75 matches anything
    const userSees = 336875; // in cents
    console.log('\n🎯 User Sees $3,368.75 Analysis:');
    console.log('-'.repeat(60));
    console.log(`  User sees: $${(userSees / 100).toFixed(2)}`);
    console.log(`  Correct balance: $${(stats.currentBalance / 100).toFixed(2)}`);
    console.log(`  Total earned: $${(stats.totalEarned / 100).toFixed(2)}`);
    console.log(`  Empire tier commission: $${(tierCommissions['Empire'] / 100).toFixed(2)}`);
    
    if (userSees === tierCommissions['Empire']) {
      console.log('  ⚠️  User sees value matches Empire tier commission!');
      console.log('  💡 This suggests the frontend might be showing a single booking commission instead of the balance');
    }
    
    if (userSees === stats.totalEarned) {
      console.log('  ⚠️  User sees value matches total earned!');
      console.log('  💡 This suggests the frontend might be showing totalEarned instead of currentBalance');
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

testMojganDetailed();












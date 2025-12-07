/**
 * Test what the API actually returns for Mojgan's commissions
 */

import { storage } from './server/storage.js';

async function testMojganAPI() {
  console.log('🧪 Testing Mojgan API Response\n');
  console.log('='.repeat(60));
  
  try {
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Mojgan not found');
      return;
    }
    
    console.log(`\n✅ Found affiliate: ${affiliate.username} (ID: ${affiliate.id})\n`);
    
    // Get stats using the same function the API uses
    const stats = await storage.getAffiliateCommissionStats(affiliate.id);
    
    console.log('📊 Raw Stats from getAffiliateCommissionStats:');
    console.log('-'.repeat(60));
    console.log(`  currentBalance (cents): ${stats.currentBalance}`);
    console.log(`  currentBalance (dollars): $${(stats.currentBalance / 100).toFixed(2)}`);
    console.log(`  totalEarned (cents): ${stats.totalEarned}`);
    console.log(`  totalEarned (dollars): $${(stats.totalEarned / 100).toFixed(2)}`);
    console.log(`  totalPaid (cents): ${stats.totalPaid}`);
    console.log(`  totalPaid (dollars): $${(stats.totalPaid / 100).toFixed(2)}`);
    
    // Simulate what the API endpoint returns
    const apiResponse = {
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
    
    console.log('\n📱 What API Returns (JSON):');
    console.log('-'.repeat(60));
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🔍 Analysis:');
    console.log('-'.repeat(60));
    console.log(`  API currentBalance.usd: "${apiResponse.currentBalance.usd}"`);
    console.log(`  Expected (from founder): "$2,918.75"`);
    console.log(`  User sees in affiliate dashboard: "$3,368.75"`);
    
    const apiBalance = parseFloat(apiResponse.currentBalance.usd);
    const expectedBalance = 2918.75;
    const userSees = 3368.75;
    
    if (Math.abs(apiBalance - expectedBalance) < 0.01) {
      console.log(`\n  ✅ API is returning correct value: $${apiBalance.toFixed(2)}`);
      console.log(`  ⚠️  But user sees: $${userSees.toFixed(2)}`);
      console.log(`  💡 This suggests a caching or display issue in the frontend`);
    } else {
      console.log(`\n  ❌ API is returning wrong value: $${apiBalance.toFixed(2)}`);
      console.log(`  Expected: $${expectedBalance.toFixed(2)}`);
      console.log(`  Difference: $${Math.abs(apiBalance - expectedBalance).toFixed(2)}`);
    }
    
    // Check if $3,368.75 matches any other value
    console.log('\n🔍 Value Analysis:');
    console.log('-'.repeat(60));
    console.log(`  $3,368.75 = Empire tier commission`);
    console.log(`  This suggests the frontend might be showing totalEarned or a single booking commission`);
    
    if (Math.abs(parseFloat(apiResponse.totalEarned.usd) - userSees) < 0.01) {
      console.log(`  ⚠️  User sees value matches totalEarned!`);
    }
    
    // Get detailed breakdown
    const allBookings = await storage.getBookings();
    const mojganBookings = allBookings.filter(
      (booking) => booking.affiliateUsername && 
      booking.affiliateUsername.toLowerCase() === 'mojgan' &&
      booking.saleStatus === 'sold'
    );
    
    console.log('\n📋 Bookings Breakdown:');
    console.log('-'.repeat(60));
    mojganBookings.forEach((booking, index) => {
      const commission = booking.commissionAmount || 0;
      console.log(`  ${index + 1}. ${booking.tier || 'Unknown'}`);
      console.log(`     Commission: $${(commission / 100).toFixed(2)}`);
      console.log(`     Commission Amount field: ${booking.commissionAmount}`);
      console.log(`     Commission Paid: ${booking.commissionPaid}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testMojganAPI();




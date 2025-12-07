/**
 * Test the commissions endpoint directly to see what it returns
 */

import { storage } from './server/storage.js';
import { db } from './server/db.js';
import { affiliateTransactions, bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testCommissionsEndpoint() {
  console.log('🧪 Testing Commissions Endpoint Logic\n');
  console.log('='.repeat(60));
  
  try {
    const affiliate = await storage.getAffiliateByUsername('mojgan');
    
    if (!affiliate) {
      console.log('❌ Mojgan not found');
      return;
    }
    
    console.log(`\n✅ Found affiliate: ${affiliate.username} (ID: ${affiliate.id})\n`);
    
    // Test getAffiliateCommissionStats (what the endpoint uses)
    console.log('📊 Testing getAffiliateCommissionStats:');
    console.log('-'.repeat(60));
    try {
      const commissionStats = await storage.getAffiliateCommissionStats(affiliate.id);
      console.log('Result:', commissionStats);
      console.log(`  currentBalance: ${commissionStats.currentBalance} cents = $${(commissionStats.currentBalance / 100).toFixed(2)}`);
      console.log(`  totalEarned: ${commissionStats.totalEarned} cents = $${(commissionStats.totalEarned / 100).toFixed(2)}`);
      console.log(`  totalPaid: ${commissionStats.totalPaid} cents = $${(commissionStats.totalPaid / 100).toFixed(2)}`);
      
      if (commissionStats.currentBalance === 0 && commissionStats.totalEarned === 0 && commissionStats.totalPaid === 0) {
        console.log('\n⚠️  WARNING: All values are zero! This suggests an error occurred.');
      }
    } catch (error: any) {
      console.error('❌ Error calling getAffiliateCommissionStats:', error);
      console.error(error.stack);
    }
    
    // Test direct DB queries (what the endpoint should do)
    console.log('\n📊 Testing Direct DB Queries:');
    console.log('-'.repeat(60));
    
    // Get bookings
    const allBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.saleStatus, 'sold'));
    
    const affiliateBookings = allBookings.filter(
      (b) => b.affiliateUsername && 
      b.affiliateUsername.toLowerCase() === affiliate.username.toLowerCase()
    );
    
    console.log(`  Total sold bookings: ${allBookings.length}`);
    console.log(`  Mojgan's sold bookings: ${affiliateBookings.length}`);
    
    const tierCommissions: Record<string, number> = {
      "Growth": 100000,
      "Domination": 175000,
      "Empire": 336875,
    };
    
    let totalEarned = 0;
    affiliateBookings.forEach((booking) => {
      const commissionAmount = (booking.commissionAmount !== null && booking.commissionAmount !== undefined)
        ? booking.commissionAmount
        : (booking.tier ? (tierCommissions[booking.tier] || 0) : 0);
      totalEarned += commissionAmount;
      console.log(`    Booking: ${booking.tier}, Commission: $${(commissionAmount / 100).toFixed(2)}`);
    });
    console.log(`  Total Earned: ${totalEarned} cents = $${(totalEarned / 100).toFixed(2)}`);
    
    // Get transactions
    const directTransactions = await db
      .select()
      .from(affiliateTransactions)
      .where(eq(affiliateTransactions.affiliateId, affiliate.id));
    
    console.log(`  Total transactions: ${directTransactions.length}`);
    
    const paidTransactions = directTransactions.filter(t => 
      t.status && String(t.status).toLowerCase() === 'paid'
    );
    
    console.log(`  Paid transactions: ${paidTransactions.length}`);
    paidTransactions.forEach((tx, idx) => {
      console.log(`    ${idx + 1}. $${((tx.amount || 0) / 100).toFixed(2)} - Status: "${tx.status}"`);
    });
    
    const totalPaid = paidTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    console.log(`  Total Paid: ${totalPaid} cents = $${(totalPaid / 100).toFixed(2)}`);
    
    const currentBalance = totalEarned - totalPaid;
    console.log(`  Current Balance: ${currentBalance} cents = $${(currentBalance / 100).toFixed(2)}`);
    
    // Simulate what the endpoint should return
    console.log('\n📱 What Endpoint Should Return:');
    console.log('-'.repeat(60));
    const response = {
      currentBalance: {
        usd: (currentBalance / 100).toFixed(2),
      },
      totalEarned: {
        usd: (totalEarned / 100).toFixed(2),
      },
      totalPaid: {
        usd: (totalPaid / 100).toFixed(2),
      },
    };
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testCommissionsEndpoint();




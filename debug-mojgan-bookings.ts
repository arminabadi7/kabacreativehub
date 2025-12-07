/**
 * Debug script to check Mojgan's affiliate bookings
 */

import { db } from './server/db';
import { affiliates, bookings } from './shared/schema';

async function debugMojganBookings() {
  console.log('🔍 Debugging Mojgan\'s affiliate bookings...\n');

  try {
    // Find affiliate by username (case-insensitive)
    const allAffiliates = await db.select().from(affiliates);
    const mojganAffiliate = allAffiliates.find(a => 
      a.username.toLowerCase().includes('mojgan')
    );

    if (!mojganAffiliate) {
      console.log('❌ No affiliate found with "mojgan" in username');
      console.log('\nAll affiliates:');
      allAffiliates.forEach(a => {
        console.log(`  - ${a.username} (ID: ${a.id})`);
      });
      return;
    }

    console.log(`✅ Found affiliate: ${mojganAffiliate.username} (ID: ${mojganAffiliate.id})\n`);

    // Get all bookings
    const allBookings = await db.select().from(bookings);
    console.log(`Total bookings in database: ${allBookings.length}\n`);

    // Find bookings linked to this affiliate
    const mojganBookings = allBookings.filter(b => 
      b.affiliateUsername === mojganAffiliate.username ||
      (b.affiliateUsername && b.affiliateUsername.toLowerCase() === mojganAffiliate.username.toLowerCase())
    );

    console.log(`Bookings with affiliateUsername="${mojganAffiliate.username}": ${mojganBookings.length}\n`);

    if (mojganBookings.length === 0) {
      console.log('⚠️  No bookings found for this affiliate\n');
      console.log('Bookings with affiliateUsername set:');
      const bookingsWithAffiliate = allBookings.filter(b => b.affiliateUsername);
      bookingsWithAffiliate.forEach(b => {
        console.log(`  - ${b.attendeeName} (${b.attendeeEmail}) - affiliate: "${b.affiliateUsername}"`);
      });
      
      if (bookingsWithAffiliate.length === 0) {
        console.log('  (No bookings have affiliateUsername set)');
      } else {
        console.log('\n💡 Possible issue: Bookings exist but affiliateUsername doesn\'t match exactly');
        console.log(`   Expected: "${mojganAffiliate.username}"`);
        console.log(`   Check for case sensitivity or extra characters`);
      }
    } else {
      console.log('✅ Found bookings for Mojgan:');
      mojganBookings.forEach(b => {
        console.log(`  - ${b.attendeeName} (${b.attendeeEmail})`);
        console.log(`    Date: ${b.eventTime}`);
        console.log(`    Tier: ${b.tier || 'Not set'}`);
        console.log(`    Status: ${b.status}`);
        console.log(`    Sale Status: ${b.saleStatus || 'Not set'}`);
        console.log(`    Commission: ${b.commissionAmount ? '$' + (b.commissionAmount / 100).toFixed(2) : 'Not set'}`);
        console.log('');
      });
    }

    // Check for bookings that might be linked but with different username case
    console.log('\n🔍 Checking for case-sensitivity issues...');
    const caseVariations = [
      'mojgan',
      'Mojgan',
      'MOJGAN',
      'mojgan_',
      'mojgan1'
    ];

    caseVariations.forEach(variant => {
      const matches = allBookings.filter(b => 
        b.affiliateUsername && b.affiliateUsername.toLowerCase() === variant.toLowerCase()
      );
      if (matches.length > 0) {
        console.log(`  Found ${matches.length} bookings with affiliateUsername="${variant}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

debugMojganBookings().catch(console.error);






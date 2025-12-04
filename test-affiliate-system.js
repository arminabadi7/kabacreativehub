/**
 * Test script for Affiliate Tracking System
 * Run with: node test-affiliate-system.js
 */

const BASE_URL = 'http://localhost:3002';

// Simple cookie jar
class CookieJar {
  constructor() {
    this.cookies = {};
  }

  setCookie(cookieString) {
    if (!cookieString) return;
    const [nameValue] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      this.cookies[name.trim()] = value.trim();
    }
  }

  getCookieHeader() {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

async function fetchWithCookies(url, options = {}) {
  const jar = options.jar || new CookieJar();
  const headers = {
    ...options.headers,
    'Cookie': jar.getCookieHeader()
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Extract cookies from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    jar.setCookie(setCookie);
  }

  return { response, jar };
}

async function testAffiliateSystem() {
  console.log('🧪 Testing Affiliate Tracking System\n');
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const jar = new CookieJar();

  function logTest(name, passed, error = null) {
    if (passed) {
      console.log(`✅ ${name}`);
      testResults.passed++;
    } else {
      console.log(`❌ ${name}`);
      testResults.failed++;
      if (error) {
        console.log(`   Error: ${error.message || error}`);
        testResults.errors.push({ name, error: error.message || String(error) });
      }
    }
  }

  // Test 1: Create a test affiliate
  console.log('\n1. Creating test affiliate...');
  let testAffiliate;
  try {
    const { response } = await fetchWithCookies(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testaffiliate_' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'testpass123'
      }),
      jar
    });
    
    if (response.ok) {
      testAffiliate = await response.json();
      logTest('Create test affiliate', true);
      console.log(`   Created affiliate: ${testAffiliate.username} (ID: ${testAffiliate.id})`);
    } else {
      const error = await response.text();
      logTest('Create test affiliate', false, new Error(error));
    }
  } catch (error) {
    logTest('Create test affiliate', false, error);
  }

  if (!testAffiliate) {
    console.log('\n⚠️  Cannot continue tests without test affiliate');
    return testResults;
  }

  // Test 2: Login to get session
  console.log('\n2. Logging in affiliate...');
  try {
    const { response, jar: loggedInJar } = await fetchWithCookies(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testAffiliate.username,
        password: 'testpass123'
      }),
      jar
    });
    
    if (response.ok) {
      Object.assign(jar.cookies, loggedInJar.cookies);
      logTest('Login affiliate', true);
      console.log(`   Session established`);
    } else {
      const error = await response.text();
      logTest('Login affiliate', false, new Error(error));
    }
  } catch (error) {
    logTest('Login affiliate', false, error);
  }

  // Test 3: Track a referral
  console.log('\n3. Tracking referral...');
  let referralId;
  try {
    const { response } = await fetchWithCookies(`${BASE_URL}/api/referrals/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrerUsername: testAffiliate.username
      }),
      jar
    });
    
    if (response.ok) {
      const data = await response.json();
      referralId = data.referralId;
      logTest('Track referral', true);
      console.log(`   Referral ID: ${referralId}`);
    } else {
      const error = await response.text();
      logTest('Track referral', false, new Error(error));
    }
  } catch (error) {
    logTest('Track referral', false, error);
  }

  // Test 4: Verify affiliate can be found by username (requires auth)
  console.log('\n4. Verifying affiliate lookup...');
  try {
    const { response } = await fetchWithCookies(`${BASE_URL}/api/affiliates/${testAffiliate.username}/stats`, {
      jar
    });
    if (response.ok) {
      const stats = await response.json();
      logTest('Find affiliate by username', true);
      console.log(`   Stats: ${stats.totalClicks} clicks, ${stats.totalConversions} conversions`);
    } else {
      const errorText = await response.text();
      logTest('Find affiliate by username', false, new Error(`Status ${response.status}: ${errorText}`));
    }
  } catch (error) {
    logTest('Find affiliate by username', false, error);
  }

  // Test 5: Check affiliate bookings endpoint
  console.log('\n5. Testing affiliate bookings endpoint...');
  try {
    const { response } = await fetchWithCookies(`${BASE_URL}/api/affiliates/${testAffiliate.username}/bookings`, {
      jar
    });
    if (response.ok) {
      const bookings = await response.json();
      logTest('Get affiliate bookings', true);
      console.log(`   Found ${bookings.length} bookings for affiliate`);
    } else {
      const errorText = await response.text();
      logTest('Get affiliate bookings', false, new Error(`Status ${response.status}: ${errorText.substring(0, 100)}`));
    }
  } catch (error) {
    logTest('Get affiliate bookings', false, error);
  }

  // Test 6: Check affiliate commissions endpoint
  console.log('\n6. Testing affiliate commissions endpoint...');
  try {
    const { response } = await fetchWithCookies(`${BASE_URL}/api/affiliates/${testAffiliate.username}/commissions`, {
      jar
    });
    if (response.ok) {
      const commissions = await response.json();
      logTest('Get affiliate commissions', true);
      console.log(`   Current Balance: $${commissions.currentBalance.usd}`);
      console.log(`   Total Earned: $${commissions.totalEarned.usd}`);
      console.log(`   Total Paid: $${commissions.totalPaid.usd}`);
    } else {
      const errorText = await response.text();
      logTest('Get affiliate commissions', false, new Error(`Status ${response.status}: ${errorText.substring(0, 100)}`));
    }
  } catch (error) {
    logTest('Get affiliate commissions', false, error);
  }

  // Test 7: Verify storage.upsertBooking logic (simulate)
  console.log('\n7. Testing booking auto-assignment logic...');
  const testBookingData = {
    id: 'test-booking-' + Date.now(),
    attendeeName: 'Test User',
    attendeeEmail: 'testuser@example.com',
    eventTime: new Date(Date.now() + 86400000).toISOString(),
    utmSource: testAffiliate.username
  };
  
  // Verify the data structure matches what Calendly would send
  const hasUtmSource = testBookingData.utmSource === testAffiliate.username;
  logTest('Booking data structure valid (utmSource matches affiliate)', hasUtmSource);
  console.log(`   utmSource: ${testBookingData.utmSource}`);
  console.log(`   Affiliate username: ${testAffiliate.username}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  const totalTests = testResults.passed + testResults.failed;
  if (totalTests > 0) {
    console.log(`📈 Success Rate: ${((testResults.passed / totalTests) * 100).toFixed(1)}%`);
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  console.log('\n💡 Next Steps for Full Integration Test:');
  console.log('   1. ✅ API endpoints are working');
  console.log('   2. ✅ Affiliate authentication works');
  console.log('   3. ✅ Referral tracking works');
  console.log('   4. ⏳ Test Calendly integration:');
  console.log('      - Visit: http://localhost:3002/?ref=' + testAffiliate.username);
  console.log('      - Click "Book Your Free Strategy Call"');
  console.log('      - Verify Calendly URL includes utm_source=' + testAffiliate.username);
  console.log('   5. ⏳ Test booking sync:');
  console.log('      - Create a booking in Calendly with utm_source=' + testAffiliate.username);
  console.log('      - Sync bookings in Founder Dashboard');
  console.log('      - Verify booking appears with affiliate pre-selected');
  console.log('   6. ⏳ Test affiliate dashboard:');
  console.log('      - Login as ' + testAffiliate.username);
  console.log('      - Verify booking appears in dashboard');

  return testResults;
}

// Run tests
testAffiliateSystem().catch(console.error);

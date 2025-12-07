# Manual Test Guide for Affiliate Tracking System

## ✅ Automated Tests Passed

The following components have been verified:
- ✅ Affiliate account creation
- ✅ Affiliate authentication/login
- ✅ Referral tracking
- ✅ Affiliate stats endpoint
- ✅ Booking data structure validation

## 🧪 Manual Browser Testing Steps

### Prerequisites
1. Server is running on `http://localhost:3002`
2. You have founder dashboard access
3. Calendly API token is configured (optional, for real Calendly sync)

### Test 1: Affiliate Link Tracking

1. **Create a test affiliate** (if not already created):
   - Go to `http://localhost:3002/founder-dashboard`
   - Login with founder password
   - Navigate to "User Management" tab
   - Create new affiliate:
     - Username: `testaffiliate`
     - Email: `test@example.com`
     - Password: `testpass123`
   - Note the username for later

2. **Test affiliate link**:
   - Open a new incognito/private browser window
   - Visit: `http://localhost:3002/?ref=testaffiliate`
   - Open browser DevTools (F12) → Console tab
   - Verify:
     - ✅ No console errors
     - ✅ localStorage has `kaba_referrer` key
     - ✅ Network tab shows POST to `/api/referrals/track` (status 201)

3. **Verify Calendly URL includes UTM**:
   - On the landing page, click "Book Your Free Strategy Call"
   - Before Calendly widget loads, check the iframe src URL
   - Verify URL includes: `?utm_source=testaffiliate&utm_medium=ref&utm_campaign=affiliate`
   - ✅ If yes, UTM tracking is working correctly

### Test 2: Booking Sync (Calendly Integration)

**Option A: With Real Calendly Booking**
1. Complete Test 1 first (visit with `?ref=testaffiliate`)
2. Book an actual appointment through Calendly widget
3. In Founder Dashboard → "Bookings & Clients" tab
4. Click "Refresh Bookings" button
5. Verify:
   - ✅ New booking appears in the list
   - ✅ Affiliate dropdown shows "testaffiliate" (pre-selected)
   - ✅ Green text "(automatically from Calendly)" appears next to affiliate name
   - ✅ Booking shows attendee name and email

**Option B: Simulate Booking (Without Calendly API)**
1. In Founder Dashboard → "Bookings & Clients"
2. Manually create a booking OR
3. Check server logs for `[upsertBooking]` messages when bookings sync
4. If you see logs like:
   ```
   [upsertBooking] Attempting to auto-assign affiliate from utmSource: testaffiliate
   [upsertBooking] Found affiliate: testaffiliate (ID: ...)
   ```
   ✅ Then the auto-assignment logic is working

### Test 3: Affiliate Dashboard Display

1. **Login as affiliate**:
   - Go to `http://localhost:3002/affiliate-dashboard`
   - Login with:
     - Username: `testaffiliate`
     - Password: `testpass123`

2. **Verify dashboard shows booking**:
   - Scroll to "Your Referred Bookings" section
   - Verify:
     - ✅ Booking from Test 2 appears in the list
     - ✅ Shows attendee name and email
     - ✅ Shows date and time
     - ✅ Tier shows "Not set" (initially)

3. **Verify commission stats**:
   - Check financial summary cards:
     - ✅ Current Balance: $0.00
     - ✅ Total Earned: $0.00
     - ✅ Total Paid: $0.00
   - (These will update after booking is marked as "sold")

### Test 4: Booking Update Sync

1. **In Founder Dashboard**:
   - Go to "Bookings & Clients" tab
   - Find the booking from Test 2
   - Click to expand booking details
   - Update:
     - Set Tier to "Growth"
     - Set Sale Status to "Sold"
     - Click "Save"

2. **Verify commission calculation**:
   - ✅ Commission amount shows: $1,000.00
   - ✅ Booking status shows "✓ Sold"

3. **In Affiliate Dashboard** (refresh if needed):
   - Verify:
     - ✅ Tier shows "Growth"
     - ✅ Status shows "Sold" with green checkmark
     - ✅ Commission shows "$1,000.00"
     - ✅ Current Balance updates to $1,000.00
     - ✅ Total Earned updates to $1,000.00

### Test 5: Multiple Bookings

1. Create another booking with the same affiliate link
2. Verify both bookings appear in affiliate dashboard
3. Mark both as "sold" with different tiers
4. Verify commission totals are calculated correctly:
   - Growth: $1,000.00
   - Domination: $1,750.00
   - Empire: $3,368.75

## 🔍 Debugging Tips

### Check Server Logs
Look for these log messages:
```
[upsertBooking] Attempting to auto-assign affiliate from utmSource: testaffiliate
[upsertBooking] Found affiliate: testaffiliate (ID: ...)
[upsertBooking] Linking booking to referral ... and marking as converted
```

### Check Browser Console
- Open DevTools → Console
- Look for any errors
- Check Network tab for failed API calls

### Common Issues

**Issue**: Affiliate not auto-detected
- **Check**: Calendly URL includes `utm_source=affiliate_username`
- **Check**: Server logs show `[upsertBooking]` messages
- **Check**: Affiliate username matches exactly (case-sensitive)

**Issue**: Booking doesn't appear in affiliate dashboard
- **Check**: Booking has `affiliateUsername` set in database
- **Check**: Affiliate is logged in as the correct username
- **Check**: API endpoint `/api/affiliates/:username/bookings` returns data

**Issue**: Commission not calculating
- **Check**: Tier is set before marking as "sold"
- **Check**: Sale status is exactly "sold" (lowercase)
- **Check**: Server logs show commission calculation

## ✅ Expected Results Summary

After completing all tests, you should see:

1. ✅ Affiliate link (`?ref=username`) stores referral
2. ✅ Calendly URL includes `utm_source=affiliate_username`
3. ✅ Booking syncs with affiliate auto-assigned
4. ✅ Booking appears in Founder Dashboard with affiliate pre-selected
5. ✅ Green "(automatically from Calendly)" text appears
6. ✅ Booking appears in Affiliate Dashboard
7. ✅ Updates sync between dashboards
8. ✅ Commission calculates correctly when marked "sold"

## 📝 Test Affiliate Credentials

For testing, use:
- **Username**: `testaffiliate` (or create your own)
- **Password**: `testpass123`
- **Referral Link**: `http://localhost:3002/?ref=testaffiliate`






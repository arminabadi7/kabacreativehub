# Testing Affiliate Booking Flow

## Test Steps:

### 1. Create a Test Affiliate
- Go to Founder Dashboard → User Management
- Create a new affiliate account (e.g., username: `testaffiliate`)
- Note the password

### 2. Test Affiliate Link Tracking
- Visit: `http://localhost:3002/?ref=testaffiliate`
- Verify:
  - Referral is tracked (check browser console for API call to `/api/referrals/track`)
  - localStorage has `kaba_referrer` with affiliate username
  - Calendly URL includes `utm_source=testaffiliate` when "Book Your Free Strategy Call" is clicked

### 3. Test Calendly Booking Sync
- Click "Book Your Free Strategy Call" on landing page
- The Calendly widget should open with URL: `https://calendly.com/kabacontent/30min?utm_source=testaffiliate&utm_medium=ref&utm_campaign=affiliate`
- Book a test appointment (or use existing Calendly booking)
- Go to Founder Dashboard → Bookings & Clients
- Click "Refresh Bookings" button
- Verify:
  - Booking appears in the list
  - Affiliate dropdown shows "testaffiliate" (pre-selected)
  - Green text "(automatically from Calendly)" appears next to affiliate name

### 4. Test Affiliate Dashboard
- Log in to Affiliate Dashboard with `testaffiliate` credentials
- Verify:
  - Booking appears in "Your Referred Bookings" section
  - Shows attendee name, email, date/time
  - Tier shows "Not set" initially

### 5. Test Booking Update Sync
- In Founder Dashboard, update the booking:
  - Set Tier to "Growth"
  - Set Sale Status to "Sold"
- Verify:
  - Commission amount appears (should be $1,000.00 for Growth tier)
  - In Affiliate Dashboard (refresh if needed):
    - Tier shows "Growth"
    - Status shows "Sold" with green checkmark
    - Commission shows "$1,000.00"
    - Current Balance updates to $1,000.00
    - Total Earned updates to $1,000.00

### 6. Test Manual Affiliate Assignment
- Create a new booking without affiliate link
- In Founder Dashboard, manually select an affiliate from dropdown
- Verify affiliate dashboard shows the booking

## Expected Behavior:

✅ Affiliate link (`?ref=username`) stores referral in localStorage
✅ Calendly URL includes `utm_source=affiliate_username`
✅ Calendly API returns `utm_source` in tracking data
✅ `upsertBooking` finds affiliate from `utmSource` and auto-assigns
✅ Booking appears in Founder Dashboard with affiliate pre-selected
✅ Booking appears in Affiliate Dashboard automatically
✅ Updates in Founder Dashboard sync to Affiliate Dashboard
✅ Commission calculates automatically when sale status = "sold"

## Troubleshooting:

- If affiliate not auto-detected: Check browser console for errors, verify Calendly API token is set
- If booking doesn't sync: Check server logs for Calendly sync errors
- If commission not calculating: Verify tier is set before marking as "sold"






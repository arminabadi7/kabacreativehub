# Affiliate Tracking System - Complete Flow

## Overview
The system automatically detects when someone books a call through Calendly using an affiliate referral link, links the booking to the affiliate, and syncs all updates between the Founder Dashboard and Affiliate Dashboard.

## Flow Diagram

```
1. User clicks affiliate link: /?ref=affiliate_username
   ↓
2. Referral tracked → Stored in localStorage + Database
   ↓
3. User clicks "Book Your Free Strategy Call"
   ↓
4. Calendly URL includes: ?utm_source=affiliate_username&utm_medium=ref&utm_campaign=affiliate
   ↓
5. User books appointment through Calendly
   ↓
6. Calendly API returns booking with utm_source in tracking data
   ↓
7. Founder Dashboard syncs bookings → upsertBooking() called
   ↓
8. upsertBooking() finds affiliate from utmSource → Auto-assigns affiliateUsername
   ↓
9. Booking appears in Founder Dashboard with affiliate pre-selected
   ↓
10. Booking automatically appears in Affiliate Dashboard
   ↓
11. Founder updates booking (tier, status, sale status)
   ↓
12. Updates sync to Affiliate Dashboard (auto-refresh every 30s)
```

## Key Components

### 1. Landing Page (`client/src/pages/Home.tsx`)
- **Referral Capture**: Captures `?ref=username` from URL and stores in localStorage
- **Calendly URL Generation**: Adds `utm_source=affiliate_username` to Calendly URL
- **Referral Tracking**: Calls `/api/referrals/track` to log referral in database

### 2. Calendly Service (`server/calendly-service.ts`)
- **Booking Sync**: Fetches bookings from Calendly API
- **UTM Extraction**: Extracts `utm_source` from `invitee.tracking?.utm_source`
- **Returns**: Booking data with `utmSource` field

### 3. Storage Layer (`server/storage.ts`)
- **upsertBooking()**: 
  - Checks if `utmSource` exists and booking doesn't have affiliate yet
  - Finds affiliate by username using `getAffiliateByUsername(utmSource)`
  - Finds most recent unconverted referral for that affiliate
  - Auto-assigns `affiliateUsername` and `referralId`
  - Marks referral as converted
  - Preserves manual assignments (won't overwrite if affiliate already set)

### 4. API Routes (`server/routes.ts`)
- **GET /api/founder/bookings**: Syncs Calendly bookings and returns all bookings
- **PATCH /api/founder/bookings/:bookingId**: Updates booking (tier, status, saleStatus)
  - Auto-calculates commission when `saleStatus = "sold"`
- **GET /api/affiliates/:username/bookings**: Returns bookings for specific affiliate
- **GET /api/affiliates/:username/commissions**: Returns commission stats (USD only)

### 5. Founder Dashboard (`client/src/pages/FounderDashboard.tsx`)
- **Booking Display**: Shows all bookings with affiliate info
- **Visual Indicator**: Shows "(automatically from Calendly)" in green when `referralId` exists
- **Affiliate Dropdown**: Pre-populated with auto-detected affiliate
- **Query Invalidation**: Invalidates affiliate queries when booking updated

### 6. Affiliate Dashboard (`client/src/pages/AffiliateDashboard.tsx`)
- **Auto-Refresh**: Refetches bookings every 30 seconds
- **Booking Display**: Shows all bookings they referred
- **Commission Display**: Shows Current Balance, Total Earned, Total Paid (USD only)
- **Real-time Sync**: Updates automatically when founder makes changes

## Commission Calculation

When a booking is marked as "sold" in Founder Dashboard:
- **Growth Tier**: $1,000.00 (25% of $4,000)
- **Domination Tier**: $1,750.00 (25% of $7,000)
- **Empire Tier**: $3,368.75 (25% of $13,475)

Commission is stored in cents (e.g., 100000 = $1,000.00)

## Database Schema

### Bookings Table
- `id`: Calendly event UUID
- `affiliateUsername`: Auto-assigned from utmSource
- `referralId`: Links to referrals table
- `tier`: Set by founder (Growth/Domination/Empire)
- `saleStatus`: null/"sold"/"failed"
- `commissionAmount`: Calculated when sold (in cents)
- `commissionPaid`: Boolean flag

### Referrals Table
- `affiliateId`: Links to affiliate
- `referrerUsername`: Affiliate username
- `converted`: Boolean (set to true when booking created)

## Testing Checklist

✅ Affiliate link (`?ref=username`) stores referral in localStorage
✅ Calendly URL includes `utm_source=affiliate_username`
✅ Calendly API returns `utm_source` in tracking data
✅ `upsertBooking` finds affiliate from `utmSource` and auto-assigns
✅ Booking appears in Founder Dashboard with affiliate pre-selected
✅ Green "(automatically from Calendly)" text appears when referralId exists
✅ Booking appears in Affiliate Dashboard automatically
✅ Updates in Founder Dashboard sync to Affiliate Dashboard
✅ Commission calculates automatically when sale status = "sold"
✅ Affiliate dashboard shows commission amounts in USD

## Debugging

Check server logs for:
- `[upsertBooking] Attempting to auto-assign affiliate from utmSource: ...`
- `[upsertBooking] Found affiliate: ...`
- `[upsertBooking] Linking booking to referral ...`

If affiliate not detected:
1. Verify Calendly API token is set
2. Check that `utm_source` matches affiliate username exactly
3. Verify affiliate exists in database
4. Check browser console for localStorage and API calls

## Notes

- Manual affiliate assignment in Founder Dashboard is preserved (won't be overwritten)
- System only auto-assigns if booking doesn't have affiliate yet
- Affiliate dashboard auto-refreshes every 30 seconds to sync updates
- Commission is calculated in cents but displayed in USD













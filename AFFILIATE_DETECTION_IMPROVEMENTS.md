# Affiliate Detection Improvements

## Problem
When users clicked an affiliate link and booked through Calendly, the system wasn't automatically detecting and linking the affiliate to the booking.

## Root Causes Identified

1. **Limited Event Sync**: Only syncing "upcoming" events, missing past bookings
2. **No Google Calendar Integration**: Google Calendar events weren't being synced as bookings
3. **No Fallback Matching**: If UTM parameters weren't captured, no alternative method to link affiliate
4. **Insufficient Logging**: Hard to debug why affiliate detection wasn't working

## Solutions Implemented

### 1. Enhanced Calendly Sync ✅

**Before**: Only synced upcoming events
```typescript
async getUpcomingEvents() // Only future events
```

**After**: Syncs ALL events (past and future)
```typescript
async getAllEvents() // All events sorted by most recent first
```

**Benefits**:
- Catches bookings that were missed in previous syncs
- Ensures all historical bookings are processed
- Better for retroactive affiliate assignment

### 2. Improved UTM Tracking Logging ✅

Added comprehensive logging to see what's happening:
```typescript
console.log(`[Calendly Sync] Event ${eventUuid}: Found utm_source="${utmSource}" for ${invitee.email}`);
console.log(`[Calendly Sync] Processed ${bookings.length} bookings, ${bookings.filter(b => b.utmSource).length} with utm_source`);
```

**Benefits**:
- See exactly which bookings have UTM data
- Identify when UTM tracking fails
- Debug affiliate detection issues

### 3. Google Calendar Event Syncing ✅

**New Feature**: Sync Google Calendar events as bookings
- Extracts affiliate info from event description (format: "Affiliate: username")
- Matches attendees from Google Calendar events
- Creates bookings from Google Calendar events

**Implementation**:
```typescript
// Extract affiliate from description
const affiliateMatch = event.description.match(/Affiliate:\s*([a-zA-Z0-9_]+)/i);
if (affiliateMatch) {
  utmSource = affiliateMatch[1];
}
```

**Benefits**:
- Dual source tracking (Calendly + Google Calendar)
- Catches bookings even if Calendly API fails
- Works with manually created calendar events

### 4. Fallback Email Matching ✅

**New Feature**: If UTM tracking fails, try to match by email

**Logic**:
- If no `utmSource` found
- Check for recent unconverted referrals (within 30 days)
- If exactly ONE recent referral exists, auto-assign that affiliate
- This is a heuristic fallback when UTM tracking doesn't work

**Benefits**:
- Handles cases where UTM parameters aren't captured
- Provides backup method for affiliate detection
- Still requires manual verification for multiple referrals

### 5. Enhanced Booking Sync Endpoint ✅

**Updated**: `/api/founder/bookings` now:
1. Syncs Calendly bookings (all events)
2. Syncs Google Calendar events
3. Processes both sources for affiliate detection
4. Returns combined results

**Logging**:
```
[Booking Sync] Starting Calendly sync...
[Booking Sync] Synced X Calendly bookings
[Booking Sync] Starting Google Calendar sync...
[Booking Sync] Found Y Google Calendar events
[Booking Sync] Synced Y Google Calendar events
```

## How It Works Now

### Flow 1: Calendly Booking (Primary Method)

1. User clicks affiliate link: `/?ref=affiliate_username`
2. Referral tracked → Stored in localStorage
3. User clicks "Book Your Free Strategy Call"
4. Calendly URL includes: `?utm_source=affiliate_username&utm_medium=ref&utm_campaign=affiliate`
5. User books through Calendly
6. **Calendly API returns booking with `utm_source` in tracking data**
7. System syncs ALL Calendly events (not just upcoming)
8. `upsertBooking()` extracts `utm_source` and finds affiliate
9. Booking automatically linked to affiliate ✅

### Flow 2: Google Calendar Event (Secondary Method)

1. Booking appears in Google Calendar (from Calendly or manual)
2. Event description includes: "Affiliate: affiliate_username"
3. System syncs Google Calendar events
4. Extracts affiliate from description
5. Creates booking and links to affiliate ✅

### Flow 3: Email Fallback (Tertiary Method)

1. Booking created but no UTM data available
2. System checks for recent unconverted referrals
3. If exactly ONE recent referral exists, auto-assigns that affiliate
4. Booking linked to affiliate ✅

## Testing

### To Verify It's Working:

1. **Check Server Logs** when syncing bookings:
   ```
   [Calendly Sync] Found X events to process
   [Calendly Sync] Event abc123: Found utm_source="mojgan" for user@example.com
   [upsertBooking] ✅ Found affiliate via utmSource: mojgan (ID: ...)
   ```

2. **Test Affiliate Link**:
   - Visit: `http://localhost:3002/?ref=mojgan`
   - Click "Book Your Free Strategy Call"
   - Verify Calendly URL includes `utm_source=mojgan`
   - Book an appointment
   - Sync bookings in Founder Dashboard
   - Check logs for affiliate detection

3. **Verify in Founder Dashboard**:
   - Booking should show affiliate pre-selected
   - Green text "(automatically from Calendly)" should appear
   - Affiliate dropdown should show correct affiliate

4. **Verify in Affiliate Dashboard**:
   - Login as the affiliate
   - Booking should appear in "Your Referred Bookings"
   - Commission stats should update

## Debugging

### If Affiliate Still Not Detected:

1. **Check Calendly UTM Tracking**:
   - Look for logs: `[Calendly Sync] Event X: Found utm_source="..."`
   - If no utm_source, check if Calendly is capturing UTM parameters
   - Verify Calendly widget URL includes UTM parameters

2. **Check Affiliate Username Match**:
   - Look for logs: `[upsertBooking] ⚠️ No affiliate found with username: ...`
   - Verify affiliate username matches exactly (case-insensitive now)
   - Check database for affiliate existence

3. **Check Fallback Matching**:
   - Look for logs: `[upsertBooking] Attempting fallback: matching by email`
   - Verify recent referrals exist
   - Check if multiple referrals causing ambiguity

4. **Manual Assignment**:
   - If auto-detection fails, manually assign affiliate in Founder Dashboard
   - System preserves manual assignments

## Next Steps

1. ✅ Code improvements implemented
2. ⏳ Test with real affiliate links
3. ⏳ Monitor server logs for detection success
4. ⏳ Verify bookings appear in affiliate dashboards
5. ⏳ Test Google Calendar event syncing

## Key Files Modified

- `server/calendly-service.ts`: Added `getAllEvents()` and enhanced logging
- `server/storage.ts`: Added fallback email matching and better logging
- `server/routes.ts`: Added Google Calendar event syncing









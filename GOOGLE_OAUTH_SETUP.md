# Google OAuth Setup Guide

## Quick Summary

You need to set up OAuth credentials with Google to enable Calendar and Sheets integration. Here's how:

---

## Step 1: Get OAuth Credentials from Google Cloud

1. Go to https://console.cloud.google.com
2. Click **"Select a Project"** → **"New Project"**
3. Name it **"Kaba Content"** and create it
4. In the search bar, search for **"Google Calendar API"**
5. Click on it and press **"Enable"**
6. Do the same for **"Google Sheets API"**

---

## Step 2: Create OAuth 2.0 Client ID

1. In the left sidebar, click **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. If prompted, set up OAuth consent screen first:
   - User type: **External**
   - App name: **"Kaba Content"**
   - Developer contact: your email
   - Save and continue (skip optional fields)

4. Now create the OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **"Kaba Affiliate System"**
   - Authorized redirect URIs: Add `http://localhost:3000/oauth2callback`
   - Click **"Create"**

---

## Step 3: Copy Your Credentials

1. After creating, you'll see your credentials displayed
2. Copy the **Client ID** (long string)
3. Copy the **Client Secret** (another long string)

Add both to Replit Secrets:
- Go to Secrets (lock icon) in left sidebar
- Click **"+ Create Secret"**
- Add: `GOOGLE_CLIENT_ID` = (your Client ID)
- Add: `GOOGLE_CLIENT_SECRET` = (your Client Secret)

---

## Step 4: Get Your Access Token

Once you've added the Client ID and Secret to Secrets, run this in the Replit terminal:

```bash
npx tsx server/google-oauth-setup.ts
```

The script will:
1. Show you a URL to click
2. You authorize the app in your browser
3. It redirects back and displays your **Access Token**
4. Copy that token

---

## Step 5: Add Token to Secrets

Go back to Secrets and add:
- `GOOGLE_CALENDAR_TOKEN` = (paste the Access Token from step 4)

---

## Optional: Long-term Token

The script also shows a **Refresh Token**. If you want to avoid running the setup script again later, save:
- `GOOGLE_REFRESH_TOKEN` = (paste the Refresh Token)

---

## Done! 🎉

Once you've added the `GOOGLE_CALENDAR_TOKEN` to Secrets:
1. Restart the app
2. When someone books an appointment, it will automatically:
   - Create a calendar event in your Google Calendar
   - Log the booking to your Google Sheet

---

## Troubleshooting

**"Cannot find googleapis module"**
- Run: `npm install googleapis`
- Or just follow the simpler approach below

**Alternative: Get Token Manually**

If the script doesn't work, you can get the token manually:

1. After setting up OAuth in Google Cloud Console, go here (replace with your CLIENT_ID):
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/spreadsheets&access_type=offline
```

2. Authorize the app
3. You'll get a code like: `code=4/0AY0e...`
4. Copy that code and go here (replace with your credentials):
```
https://oauth2.googleapis.com/token?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=4/0AY0e...&grant_type=authorization_code&redirect_uri=http://localhost:3000/oauth2callback
```

5. This will return JSON with your `access_token`
6. Add to Secrets: `GOOGLE_CALENDAR_TOKEN` = (that token)

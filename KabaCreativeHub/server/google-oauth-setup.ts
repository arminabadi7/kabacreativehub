import { google } from "googleapis";
import * as http from "http";
import * as url from "url";
import * as readline from "readline";

// These credentials you'll get from Google Cloud Console
// You need to have set up OAuth2 credentials there first
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URL = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// Scopes needed for Calendar and Sheets access
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
];

async function getAccessToken() {
  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n🔐 Google OAuth Setup\n");
  console.log("1. Open this URL in your browser:");
  console.log(`   ${authorizeUrl}\n`);
  console.log("2. Authorize the application");
  console.log("3. You'll be redirected to a URL starting with 'http://localhost:3000/?code='");
  console.log("4. Copy the full redirected URL and paste it here:\n");

  // Create a simple HTTP server to handle the callback
  const server = http.createServer(async (req, res) => {
    if (req.url && req.url.indexOf("/oauth2callback") > -1) {
      const queryObject = url.parse(req.url, true).query;
      const code = queryObject.code as string;

      if (!code) {
        res.end("Error: No code received");
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log("\n✅ Successfully authenticated!\n");
        console.log("Access Token:");
        console.log("================");
        console.log(tokens.access_token);
        console.log("================\n");
        
        if (tokens.refresh_token) {
          console.log("Refresh Token (save this for long-term use):");
          console.log("================");
          console.log(tokens.refresh_token);
          console.log("================\n");
        }

        console.log("📝 Instructions:");
        console.log("1. Go to Replit Secrets (lock icon in sidebar)");
        console.log("2. Click '+ Create Secret'");
        console.log("3. Add: GOOGLE_CALENDAR_TOKEN = (paste the Access Token above)\n");

        if (tokens.refresh_token) {
          console.log("4. Optionally add for long-term use:");
          console.log("   GOOGLE_REFRESH_TOKEN = (paste the Refresh Token above)\n");
        }

        res.end("✅ Authorization successful! Check your terminal for the tokens. You can close this window.");
        server.close();
        process.exit(0);
      } catch (e) {
        console.error("Error getting tokens:", e);
        res.end("❌ Error getting tokens. Check the terminal.");
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(3000, () => {
    console.log("Waiting for authorization callback on http://localhost:3000...\n");
  });
}

// Run the setup
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: Missing Google OAuth credentials!\n");
  console.error("To fix this:\n");
  console.error("1. Go to https://console.cloud.google.com");
  console.error("2. Create a new project or select existing one");
  console.error("3. Enable these APIs:");
  console.error("   - Google Calendar API");
  console.error("   - Google Sheets API");
  console.error("4. Go to Credentials → Create OAuth 2.0 Client ID → Web application");
  console.error("5. Add http://localhost:3000/oauth2callback to Authorized redirect URIs");
  console.error("6. Download credentials and add to Replit Secrets:");
  console.error("   - GOOGLE_CLIENT_ID");
  console.error("   - GOOGLE_CLIENT_SECRET\n");
  process.exit(1);
}

getAccessToken().catch(console.error);

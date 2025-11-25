import { google } from 'googleapis';
import type { Appointment } from "@shared/schema";

let calendarConnectionSettings: any;
let sheetsConnectionSettings: any;

async function getCalendarAccessToken() {
  if (calendarConnectionSettings && calendarConnectionSettings.settings.expires_at && new Date(calendarConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return calendarConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    console.warn('X_REPLIT_TOKEN not found for Google Calendar');
    return null;
  }

  try {
    calendarConnectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = calendarConnectionSettings?.settings?.access_token || calendarConnectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!calendarConnectionSettings || !accessToken) {
      console.warn('Google Calendar not connected');
      return null;
    }
    return accessToken;
  } catch (error) {
    console.error('Error fetching Calendar access token:', error);
    return null;
  }
}

async function getSheetsAccessToken() {
  if (sheetsConnectionSettings && sheetsConnectionSettings.settings.expires_at && new Date(sheetsConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return sheetsConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    console.warn('X_REPLIT_TOKEN not found for Google Sheets');
    return null;
  }

  try {
    sheetsConnectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = sheetsConnectionSettings?.settings?.access_token || sheetsConnectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!sheetsConnectionSettings || !accessToken) {
      console.warn('Google Sheet not connected');
      return null;
    }
    return accessToken;
  } catch (error) {
    console.error('Error fetching Sheets access token:', error);
    return null;
  }
}

export async function getGoogleCalendarClient() {
  const accessToken = await getCalendarAccessToken();
  if (!accessToken) return null;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

async function getGoogleSheetClient() {
  const accessToken = await getSheetsAccessToken();
  if (!accessToken) return null;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface GoogleCalendarService {
  createEvent(
    appointment: Appointment,
    timezone: string
  ): Promise<string | undefined>;
}

export interface GoogleSheetsService {
  appendBooking(
    appointment: Appointment,
    formResponses: any
  ): Promise<string | undefined>;
}

export class GoogleCalendarClient implements GoogleCalendarService {
  async createEvent(
    appointment: Appointment,
    timezone: string
  ): Promise<string | undefined> {
    try {
      const calendar = await getGoogleCalendarClient();
      if (!calendar) {
        console.warn('Google Calendar client not available, skipping event creation');
        return undefined;
      }

      const startTime = new Date(appointment.appointmentTime);
      const endTime = new Date(startTime.getTime() + 30 * 60000);

      const event = {
        summary: `Strategy Call with ${appointment.attendeeName}`,
        description: `30-minute strategy call\nEmail: ${appointment.attendeeEmail}\nAffiliate: ${appointment.affiliateUsername || 'Direct'}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: timezone,
        },
        attendees: [{ email: appointment.attendeeEmail }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all',
      });

      console.log('✓ Created Google Calendar event:', response.data.id);
      return response.data.id || undefined;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return undefined;
    }
  }
}

export class GoogleSheetsClient implements GoogleSheetsService {
  async appendBooking(
    appointment: Appointment,
    formResponses: any
  ): Promise<string | undefined> {
    try {
      const sheets = await getGoogleSheetClient();
      if (!sheets) {
        console.warn('Google Sheets client not available, skipping sheet update');
        return undefined;
      }

      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || "";
      if (!spreadsheetId) {
        console.warn('GOOGLE_SHEETS_ID not configured, skipping sheet update');
        return undefined;
      }

      const values = [[
        new Date(appointment.appointmentTime).toLocaleString(),
        appointment.attendeeName,
        appointment.attendeeEmail,
        appointment.affiliateUsername || 'Direct',
        appointment.status,
        JSON.stringify(formResponses),
      ]];

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Bookings!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      console.log('✓ Added booking to Google Sheets:', response.data.updates?.updatedRows);
      return response.data.updates?.updatedRows?.toString();
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      return undefined;
    }
  }
}

export const googleCalendarClient = new GoogleCalendarClient();
export const googleSheetsClient = new GoogleSheetsClient();

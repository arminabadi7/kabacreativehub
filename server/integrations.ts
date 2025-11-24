import type { Appointment } from "@shared/schema";

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
  private accessToken: string = "";

  async createEvent(
    appointment: Appointment,
    timezone: string
  ): Promise<string | undefined> {
    // Would use Google Calendar API with access token from integration
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Strategy Call with ${appointment.attendeeName}`,
          description: `30-minute strategy call\nEmail: ${appointment.attendeeEmail}`,
          start: {
            dateTime: new Date(appointment.appointmentTime).toISOString(),
            timeZone: timezone,
          },
          end: {
            dateTime: new Date(new Date(appointment.appointmentTime).getTime() + 30 * 60000).toISOString(),
            timeZone: timezone,
          },
          attendees: [{ email: appointment.attendeeEmail }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
    }

    return undefined;
  }
}

export class GoogleSheetsClient implements GoogleSheetsService {
  private accessToken: string = "";

  async appendBooking(
    appointment: Appointment,
    formResponses: any
  ): Promise<string | undefined> {
    // Would use Google Sheets API with access token from integration
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || "";
      if (!spreadsheetId) return undefined;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bookings!A:Z:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[
              appointment.attendeeName,
              appointment.attendeeEmail,
              new Date(appointment.appointmentTime).toLocaleString(),
              appointment.affiliateUsername || "",
              JSON.stringify(formResponses),
            ]],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.updates?.updatedRows?.toString();
      }
    } catch (error) {
      console.error("Error appending to Google Sheets:", error);
    }

    return undefined;
  }
}

export const googleCalendarClient = new GoogleCalendarClient();
export const googleSheetsClient = new GoogleSheetsClient();

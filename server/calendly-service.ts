export interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    address?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
  rescheduled: boolean;
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  timezone?: string;
  text_reminder_number?: string;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
    salesforce_uuid?: string;
  };
}

export class CalendlyService {
  private apiToken: string;
  private baseUrl = "https://api.calendly.com";
  private userUri?: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Calendly API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getCurrentUser() {
    const data = await this.request("/users/me");
    this.userUri = data.resource.uri;
    return data.resource;
  }

  async getUpcomingEvents(pageSize = 100) {
    if (!this.userUri) {
      await this.getCurrentUser();
    }

    const response = await this.request(
      `/scheduled_events?user=${encodeURIComponent(this.userUri!)}&status=active&count=${pageSize}&sort=start_time:asc`
    );

    return response.collection as CalendlyEvent[];
  }

  async getAllEvents(pageSize = 100) {
    if (!this.userUri) {
      await this.getCurrentUser();
    }

    // Get all events (past and future) to catch bookings that might have been missed
    const response = await this.request(
      `/scheduled_events?user=${encodeURIComponent(this.userUri!)}&count=${pageSize}&sort=start_time:desc`
    );

    return response.collection as CalendlyEvent[];
  }

  async getEventInvitees(eventUri: string) {
    // Extract the event UUID from the full URI
    const eventUuid = eventUri.split('/').pop();
    const response = await this.request(`/scheduled_events/${eventUuid}/invitees`);
    return response.collection as CalendlyInvitee[];
  }

  async getEventDetails(eventUri: string) {
    const response = await this.request(`${eventUri}`);
    return response.resource;
  }

  async syncBookings() {
    try {
      // Get all events (past and future) to ensure we catch all bookings
      const events = await this.getAllEvents();
      const bookings = [];

      console.log(`[Calendly Sync] Found ${events.length} events to process`);

      for (const event of events) {
        const invitees = await this.getEventInvitees(event.uri);
        const invitee = invitees[0];

        if (invitee) {
          // Extract just the UUID from the full URI
          const eventUuid = event.uri.split('/').pop() || event.uri;
          
          const utmSource = invitee.tracking?.utm_source;
          
          // Log UTM tracking data for debugging
          if (utmSource) {
            console.log(`[Calendly Sync] Event ${eventUuid}: Found utm_source="${utmSource}" for ${invitee.email}`);
          } else {
            console.log(`[Calendly Sync] Event ${eventUuid}: No utm_source found for ${invitee.email}`);
            if (invitee.tracking) {
              console.log(`[Calendly Sync] Available tracking data:`, JSON.stringify(invitee.tracking));
            }
          }
          
          bookings.push({
            id: eventUuid,
            eventName: event.name,
            attendeeName: invitee.name,
            attendeeEmail: invitee.email,
            eventTime: event.start_time,
            appointmentTime: event.start_time,
            status: event.status,
            timezone: invitee.timezone,
            utmSource: utmSource,
            createdAt: event.created_at,
            updatedAt: event.updated_at,
          });
        }
      }

      console.log(`[Calendly Sync] Processed ${bookings.length} bookings, ${bookings.filter(b => b.utmSource).length} with utm_source`);
      return bookings;
    } catch (error) {
      console.error("Error syncing Calendly bookings:", error);
      return [];
    }
  }
}

export function getCalendlyService() {
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) {
    console.warn("CALENDLY_API_TOKEN not configured");
    return null;
  }
  return new CalendlyService(token);
}

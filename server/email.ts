export interface EmailService {
  sendConfirmationEmail(
    attendeeName: string,
    attendeeEmail: string,
    appointmentTime: Date,
    timezone: string
  ): Promise<void>;

  sendReminderEmail(
    attendeeName: string,
    attendeeEmail: string,
    appointmentTime: Date,
    timezone: string
  ): Promise<void>;
}

export class ResendEmailService implements EmailService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
  }

  async sendConfirmationEmail(
    attendeeName: string,
    attendeeEmail: string,
    appointmentTime: Date,
    timezone: string
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: "kaba@kabacontent.com",
          to: attendeeEmail,
          subject: "Your Strategy Call is Scheduled!",
          html: `
            <h2>Hi ${attendeeName},</h2>
            <p>Your 30-minute strategy call with Kaba Content is confirmed!</p>
            <p><strong>Time:</strong> ${appointmentTime.toLocaleString('en-US', { timeZone: timezone })}</p>
            <p>You'll receive a reminder 24 hours before the call.</p>
            <p>Looking forward to discussing how we can help you dominate your niche!</p>
            <p>Best regards,<br/>Kaba Content Team</p>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send confirmation email:", error);
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }

  async sendReminderEmail(
    attendeeName: string,
    attendeeEmail: string,
    appointmentTime: Date,
    timezone: string
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: "kaba@kabacontent.com",
          to: attendeeEmail,
          subject: "Reminder: Your Strategy Call is Tomorrow!",
          html: `
            <h2>Hi ${attendeeName},</h2>
            <p>This is a friendly reminder that your strategy call with Kaba Content is happening tomorrow!</p>
            <p><strong>Time:</strong> ${appointmentTime.toLocaleString('en-US', { timeZone: timezone })}</p>
            <p>Get ready to discuss how the mass-content system can help you reach 1-2M views monthly!</p>
            <p>See you soon!<br/>Kaba Content Team</p>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send reminder email:", error);
      }
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  }
}

export const emailService = new ResendEmailService();

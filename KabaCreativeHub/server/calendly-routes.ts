import type { Express } from "express";
import { getCalendlyService } from "./calendly-service";

export function registerCalendlyRoutes(app: Express) {
  app.get("/api/founder/calendly/bookings", async (req, res) => {
    try {
      const calendly = getCalendlyService();
      if (!calendly) {
        return res.status(400).json({ error: "Calendly API not configured" });
      }

      const bookings = await calendly.syncBookings();
      return res.json(bookings);
    } catch (error) {
      console.error("Error fetching Calendly bookings:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/affiliates/:username/calendly-bookings", async (req, res) => {
    try {
      const { username } = req.params;
      const calendly = getCalendlyService();
      if (!calendly) {
        return res.status(400).json({ error: "Calendly API not configured" });
      }

      const bookings = await calendly.syncBookings();

      // Filter bookings by affiliate username from UTM source
      const affiliateBookings = bookings.filter(
        (booking) => booking.utmSource === username
      );

      return res.json(affiliateBookings);
    } catch (error) {
      console.error("Error fetching affiliate Calendly bookings:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
}

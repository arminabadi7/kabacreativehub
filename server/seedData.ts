import { storage } from "./storage";

export async function seedInitialData() {
  try {
    // Check if availability already exists
    const existing = await storage.getAvailability();
    if (existing.length > 0) {
      console.log("Availability already seeded");
      return;
    }

    // Seed 7 days of availability (00:00 - 23:45)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 7; i++) {
      await storage.updateAvailability(i, "00:00", "23:45", true);
    }
    console.log("✓ Seeded 7 days of availability (00:00 - 23:45)");

    // Seed default booking questions
    const defaultQuestions = [
      {
        question: "What is your Instagram, YouTube, or main social media handle?",
        questionType: "short_answer",
        isRequired: true,
        order: 0,
      },
      {
        question: "What country/timezone are you located in?",
        questionType: "short_answer",
        isRequired: true,
        order: 1,
      },
      {
        question: "What niche or industry are you in? (Be as specific as possible.)",
        questionType: "paragraph",
        isRequired: true,
        order: 2,
      },
      {
        question: "How would you describe what you do in one sentence?",
        questionType: "short_answer",
        isRequired: true,
        order: 3,
      },
      {
        question: "Do you currently sell a product, service, or coaching program? If yes, what is it?",
        questionType: "paragraph",
        isRequired: true,
        order: 4,
      },
      {
        question: "What is your CURRENT monthly revenue?",
        questionType: "multiple_choice",
        options: "$0–5,000,$5,000–20,000,$20,000–50,000,$50,000–100,000,$100,000+",
        isRequired: true,
        order: 5,
      },
      {
        question: "What is your TARGET monthly revenue in the next 6–12 months?",
        questionType: "short_answer",
        isRequired: true,
        order: 6,
      },
      {
        question: "What is your main customer acquisition method right now?",
        questionType: "checkboxes",
        options: "Organic content,Referrals,Paid ads,Email list,TikTok / Reels,Youtube long-form,Other",
        isRequired: true,
        order: 7,
      },
      {
        question: "How often are you currently posting content across all platforms?",
        questionType: "multiple_choice",
        options: "I don't post,1-5 times per week,5-20 times per week,20+ times per week,I post inconsistently",
        isRequired: true,
        order: 8,
      },
      {
        question: "If we decide this is a good fit, are you prepared to get started on the call?",
        questionType: "multiple_choice",
        options: "Yes,Yes if it makes sense,I need time to think,Not yet",
        isRequired: true,
        order: 9,
      },
    ];

    for (const q of defaultQuestions) {
      await storage.createBookingQuestion(q as any);
    }
    console.log("✓ Seeded 10 default booking questions");

    // Seed founder settings
    await storage.updateFounderSettings({
      timeFormat: "12h",
      meetingDuration: 30,
      bufferTime: 20,
      timezone: "America/Toronto",
    });
    console.log("✓ Seeded founder settings");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

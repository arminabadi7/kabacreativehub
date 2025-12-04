import { storage } from "./storage";
import { db } from "./db";
import { clips, projects, clients, issues, tasks, issueTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedInitialData() {
  try {
    // Check if availability already exists
    try {
      const existing = await storage.getAvailability();
      if (existing.length === 0) {
        // Seed 7 days of availability (00:00 - 23:45)
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        for (let i = 0; i < 7; i++) {
          await storage.updateAvailability(i, "00:00", "23:45", true);
        }
        console.log("✓ Seeded 7 days of availability (00:00 - 23:45)");
      } else {
        console.log("Availability already seeded");
      }
    } catch (error) {
      console.warn("Could not check existing availability, proceeding with seed");
    }

    // Seed default booking questions
    try {
      const existingQuestions = await storage.getBookingQuestions();
      if (existingQuestions.length === 0) {
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
      } else {
        console.log("Booking questions already seeded");
      }
    } catch (error) {
      console.warn("Could not seed booking questions:", error);
    }

    // Seed founder settings
    try {
      const existingSettings = await storage.getFounderSettings();
      if (!existingSettings) {
        await storage.updateFounderSettings({
          timeFormat: "12h",
          meetingDuration: 30,
          bufferTime: 20,
          timezone: "America/Toronto",
        });
        console.log("✓ Seeded founder settings");
      } else {
        console.log("Founder settings already seeded");
      }
    } catch (error) {
      console.warn("Could not seed founder settings:", error);
    }

    // Seed templates
    try {
      const existingTemplates = await storage.getAllTemplates();
      if (existingTemplates.length > 0) {
        console.log("Templates already seeded");
      } else {
        const templates = [
          { name: "Gary Short Video", title: "Gary Short Video" },
          { name: "Patrick Short Video", title: "Patrick Short Video" },
          { name: "Drew Short Video", title: "Drew Short Video" },
          { name: "Uptin Short Video", title: "Uptin Short Video" },
        ];

        const templateTasks = [
          { name: "Video Selection", points: 2, priority: "no_priority", order: 0 },
          { name: "Translate", points: 15, priority: "no_priority", order: 1 },
          { name: "Dub", points: 10, priority: "no_priority", order: 2 },
          { name: "Edit", points: 30, priority: "no_priority", order: 3 },
          { name: "Admin", points: 5, priority: "no_priority", order: 4 },
        ];

        // Set updatedAt to 2 days ago to match the image
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        for (const templateData of templates) {
          const template = await storage.createTemplate({
            name: templateData.name,
            title: templateData.title,
            description: null,
            videoUrl: null,
            videoDuration: "0:01:00",
          });

          // Directly update the template's updatedAt to 2 days ago
          await db
            .update(issueTemplates)
            .set({ updatedAt: twoDaysAgo })
            .where(eq(issueTemplates.id, template.id));

          // Add tasks to each template
          for (const taskData of templateTasks) {
            await storage.createTemplateTask(template.id, {
              ...taskData,
              assignedTo: null,
            });
          }
        }
        console.log("✓ Seeded 4 templates with tasks");
      }
    } catch (error) {
      console.warn("Could not seed templates:", error);
    }

    // Seed sample clients with social media accounts (needed for projects)
    let sampleClient1, sampleClient2, sampleClient3;
    try {
      const existingClients = await storage.getAllClients();
      if (existingClients.length === 0) {
        const defaultPassword = "password123";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const sampleClients = [
          {
            username: "john_doe",
            email: "john.doe@example.com",
            fullName: "John Doe",
            tier: "Growth",
            passwordHash,
          },
          {
            username: "sarah_smith",
            email: "sarah.smith@example.com",
            fullName: "Sarah Smith",
            tier: "Domination",
            passwordHash,
          },
          {
            username: "mike_johnson",
            email: "mike.johnson@example.com",
            fullName: "Mike Johnson",
            tier: "Empire",
            passwordHash,
          },
        ];

        const createdClients = [];
        for (const clientData of sampleClients) {
          const [client] = await db.insert(clients).values(clientData).returning();
          createdClients.push(client);
        }

        sampleClient1 = createdClients[0];
        sampleClient2 = createdClients[1];
        sampleClient3 = createdClients[2];

        // Add social media accounts for each client
        await storage.createSocialMediaAccount({
          clientId: createdClients[0].id,
          accountName: "Main Account",
          username: "johndoe_official",
          password: "john_pass_123",
          platforms: JSON.stringify(["instagram", "tiktok"]),
        });

        await storage.createSocialMediaAccount({
          clientId: createdClients[1].id,
          accountName: "Primary Account",
          username: "sarahsmith",
          password: "sarah_pass_2024",
          platforms: JSON.stringify(["instagram", "tiktok", "youtube", "facebook"]),
        });

        await storage.createSocialMediaAccount({
          clientId: createdClients[2].id,
          accountName: "Business Account",
          username: "mikejohnson",
          password: "mike_pass_2024",
          platforms: JSON.stringify(["youtube", "facebook", "instagram"]),
        });

        console.log("✓ Seeded 3 sample clients with social media accounts");
      } else {
        sampleClient1 = existingClients[0];
        sampleClient2 = existingClients[1] || existingClients[0];
        sampleClient3 = existingClients[2] || existingClients[0];
        console.log("Clients already exist, using existing clients");
      }
    } catch (error) {
      console.warn("Could not seed clients:", error);
      // Fallback: try to get any existing clients
      try {
        const allClients = await storage.getAllClients();
        sampleClient1 = allClients[0];
        sampleClient2 = allClients[1] || allClients[0];
        sampleClient3 = allClients[2] || allClients[0];
      } catch {
        console.error("Could not get clients for projects");
      }
    }

    // Seed projects and clips
    try {

      const existingProjects = await storage.getAllProjects();
      
      // Create "Drew Farsi" project if it doesn't exist
      let drewFarsiProject = existingProjects.find((p) => p.name === "Drew Farsi");
      if (!drewFarsiProject) {
        drewFarsiProject = await storage.createProject({
          name: "Drew Farsi",
          description: "Drew Farsi content project",
          clientId: sampleClient1.id,
          fileLink: "/Projects/DrewFarsi",
        });
        console.log("✓ Created Drew Farsi project");
      }

      // Create sample projects for clipping area (linked to clients)
      const clippingProjects = [
        {
          name: `${sampleClient1.fullName || sampleClient1.username} - Episode 01`,
          description: `Sample project for clipping - Episode 1 (${sampleClient1.fullName || sampleClient1.username})`,
          clientId: sampleClient1.id,
          fileLink: `/Projects/${sampleClient1.username}/Episode_01`,
        },
        {
          name: `${sampleClient2.fullName || sampleClient2.username} - Episode 05`,
          description: `Sample project for clipping - Episode 5 (${sampleClient2.fullName || sampleClient2.username})`,
          clientId: sampleClient2.id,
          fileLink: `/Projects/${sampleClient2.username}/Episode_05`,
        },
        {
          name: `${sampleClient3.fullName || sampleClient3.username} - Episode 12`,
          description: `Sample project for clipping - Episode 12 (${sampleClient3.fullName || sampleClient3.username})`,
          clientId: sampleClient3.id,
          fileLink: `/Projects/${sampleClient3.username}/Episode_12`,
        },
      ];

      const createdProjects = [];
      for (const projectData of clippingProjects) {
        const existing = existingProjects.find((p) => p.name === projectData.name);
        if (!existing) {
          const project = await storage.createProject(projectData);
          createdProjects.push(project);
        } else {
          createdProjects.push(existing);
        }
      }

      // Create sample clips for each project
      const existingClips = await db.select().from(clips).limit(1);
      if (existingClips.length === 0) {
        // Project 1: First client's project - Mix of pending, valid, and invalid clips
        const project1Clips = [
          { clipNumber: 1, filePath: `${createdProjects[0].fileLink}/Clip_001.mp4`, status: "pending" },
          { clipNumber: 2, filePath: `${createdProjects[0].fileLink}/Clip_002.mp4`, status: "valid" },
          { clipNumber: 3, filePath: `${createdProjects[0].fileLink}/Clip_003.mp4`, status: "pending" },
          { clipNumber: 4, filePath: `${createdProjects[0].fileLink}/Clip_004.mp4`, status: "invalid", invalidNote: "Audio quality too low" },
          { clipNumber: 5, filePath: `${createdProjects[0].fileLink}/Clip_005.mp4`, status: "valid" },
        ];

        // Project 2: Second client's project - All pending
        const project2Clips = [
          { clipNumber: 1, filePath: `${createdProjects[1].fileLink}/Clip_001.mp4`, status: "pending" },
          { clipNumber: 2, filePath: `${createdProjects[1].fileLink}/Clip_002.mp4`, status: "pending" },
          { clipNumber: 3, filePath: `${createdProjects[1].fileLink}/Clip_003.mp4`, status: "pending" },
        ];

        // Project 3: Third client's project - Mix of statuses
        const project3Clips = [
          { clipNumber: 1, filePath: `${createdProjects[2].fileLink}/Clip_001.mp4`, status: "valid" },
          { clipNumber: 2, filePath: `${createdProjects[2].fileLink}/Clip_002.mp4`, status: "valid" },
          { clipNumber: 3, filePath: `${createdProjects[2].fileLink}/Clip_003.mp4`, status: "invalid", invalidNote: "Video too short" },
          { clipNumber: 4, filePath: `${createdProjects[2].fileLink}/Clip_004.mp4`, status: "pending" },
        ];

        // Insert clips for each project (only if projects were created/found)
        if (createdProjects.length >= 3) {
          for (const clipData of project1Clips) {
            await storage.createClip({
              ...clipData,
              projectId: createdProjects[0].id,
            });
          }

          for (const clipData of project2Clips) {
            await storage.createClip({
              ...clipData,
              projectId: createdProjects[1].id,
            });
          }

          for (const clipData of project3Clips) {
            await storage.createClip({
              ...clipData,
              projectId: createdProjects[2].id,
            });
          }

          console.log(`✓ Seeded ${project1Clips.length + project2Clips.length + project3Clips.length} sample clips across 3 projects`);
        } else {
          console.warn("Not enough projects created to seed clips");
        }

      } else {
        console.log("Clips already seeded");
      }

      // Seed sample issues for Drew Farsi project
      const existingIssues = await db.select().from(issues).where(eq(issues.projectId, drewFarsiProject.id)).limit(1);
      if (existingIssues.length === 0) {
        // Set date to Sep 15 (2024)
        const sep15 = new Date("2024-09-15");

        // Create "Afghanistan" issue in Backlog
        const [afghanistanIssue] = await db.insert(issues).values({
          projectId: drewFarsiProject.id,
          title: "Afghanistan",
          description: null,
          status: "backlog",
          order: 0,
          videoDuration: "0:01:00",
          createdAt: sep15,
          updatedAt: sep15,
        }).returning();

        // Create tasks for Afghanistan
        const afghanistanTasks = [
          { name: "Video Selection", points: 2, order: 0 },
          { name: "Translate", points: 15, order: 1 },
          { name: "Dub", points: 10, order: 2 },
          { name: "Edit", points: 30, order: 3 },
          { name: "Admin", points: 5, order: 4 },
        ];

        for (const taskData of afghanistanTasks) {
          await db.insert(tasks).values({
            issueId: afghanistanIssue.id,
            name: taskData.name,
            points: taskData.points,
            priority: "no_priority",
            assignedTo: null,
            isCompleted: false,
            order: taskData.order,
          });
        }

        // Create "Balouchestan" issue in Unstarted
        const [balouchestanIssue] = await db.insert(issues).values({
          projectId: drewFarsiProject.id,
          title: "Balouchestan",
          description: null,
          status: "unstarted",
          order: 0,
          videoDuration: "0:02:00",
          createdAt: sep15,
          updatedAt: sep15,
        }).returning();

        // Create tasks for Balouchestan
        const balouchestanTasks = [
          { name: "Video Selection", points: 4, order: 0 },
          { name: "Translate", points: 30, order: 1 },
          { name: "Dub", points: 20, order: 2 },
          { name: "Edit", points: 60, order: 3 },
          { name: "Admin", points: 10, order: 4 },
        ];

        for (const taskData of balouchestanTasks) {
          await db.insert(tasks).values({
            issueId: balouchestanIssue.id,
            name: taskData.name,
            points: taskData.points,
            priority: "no_priority",
            assignedTo: null,
            isCompleted: false,
            order: taskData.order,
          });
        }

        console.log("✓ Seeded 2 sample issues (Afghanistan, Balouchestan) with tasks");
      } else {
        console.log("Issues already seeded");
      }
    } catch (error) {
      console.warn("Could not seed projects/clips/issues:", error);
    }

  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

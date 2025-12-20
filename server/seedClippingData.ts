import { storage } from "./storage";
import { db } from "./db";
import { clips, projects, clients } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedClippingData() {
  try {
    console.log("🌱 Starting to seed clipping area data...");

    // Get or create a sample client
    let sampleClient = await storage.getClientByUsername("sample_client");
    if (!sampleClient) {
      const passwordHash = await bcrypt.hash("password123", 10);
      sampleClient = await storage.createClient({
        username: "sample_client",
        email: "sample@example.com",
        fullName: "Sample Client",
        tier: "Growth",
        passwordHash,
      });
      console.log("✓ Created sample client");
    } else {
      console.log("✓ Sample client already exists");
    }

    // Create sample projects
    const sampleProjects = [
      {
        name: "Client1 - Episode_01",
        description: "Sample project for Episode 1",
        clientId: sampleClient.id,
        fileLink: "/Projects/Client1/Episode_01",
      },
      {
        name: "Client1 - Episode_02",
        description: "Sample project for Episode 2",
        clientId: sampleClient.id,
        fileLink: "/Projects/Client1/Episode_02",
      },
      {
        name: "Client2 - Episode_05",
        description: "Sample project for Episode 5",
        clientId: sampleClient.id,
        fileLink: "/Projects/Client2/Episode_05",
      },
    ];

    const createdProjects = [];
    for (const projectData of sampleProjects) {
      const existing = await db
        .select()
        .from(projects)
        .where(eq(projects.name, projectData.name))
        .limit(1);

      if (existing.length === 0) {
        const project = await storage.createProject(projectData);
        createdProjects.push(project);
        console.log(`✓ Created project: ${projectData.name}`);
      } else {
        createdProjects.push(existing[0]);
        console.log(`✓ Project already exists: ${projectData.name}`);
      }
    }

    // Create sample clips with pending status for each project
    for (const project of createdProjects) {
      // Check how many pending clips exist for this project
      const existingPendingClips = await db
        .select()
        .from(clips)
        .where(and(eq(clips.projectId, project.id), eq(clips.status, "pending")));

      // Always ensure at least 5 pending clips exist (matching the photo)
      if (existingPendingClips.length < 5) {
        const clipsToCreate = 5 - existingPendingClips.length;
        const maxClipNumber = existingPendingClips.length > 0 
          ? Math.max(...existingPendingClips.map(c => c.clipNumber))
          : 0;

        for (let i = 1; i <= clipsToCreate; i++) {
          const clipNumber = maxClipNumber + i;
          await storage.createClip({
            projectId: project.id,
            clipNumber: clipNumber,
            filePath: `${project.fileLink}/Clip_00${clipNumber}.mp4`,
            status: "pending",
          });
        }
        console.log(`✓ Created ${clipsToCreate} pending clips for project: ${project.name} (now has 5 pending)`);
      } else {
        console.log(`✓ Project ${project.name} already has ${existingPendingClips.length} pending clips`);
      }
    }

    console.log("✅ Clipping area data seeded successfully!");
    return { success: true, projectsCreated: createdProjects.length };
  } catch (error) {
    console.error("❌ Error seeding clipping data:", error);
    throw error;
  }
}

// Note: This file is imported as an ES module, so we don't check for direct execution
// The function is called from server/index.ts




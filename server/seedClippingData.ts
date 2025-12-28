import { storage } from "./storage";
import { db } from "./db";
import { clips, projects, clients } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedClippingData() {
  try {
    console.log("🌱 Starting to seed clipping area data...");

    // Get or create a sample client
    let sampleClient;
    try {
      sampleClient = await storage.getClientByUsername("sample_client");
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
    } catch (clientError: any) {
      console.error("⚠️  Error with sample client:", clientError?.message || clientError);
      // If we can't get/create the client, we can't proceed with seeding
      throw new Error(`Failed to get or create sample client: ${clientError?.message || clientError}`);
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
      try {
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
      } catch (projectError: any) {
        console.error(`⚠️  Error processing project ${projectData.name}:`, projectError?.message || projectError);
        // Continue with next project instead of failing entirely
      }
    }
    
    if (createdProjects.length === 0) {
      console.warn("⚠️  No projects were created or found. Skipping clip seeding.");
      return { success: true, projectsCreated: 0, warning: "No projects available for seeding" };
    }

    // Create sample clips with pending status for each project
    for (const project of createdProjects) {
      try {
        // Check how many pending clips exist for this project
        // Use raw SQL to avoid selecting title column which may not exist
        // Escape the project ID to prevent SQL injection
        const projectIdEscaped = String(project.id).replace(/'/g, "''");
        const existingPendingClipsResult = await db.execute(sql.raw(`
          SELECT id, project_id, file_path, clip_number, status, invalid_note, validated_by, validated_at, issue_id, created_at
          FROM clips
          WHERE project_id = '${projectIdEscaped}' AND status = 'pending'
        `));
        const existingPendingClips = existingPendingClipsResult.rows || [];

        // Always ensure at least 5 pending clips exist (matching the photo)
        if (existingPendingClips.length < 5) {
          const clipsToCreate = 5 - existingPendingClips.length;
          const maxClipNumber = existingPendingClips.length > 0 
            ? Math.max(...existingPendingClips.map((c: any) => c.clip_number || 0))
            : 0;

          let clipsCreated = 0;
          for (let i = 1; i <= clipsToCreate; i++) {
            try {
              const clipNumber = maxClipNumber + i;
              await storage.createClip({
                projectId: project.id,
                clipNumber: clipNumber,
                filePath: `${project.fileLink}/Clip_00${clipNumber}.mp4`,
                status: "pending",
              });
              clipsCreated++;
            } catch (clipError: any) {
              console.error(`⚠️  Failed to create clip ${i} for project ${project.name}:`, clipError?.message || clipError);
              // Continue with next clip instead of failing entirely
            }
          }
          if (clipsCreated > 0) {
            console.log(`✓ Created ${clipsCreated} pending clips for project: ${project.name} (target was ${clipsToCreate})`);
          }
        } else {
          console.log(`✓ Project ${project.name} already has ${existingPendingClips.length} pending clips`);
        }
      } catch (projectClipError: any) {
        console.error(`⚠️  Error seeding clips for project ${project.name}:`, projectClipError?.message || projectClipError);
        // Continue with next project instead of failing entirely
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






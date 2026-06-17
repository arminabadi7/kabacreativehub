import { storage } from "./storage";
import { db } from "./db";
import { clips, projects, clients, issues, tasks, issueTemplates, templateTasks, teams, members } from "@shared/schema";
import { eq, and } from "drizzle-orm";
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

    // Seed teams
    try {
      const existingTeams = await storage.getAllTeams();
      if (existingTeams.length === 0) {
        const defaultTeams = [
          { name: "Persian", description: "Persian language team" },
          { name: "English", description: "English language team" },
          { name: "All Teams", description: "All teams" },
        ];
        for (const teamData of defaultTeams) {
          await storage.createTeam(teamData);
        }
        console.log("✓ Seeded default teams");
      }
    } catch (error) {
      console.warn("Could not seed teams:", error);
    }

    // Seed sample members
    try {
      const existingMembers = await db.select().from(members).limit(1);
      if (existingMembers.length === 0) {
        const defaultPassword = "password123";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const sampleMembers = [
          {
            username: "alice_editor",
            email: "alice@kabacontent.com",
            fullName: "Alice Johnson",
            role: "editor",
            passwordHash,
          },
          {
            username: "bob_clipper",
            email: "bob@kabacontent.com",
            fullName: "Bob Smith",
            role: "clipper",
            passwordHash,
          },
          {
            username: "charlie_manager",
            email: "charlie@kabacontent.com",
            fullName: "Charlie Brown",
            role: "manager",
            passwordHash,
          },
          {
            username: "diana_editor",
            email: "diana@kabacontent.com",
            fullName: "Diana Prince",
            role: "editor",
            passwordHash,
          },
        ];

        for (const memberData of sampleMembers) {
          await storage.createMember(memberData);
        }
        console.log(`✓ Seeded ${sampleMembers.length} sample members`);
      } else {
        console.log("Members already seeded");
      }
    } catch (error) {
      console.warn("Could not seed members:", error);
    }

    // Seed templates
    try {
      const existingTemplates = await storage.getAllTemplates();
      if (existingTemplates.length >= 7) {
        console.log(`Templates already seeded (${existingTemplates.length} templates)`);
      } else {
        if (existingTemplates.length > 0) {
          console.log(`Found ${existingTemplates.length} existing templates, will create more to reach 7 total`);
        }
        const templates = [
          {
            name: "Gary Short Video",
            issueTitle: "Gary Short Video",
            description: "Standard short-form video template for Gary's content. Includes video selection, translation, dubbing, editing, and admin tasks.",
            videoUrl: "https://example.com/videos/gary-sample.mp4",
            videoDuration: 90, // 1:30 in seconds
          },
          {
            name: "Patrick Short Video",
            issueTitle: "Patrick Short Video",
            description: "Short video template for Patrick's content workflow. Standard 5-step process from selection to final admin review.",
            videoUrl: "https://example.com/videos/patrick-sample.mp4",
            videoDuration: 120, // 2:00 in seconds
          },
          {
            name: "Drew Short Video",
            issueTitle: "Drew Short Video",
            description: "Template for processing Drew's short-form videos. Includes translation, dubbing, and editing phases.",
            videoUrl: "https://example.com/videos/drew-sample.mp4",
            videoDuration: 105, // 1:45 in seconds
          },
          {
            name: "Uptin Short Video",
            issueTitle: "Uptin Short Video",
            description: "Standard template for Uptin's video content. Complete workflow from video selection through final admin approval.",
            videoUrl: "https://example.com/videos/uptin-sample.mp4",
            videoDuration: 75, // 1:15 in seconds
          },
          {
            name: "Instagram Reel Template",
            issueTitle: "Instagram Reel Production",
            description: "Complete workflow for creating Instagram Reels. Includes content selection, editing, caption writing, and hashtag research.",
            videoUrl: "https://example.com/videos/instagram-reel-template.mp4",
            videoDuration: 60, // 1:00 in seconds
          },
          {
            name: "TikTok Video Template",
            issueTitle: "TikTok Video Creation",
            description: "Template for TikTok video production. Optimized for viral content with trending sounds and effects.",
            videoUrl: "https://example.com/videos/tiktok-template.mp4",
            videoDuration: 45, // 0:45 in seconds
          },
          {
            name: "YouTube Short Template",
            issueTitle: "YouTube Short Production",
            description: "Workflow for creating YouTube Shorts. Includes thumbnail design, SEO optimization, and description writing.",
            videoUrl: "https://example.com/videos/youtube-short-template.mp4",
            videoDuration: 60, // 1:00 in seconds
          },
        ];

        const templateTasks = [
          { name: "Video Selection", points: 2, priority: "no_priority", order: 0 },
          { name: "Translate", points: 15, priority: "no_priority", order: 1 },
          { name: "Dub", points: 10, priority: "no_priority", order: 2 },
          { name: "Edit", points: 30, priority: "no_priority", order: 3 },
          { name: "Admin", points: 5, priority: "no_priority", order: 4 },
        ];

        // Set updatedAt to different dates to show variety
        const dates = [
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        ];

        // Get teams for assignment
        const allTeams = await storage.getAllTeams();
        const persianTeam = allTeams.find(t => t.name === "Persian");
        const englishTeam = allTeams.find(t => t.name === "English");
        const allTeamsTeam = allTeams.find(t => t.name === "All Teams");

        // Get members for assignment
        const allMembers = await db.select().from(members).limit(10);
        const firstMember = allMembers[0];
        const secondMember = allMembers[1] || allMembers[0];

        // Get projects for assignment
        const allProjects = await storage.getAllProjects();
        const drewFarsiProject = allProjects.find(p => p.name === "Drew Farsi");

        for (let i = 0; i < templates.length; i++) {
          const templateData = templates[i];
          
          // Assign team based on template index
          let teamId = null;
          if (i < 2 && persianTeam) teamId = persianTeam.id;
          else if (i < 4 && englishTeam) teamId = englishTeam.id;
          else if (allTeamsTeam) teamId = allTeamsTeam.id;

          const template = await storage.createTemplate({
            name: templateData.name,
            issueTitle: templateData.issueTitle,
            description: templateData.description,
            videoUrl: templateData.videoUrl,
            videoDuration: templateData.videoDuration,
            teamId: teamId,
            defaultStatus: i < 3 ? "todo" : "backlog",
            defaultPriority: i % 2 === 0 ? "medium" : "high",
            defaultAssigneeId: i < 2 && firstMember ? firstMember.id : (i < 4 && secondMember ? secondMember.id : null),
            defaultProjectId: drewFarsiProject ? drewFarsiProject.id : null,
          });

          // Update the template's updatedAt to show variety
          await db
            .update(issueTemplates)
            .set({ updatedAt: dates[i % dates.length] })
            .where(eq(issueTemplates.id, template.id));

          // Add tasks to each template (only for first 4 templates to match original behavior)
          if (i < 4) {
            for (const taskData of templateTasks) {
              await storage.createTemplateTask(template.id, {
                ...taskData,
                assignedTo: i < 2 && firstMember ? firstMember.id : (i < 4 && secondMember ? secondMember.id : null),
              });
            }
          }
        }
        console.log(`✓ Seeded ${templates.length} templates with tasks`);
      }
    } catch (error) {
      console.warn("Could not seed templates:", error);
    }

    // Seed sample clients with social media accounts (needed for projects)
    let sampleClient1, sampleClient2, sampleClient3;
    try {
      const existingClients = await storage.getAllClients();
      if (existingClients.length < 3) {
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
      // Ensure we have clients before creating projects
      if (!sampleClient1 || !sampleClient2 || !sampleClient3) {
        console.warn("⚠️  Cannot seed projects: Missing sample clients");
        return;
      }

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
      } else {
        console.log("✓ Drew Farsi project already exists");
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
          name: `${sampleClient1.fullName || sampleClient1.username} - Episode 02`,
          description: `Sample project for clipping - Episode 2 (${sampleClient1.fullName || sampleClient1.username})`,
          clientId: sampleClient1.id,
          fileLink: `/Projects/${sampleClient1.username}/Episode_02`,
        },
        {
          name: `${sampleClient2.fullName || sampleClient2.username} - Episode 05`,
          description: `Sample project for clipping - Episode 5 (${sampleClient2.fullName || sampleClient2.username})`,
          clientId: sampleClient2.id,
          fileLink: `/Projects/${sampleClient2.username}/Episode_05`,
        },
        {
          name: `${sampleClient2.fullName || sampleClient2.username} - Episode 08`,
          description: `Sample project for clipping - Episode 8 (${sampleClient2.fullName || sampleClient2.username})`,
          clientId: sampleClient2.id,
          fileLink: `/Projects/${sampleClient2.username}/Episode_08`,
        },
        {
          name: `${sampleClient3.fullName || sampleClient3.username} - Episode 12`,
          description: `Sample project for clipping - Episode 12 (${sampleClient3.fullName || sampleClient3.username})`,
          clientId: sampleClient3.id,
          fileLink: `/Projects/${sampleClient3.username}/Episode_12`,
        },
        {
          name: `${sampleClient3.fullName || sampleClient3.username} - Episode 15`,
          description: `Sample project for clipping - Episode 15 (${sampleClient3.fullName || sampleClient3.username})`,
          clientId: sampleClient3.id,
          fileLink: `/Projects/${sampleClient3.username}/Episode_15`,
        },
      ];

      const createdProjects = [];
      for (const projectData of clippingProjects) {
        const existing = existingProjects.find((p) => p.name === projectData.name);
        if (!existing) {
          try {
            const project = await storage.createProject(projectData);
            createdProjects.push(project);
            console.log(`✓ Created project: ${projectData.name}`);
          } catch (error: any) {
            console.error(`✗ Failed to create project ${projectData.name}:`, error.message);
          }
        } else {
          createdProjects.push(existing);
          console.log(`✓ Project already exists: ${projectData.name}`);
        }
      }

      console.log(`✓ Total projects available: ${createdProjects.length}`);

      // Create sample clips for each project
      // Always ensure at least one project has pending clips for the clipping area
      const existingClips = await db.select().from(clips).limit(1);
      if (createdProjects.length > 0) {
        // Check if we need to add more pending clips
        const firstProject = createdProjects[0];
        const existingPendingClips = await db
          .select()
          .from(clips)
          .where(and(eq(clips.projectId, firstProject.id), eq(clips.status, "pending")));
        
        // If no clips exist at all, or if first project has less than 5 pending clips, create them
        if (existingClips.length === 0 || existingPendingClips.length < 5) {
          console.log(`✓ Starting to seed clips for ${createdProjects.length} projects`);
        // Project 1: First client's Episode 01 - Ensure at least 5 pending clips (matching the photo)
        // Check existing clips to avoid duplicates
        const existingProject1Clips = await db
          .select()
          .from(clips)
          .where(eq(clips.projectId, createdProjects[0].id));
        const existingClipNumbers = new Set(existingProject1Clips.map(c => c.clipNumber));
        
        const project1Clips = createdProjects[0] ? [
          { clipNumber: 1, filePath: `${createdProjects[0].fileLink}/Clip_001.mp4`, status: "pending" },
          { clipNumber: 2, filePath: `${createdProjects[0].fileLink}/Clip_002.mp4`, status: "pending" },
          { clipNumber: 3, filePath: `${createdProjects[0].fileLink}/Clip_003.mp4`, status: "pending" },
          { clipNumber: 4, filePath: `${createdProjects[0].fileLink}/Clip_004.mp4`, status: "pending" },
          { clipNumber: 5, filePath: `${createdProjects[0].fileLink}/Clip_005.mp4`, status: "pending" },
        ].filter(clip => !existingClipNumbers.has(clip.clipNumber)) : [];

        // Project 2: First client's Episode 02 - More clips
        const project2Clips = createdProjects[1] ? [
          { clipNumber: 1, filePath: `${createdProjects[1].fileLink}/Clip_001.mp4`, status: "valid" },
          { clipNumber: 2, filePath: `${createdProjects[1].fileLink}/Clip_002.mp4`, status: "pending" },
          { clipNumber: 3, filePath: `${createdProjects[1].fileLink}/Clip_003.mp4`, status: "valid" },
          { clipNumber: 4, filePath: `${createdProjects[1].fileLink}/Clip_004.mp4`, status: "pending" },
        ] : [];

        // Project 3: Second client's Episode 05 - All pending
        const project3Clips = createdProjects[2] ? [
          { clipNumber: 1, filePath: `${createdProjects[2].fileLink}/Clip_001.mp4`, status: "pending" },
          { clipNumber: 2, filePath: `${createdProjects[2].fileLink}/Clip_002.mp4`, status: "pending" },
          { clipNumber: 3, filePath: `${createdProjects[2].fileLink}/Clip_003.mp4`, status: "pending" },
          { clipNumber: 4, filePath: `${createdProjects[2].fileLink}/Clip_004.mp4`, status: "valid" },
          { clipNumber: 5, filePath: `${createdProjects[2].fileLink}/Clip_005.mp4`, status: "pending" },
        ] : [];

        // Project 4: Second client's Episode 08 - Mix of statuses
        const project4Clips = createdProjects[3] ? [
          { clipNumber: 1, filePath: `${createdProjects[3].fileLink}/Clip_001.mp4`, status: "valid" },
          { clipNumber: 2, filePath: `${createdProjects[3].fileLink}/Clip_002.mp4`, status: "invalid", invalidNote: "Video quality issues" },
          { clipNumber: 3, filePath: `${createdProjects[3].fileLink}/Clip_003.mp4`, status: "valid" },
          { clipNumber: 4, filePath: `${createdProjects[3].fileLink}/Clip_004.mp4`, status: "pending" },
          { clipNumber: 5, filePath: `${createdProjects[3].fileLink}/Clip_005.mp4`, status: "valid" },
          { clipNumber: 6, filePath: `${createdProjects[3].fileLink}/Clip_006.mp4`, status: "pending" },
        ] : [];

        // Project 5: Third client's Episode 12 - Mix of statuses
        const project5Clips = createdProjects[4] ? [
          { clipNumber: 1, filePath: `${createdProjects[4].fileLink}/Clip_001.mp4`, status: "valid" },
          { clipNumber: 2, filePath: `${createdProjects[4].fileLink}/Clip_002.mp4`, status: "valid" },
          { clipNumber: 3, filePath: `${createdProjects[4].fileLink}/Clip_003.mp4`, status: "invalid", invalidNote: "Video too short" },
          { clipNumber: 4, filePath: `${createdProjects[4].fileLink}/Clip_004.mp4`, status: "pending" },
          { clipNumber: 5, filePath: `${createdProjects[4].fileLink}/Clip_005.mp4`, status: "valid" },
        ] : [];

        // Project 6: Third client's Episode 15 - More clips
        const project6Clips = createdProjects[5] ? [
          { clipNumber: 1, filePath: `${createdProjects[5].fileLink}/Clip_001.mp4`, status: "pending" },
          { clipNumber: 2, filePath: `${createdProjects[5].fileLink}/Clip_002.mp4`, status: "valid" },
          { clipNumber: 3, filePath: `${createdProjects[5].fileLink}/Clip_003.mp4`, status: "pending" },
          { clipNumber: 4, filePath: `${createdProjects[5].fileLink}/Clip_004.mp4`, status: "valid" },
          { clipNumber: 5, filePath: `${createdProjects[5].fileLink}/Clip_005.mp4`, status: "invalid", invalidNote: "Content not suitable" },
          { clipNumber: 6, filePath: `${createdProjects[5].fileLink}/Clip_006.mp4`, status: "pending" },
          { clipNumber: 7, filePath: `${createdProjects[5].fileLink}/Clip_007.mp4`, status: "valid" },
        ] : [];

        // Insert clips for each project
        const allClips = [
          { clips: project1Clips, projectIndex: 0 },
          { clips: project2Clips, projectIndex: 1 },
          { clips: project3Clips, projectIndex: 2 },
          { clips: project4Clips, projectIndex: 3 },
          { clips: project5Clips, projectIndex: 4 },
          { clips: project6Clips, projectIndex: 5 },
        ];

        let totalClips = 0;
        for (const { clips: clipList, projectIndex } of allClips) {
          if (createdProjects[projectIndex] && clipList.length > 0) {
            for (const clipData of clipList) {
              await storage.createClip({
                ...clipData,
                projectId: createdProjects[projectIndex].id,
              });
              totalClips++;
            }
          }
        }

        console.log(`✓ Seeded ${totalClips} sample clips across ${createdProjects.length} projects`);
        
        // Ensure first project has at least 5 pending clips
        if (createdProjects.length > 0) {
          const firstProject = createdProjects[0];
          const pendingClips = await db
            .select()
            .from(clips)
            .where(and(eq(clips.projectId, firstProject.id), eq(clips.status, "pending")));
          
          if (pendingClips.length < 5) {
            const existingNumbers = new Set(pendingClips.map(c => c.clipNumber));
            let nextNumber = 1;
            let added = 0;
            while (pendingClips.length + added < 5) {
              if (!existingNumbers.has(nextNumber)) {
                await storage.createClip({
                  projectId: firstProject.id,
                  clipNumber: nextNumber,
                  filePath: `${firstProject.fileLink}/Clip_00${nextNumber}.mp4`,
                  status: "pending",
                });
                added++;
                totalClips++;
              }
              nextNumber++;
            }
            console.log(`✓ Ensured first project has 5 pending clips`);
          }
        }
        }
      } else if (createdProjects.length === 0) {
        console.warn(`⚠️  Cannot seed clips: No projects available`);
      } else {
        // Even if clips exist, ensure first project has 5 pending
        const firstProject = createdProjects[0];
        const pendingClips = await db
          .select()
          .from(clips)
          .where(and(eq(clips.projectId, firstProject.id), eq(clips.status, "pending")));
        
        if (pendingClips.length < 5) {
          const existingNumbers = new Set(pendingClips.map(c => c.clipNumber));
          let nextNumber = 1;
          let added = 0;
          while (pendingClips.length + added < 5) {
            if (!existingNumbers.has(nextNumber)) {
              await storage.createClip({
                projectId: firstProject.id,
                clipNumber: nextNumber,
                filePath: `${firstProject.fileLink}/Clip_00${nextNumber}.mp4`,
                status: "pending",
              });
              added++;
            }
            nextNumber++;
          }
          console.log(`✓ Added ${added} pending clips to first project (now has ${pendingClips.length + added} pending)`);
        } else {
          console.log(`✓ First project already has ${pendingClips.length} pending clips`);
        }
      }

      // Always ensure at least one project has 5 pending clips for clipping area
      if (createdProjects.length > 0) {
        const firstProject = createdProjects[0];
        const pendingClips = await db
          .select()
          .from(clips)
          .where(and(eq(clips.projectId, firstProject.id), eq(clips.status, "pending")));
        
        if (pendingClips.length < 5) {
          const existingNumbers = new Set(pendingClips.map(c => c.clipNumber));
          let nextNumber = 1;
          let added = 0;
          while (pendingClips.length + added < 5) {
            if (!existingNumbers.has(nextNumber)) {
              await storage.createClip({
                projectId: firstProject.id,
                clipNumber: nextNumber,
                filePath: `${firstProject.fileLink}/Clip_00${nextNumber}.mp4`,
                status: "pending",
              });
              added++;
            }
            nextNumber++;
          }
          console.log(`✓ Added ${added} pending clips to first project (now has ${pendingClips.length + added} pending)`);
        } else {
          console.log(`✓ First project already has ${pendingClips.length} pending clips`);
        }
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

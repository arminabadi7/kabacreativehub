// Comprehensive test script to verify issues endpoint works and fix any problems
import { storage } from "./storage";
import { db } from "./db";
import { projects, clients, issues, tasks } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function testAndFixIssues() {
  try {
    console.log("=== Testing and Fixing Issues Endpoint ===\n");
    
    // 1. Check if we have any clients
    console.log("1. Checking for clients...");
    let allClients = await storage.getAllClients();
    console.log(`   Found ${allClients.length} clients`);
    
    if (allClients.length === 0) {
      console.log("   Creating test client...");
      const passwordHash = await bcrypt.hash("testpassword123", 10);
      const [testClient] = await db.insert(clients).values({
        username: "test_client_" + Date.now(),
        email: "test@example.com",
        passwordHash: passwordHash,
        fullName: "Test Client",
      }).returning();
      console.log(`   ✓ Created client: ${testClient.id}`);
      allClients = [testClient];
    } else {
      console.log(`   ✓ Using existing client: ${allClients[0].id}`);
    }
    
    // 2. Check if we have any projects
    console.log("\n2. Checking for projects...");
    let allProjects = await storage.getAllProjects();
    console.log(`   Found ${allProjects.length} projects`);
    
    let testProject;
    if (allProjects.length === 0) {
      console.log("   Creating test project...");
      testProject = await storage.createProject({
        name: "Test Project",
        clientId: allClients[0].id,
        description: "Test project for issues",
      });
      console.log(`   ✓ Created project: ${testProject.id}`);
    } else {
      testProject = allProjects[0];
      console.log(`   ✓ Using existing project: ${testProject.id} - "${testProject.name}"`);
    }
    
    // 3. Test getIssuesByProject
    console.log("\n3. Testing getIssuesByProject...");
    try {
      const issuesList = await storage.getIssuesByProject(testProject.id);
      console.log(`   ✓ Successfully fetched ${issuesList.length} issues`);
      
      if (issuesList.length === 0) {
        console.log("   Creating test issue with tasks...");
        const testIssue = await storage.createIssue({
          projectId: testProject.id,
          title: "Test Issue",
          description: "This is a test issue",
          status: "backlog",
          order: 0,
          tasks: [
            { name: "Test Task 1", points: 5, priority: "medium", order: 0 },
            { name: "Test Task 2", points: 10, priority: "high", order: 1 },
          ],
        });
        console.log(`   ✓ Created issue: ${testIssue.id}`);
        console.log(`   ✓ Issue has ${testIssue.tasks?.length || 0} tasks`);
        
        // Fetch again to verify
        const issuesList2 = await storage.getIssuesByProject(testProject.id);
        console.log(`   ✓ Now have ${issuesList2.length} issues`);
        if (issuesList2.length > 0) {
          const issue = issuesList2[0];
          console.log(`   ✓ Issue "${issue.title}" has ${issue.tasks?.length || 0} tasks`);
          if (issue.tasks && issue.tasks.length > 0) {
            issue.tasks.forEach((task: any, idx: number) => {
              console.log(`     Task ${idx + 1}: ${task.name || task.title} (${task.points} pts)`);
            });
          }
        }
      } else {
        console.log(`   Issues found:`);
        issuesList.forEach((issue, idx) => {
          console.log(`     ${idx + 1}. ${issue.title} (${issue.id})`);
          console.log(`        Status: ${issue.status}, Tasks: ${issue.tasks?.length || 0}`);
          if (issue.tasks && issue.tasks.length > 0) {
            issue.tasks.forEach((task: any, taskIdx: number) => {
              console.log(`          Task ${taskIdx + 1}: ${task.name || task.title} (${task.points || 0} pts)`);
            });
          }
        });
      }
    } catch (error: any) {
      console.error(`   ✗ Error:`, error.message);
      console.error(`   Stack:`, error.stack);
      throw error;
    }
    
    console.log("\n=== All Tests Passed! ===");
    console.log(`\nProject ID to use: ${testProject.id}`);
    console.log(`Project Name: ${testProject.name}`);
    process.exit(0);
  } catch (error: any) {
    console.error("\n=== Test Failed ===");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testAndFixIssues();



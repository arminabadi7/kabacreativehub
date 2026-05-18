const fs = require('fs');

let content = fs.readFileSync('server/routes.ts', 'utf8');

// Pattern 1: app.METHOD("/path", async (req, res) => { - no middleware
// Replace: async (req, res) => with asyncHandler(async (req, res) =>
// But only for app.get/post/put/patch/delete routes

// Pattern 2: app.METHOD("/path", middleware, async (req, res) => { - with middleware
// Same approach

// First, let's NOT double-wrap existing asyncHandler usages
// We'll mark existing ones temporarily
content = content.replace(/asyncHandler\(async/g, '___ALREADY_WRAPPED___async');

// Now wrap all patterns:
// Pattern: app.(get|post|put|patch|delete)("...", async (req, res)
// Or: app.(get|post|put|patch|delete)("...", middleware, async (req, res)
// Or: app.(get|post|put|patch|delete)("...", middleware, middleware, async (req, res)

// Match the async callback and wrap it
const routePattern = /(\s+app\.(get|post|put|patch|delete)\([^)]+\)(?:,\s*\w+(?:\([^)]*\))?)*,\s*)(async\s*\()/g;

// But this is tricky. Let's try a different approach - match lines that have app.METHOD and async

// Actually, the patterns are:
// 1. app.get("/path", async (req, res) => {
// 2. app.post("/path", middleware, async (req, res) => {
// 3. app.patch("/path", middleware, async (req, res) => {

// The async is always followed by (req, res) => or similar
// We need to wrap from "async" to the matching "});" 

// Simpler: just wrap the async callback start
// Replace: , async ( with , asyncHandler(async (
// But need to be careful about what comes before

// Pattern for routes without middleware:
content = content.replace(
  /(\s+app\.(get|post|put|patch|delete)\("[^"]+",\s*)(async\s*\(req,\s*res(?:,\s*next)?\)\s*=>\s*\{)/g,
  '$1asyncHandler($3'
);

// Pattern for routes with one middleware:
content = content.replace(
  /(\s+app\.(get|post|put|patch|delete)\("[^"]+",\s*\w+(?:\([^)]*\))?,\s*)(async\s*\(req,\s*res(?:,\s*next)?\)\s*=>\s*\{)/g,
  '$1asyncHandler($3'
);

// Now we need to close the asyncHandler wrapper before the });
// This is trickier - we need to find each route and add ) before the final });

// Restore already wrapped ones
content = content.replace(/___ALREADY_WRAPPED___async/g, 'asyncHandler(async');

fs.writeFileSync('server/routes_temp.ts', content);
console.log('Intermediate step done. Check routes_temp.ts');

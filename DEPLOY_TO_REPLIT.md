# Deploy to Replit - Replace Existing Deployment

## Method 1: Using Git (Recommended)

### Step 1: Initialize Git (if not already done)
```bash
cd /Users/arminkaba/Desktop/kabacontent/KabaCreativeHub
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### Step 2: Connect to Replit via Git
1. Go to your Replit project
2. Open the **Shell** tab
3. Check if Git is already initialized:
   ```bash
   git remote -v
   ```
4. If no remote exists, add your Replit repo as remote:
   ```bash
   git remote add replit <your-replit-git-url>
   ```
   (You can find the Git URL in Replit under "Version control" or "Git" section)

### Step 3: Push Your Code
From your local machine:
```bash
cd /Users/arminkaba/Desktop/kabacontent/KabaCreativeHub
git remote add replit <your-replit-git-url>
git push replit main --force
```

**⚠️ Warning**: The `--force` flag will overwrite everything in Replit. Make sure you've backed up any important data from the existing deployment.

### Step 4: In Replit Shell
After pushing, in Replit's shell:
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Build the project
npm run build
```

---

## Method 2: Using Replit Import (Alternative)

### Step 1: Prepare Your Code
1. Make sure all your code is committed locally
2. Create a `.gitignore` file if you don't have one (to exclude node_modules, etc.)

### Step 2: Upload to Replit
1. Go to your Replit project
2. Click the **"Files"** icon in the sidebar
3. Click **"Upload folder"** or drag and drop your project folder
4. **⚠️ Important**: This will replace all files. Make sure to backup your existing `.replit` file and any environment variables first!

### Step 3: Restore Configuration
After uploading, make sure:
1. The `.replit` file is present (it should be in your project)
2. All environment variables are set in Replit Secrets

---

## Method 3: Manual File Replacement

### Step 1: Backup Existing Replit Files
In Replit, download/save:
- `.replit` file (if you made custom changes)
- Any custom environment variables from Secrets
- Database connection string

### Step 2: Delete Old Files
In Replit, delete all files except:
- `.replit` (keep this)
- Any files you want to preserve

### Step 3: Upload New Files
1. Upload your entire project folder
2. Or use Git (Method 1) - recommended

---

## After Deployment - Setup Steps

### 1. Set Environment Variables
Go to Replit → **Secrets** tab and ensure these are set:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
  ```
  postgresql://user:password@host/database?sslmode=require
  ```

**Optional (already in .replit file, but verify):**
- `SESSION_SECRET` - Random secret for sessions (generate a new one)
- `FOUNDER_PASSWORD` - Currently: `Mohi2002`
- `CALENDLY_API_TOKEN` - Your Calendly API token
- `RESEND_API_KEY` - Your Resend API key
- `GOOGLE_SHEETS_ID` - Your Google Sheets ID

**For Google Calendar (if using):**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_CALENDAR_TOKEN` - Access token

### 2. Install Dependencies
In Replit Shell:
```bash
npm install
```

### 3. Push Database Schema
```bash
npm run db:push
```

This will create/update all database tables based on your schema.

### 4. Seed Initial Data (Optional)
The seed data runs automatically on server start, but you can verify:
```bash
npm run dev
```

Check the console for seed messages like:
- ✓ Seeded 7 days of availability
- ✓ Seeded 10 default booking questions
- ✓ Seeded 3 sample clients
- ✓ Seeded sample projects and clips

### 5. Build for Production
```bash
npm run build
```

### 6. Deploy
1. Click the **"Deploy"** button in Replit
2. Or use the **"Run"** button for development mode
3. Your app will be available at: `https://your-repl-name.repl.co`

---

## Verification Checklist

After deployment, verify:

- [ ] App loads at your Replit URL
- [ ] Home page displays correctly
- [ ] Founder dashboard accessible at `/founder`
- [ ] Can login with founder password
- [ ] Affiliates tab shows data
- [ ] Clients tab shows sample clients
- [ ] Database connection works (check console logs)
- [ ] All API endpoints respond correctly

---

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Database connection errors
- Verify `DATABASE_URL` is set correctly in Secrets
- Check that your Neon database is accessible
- Ensure SSL mode is set: `?sslmode=require`

### Port errors
- Replit handles port mapping automatically
- The `.replit` file configures port 5000 → external port 80
- Don't change the PORT environment variable

### Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Static files not loading
- Make sure `npm run build` completed successfully
- Check that `dist/public` directory exists
- Verify server is serving from correct directory

---

## Quick Deploy Commands Summary

```bash
# 1. Push code (from local machine)
git push replit main --force

# 2. In Replit Shell:
npm install
npm run db:push
npm run build

# 3. Click "Deploy" button in Replit
```

---

## Important Notes

1. **Backup First**: Always backup your existing Replit deployment before replacing it
2. **Environment Variables**: Make sure all secrets are set before running
3. **Database**: The `db:push` command will update your schema - make sure you're okay with schema changes
4. **Seed Data**: Seed data runs automatically - it won't duplicate existing data
5. **Port**: Don't change port 5000 - Replit maps it automatically


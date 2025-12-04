# Replit Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables (Set in Replit Secrets)
- [ ] `DATABASE_URL` - Your Neon PostgreSQL connection string (REQUIRED)
- [ ] `SESSION_SECRET` - Random secret key for sessions (optional, has default)
- [ ] `CALENDLY_API_TOKEN` - Already configured in `.replit` file
- [ ] `FOUNDER_PASSWORD` - Already configured in `.replit` file
- [ ] `RESEND_API_KEY` - Already configured in `.replit` file
- [ ] `GOOGLE_SHEETS_ID` - Already configured in `.replit` file

### 2. Database Setup
- [ ] Push database schema: `npm run db:push`
- [ ] Verify all tables are created
- [ ] Seed initial data (runs automatically on server start)

### 3. Code Preparation
- [ ] All code committed/pushed
- [ ] `.env` file is NOT committed (should be in `.gitignore`)
- [ ] `node_modules` is NOT committed
- [ ] `dist` folder is NOT committed

### 4. Build Test (Optional but Recommended)
- [ ] Run `npm run build` locally to ensure build succeeds
- [ ] Check that `dist/public` and `dist/index.js` are created

## Deployment Steps

### Option 1: Deploy via Replit UI
1. [ ] Open your Replit project
2. [ ] Click the "Deploy" button (or use the Deployments tab)
3. [ ] Replit will automatically:
   - Run `npm run build` (builds frontend + bundles server)
   - Run `npm run start` (starts production server)
   - Serve on port 5000 (mapped to external port 80)

### Option 2: Manual Deployment
1. [ ] Run `npm install` to install dependencies
2. [ ] Run `npm run db:push` to sync database schema
3. [ ] Run `npm run build` to build the application
4. [ ] Run `npm run start` to start production server

## Post-Deployment Verification

- [ ] Site loads at your Replit URL
- [ ] Landing page displays correctly
- [ ] Founder dashboard accessible at `/founder`
- [ ] Login page works at `/login`
- [ ] API endpoints respond correctly (check `/api/auth/session`)
- [ ] Database connections work
- [ ] Calendly integration works (if configured)
- [ ] Google Calendar sync works (if configured)

## Troubleshooting

### Build Fails
- Check `npm run check` for TypeScript errors
- Verify all dependencies are installed: `npm install`
- Check server logs for specific error messages

### Database Connection Fails
- Verify `DATABASE_URL` is set correctly in Replit Secrets
- Check that your Neon database allows connections from Replit IPs
- Verify database credentials are correct

### Static Files Not Loading
- Ensure `npm run build` completed successfully
- Check that `dist/public` directory exists
- Verify `server/vite.ts` has correct path to `dist/public`

### Port Issues
- Replit automatically maps port 5000 to external port 80
- Don't change the PORT environment variable unless necessary
- Check `.replit` file for port configuration

## Important Files

- `.replit` - Replit configuration (deployment settings, env vars)
- `package.json` - Dependencies and scripts
- `server/index.ts` - Main server entry point
- `server/vite.ts` - Static file serving configuration
- `vite.config.ts` - Vite build configuration

## Notes

- **Development**: Uses `npm run dev` (Vite dev server with hot reload)
- **Production**: Uses `npm run start` (serves pre-built static files)
- **Port**: Always runs on port 5000 (configured in `.replit`)
- **Database**: Requires Neon PostgreSQL connection string





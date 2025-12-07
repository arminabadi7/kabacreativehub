# Replit Deployment Guide

## Quick Deploy Steps

1. **Push your code to Replit** (via Git or Replit's import)

2. **Set Environment Variables** in Replit Secrets:
   - `DATABASE_URL` - Your Neon database connection string (REQUIRED)
   - `SESSION_SECRET` - A random secret key for sessions (optional, has default)
   - `CALENDLY_API_TOKEN` - Already set in `.replit` file
   - `FOUNDER_PASSWORD` - Already set in `.replit` file
   - `RESEND_API_KEY` - Already set in `.replit` file
   - `GOOGLE_SHEETS_ID` - Already set in `.replit` file

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Push Database Schema**:
   ```bash
   npm run db:push
   ```

5. **For Development**: Click "Run" button (uses `npm run dev`)

6. **For Production Deployment**:
   - Click "Deploy" button in Replit
   - Replit will automatically run `npm run build` then `npm run start`
   - The app will be available at your Replit URL

## Important Notes

- **Port**: The app runs on port 5000 (configured in `.replit` file)
- **Database**: Make sure `DATABASE_URL` is set in Replit Secrets
- **Build Output**: Production build outputs to `dist/public` directory
- **Static Files**: The server serves static files from `dist/public` in production

## Environment Variables Setup

In Replit, go to **Secrets** tab and add:

```
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your-random-secret-key-here
```

## Troubleshooting

**Build fails:**
- Make sure all dependencies are installed: `npm install`
- Check that TypeScript compiles: `npm run check`

**Database connection fails:**
- Verify `DATABASE_URL` is set correctly in Secrets
- Check that your Neon database is accessible

**Port already in use:**
- Replit handles port mapping automatically
- The `.replit` file configures port 5000 → external port 80

**Static files not serving:**
- Make sure you've run `npm run build` before deploying
- Check that `dist/public` directory exists

## Development vs Production

- **Development** (`npm run dev`): Uses Vite dev server with hot reload
- **Production** (`npm run start`): Serves pre-built static files from `dist/public`

The `.replit` file automatically uses the correct command based on whether you're running or deploying.






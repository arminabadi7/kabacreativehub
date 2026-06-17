# Startup Guide - KabaCreativeHub

## Quick Start Commands

### 1. Navigate to project directory
```bash
cd /Users/arminkaba/Desktop/kabacontent/KabaCreativeHub
```

### 2. Install dependencies (if not already installed)
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory with at minimum:

```env
DATABASE_URL=your_neon_database_connection_string_here
SESSION_SECRET=your-session-secret-key-here
PORT=5000
```

**Required Environment Variables:**
- `DATABASE_URL` - **REQUIRED** - Your Neon database connection string
- `SESSION_SECRET` - Optional (has default, but set for production)
- `PORT` - Optional (defaults to 5000)

**Optional Environment Variables (for full functionality):**
- `GOOGLE_CLIENT_ID` - For Google Calendar/Sheets integration
- `GOOGLE_CLIENT_SECRET` - For Google Calendar/Sheets integration
- `GOOGLE_CALENDAR_TOKEN` - For Google Calendar integration
- `RESEND_API_KEY` - For email functionality
- `FOUNDER_PASSWORD` - Founder login password
- `GOOGLE_SHEETS_ID` - Google Sheets ID
- `CALENDLY_API_TOKEN` - Calendly integration

### 4. Push database schema (if needed)
```bash
npm run db:push
```

### 5. Start the development server
```bash
npm run dev
```

The server will start on port 5000 (or the port specified in your `.env` file).

---

## Full Startup Sequence (Copy & Paste)

```bash
# Navigate to project
cd /Users/arminkaba/Desktop/kabacontent/KabaCreativeHub

# Install dependencies (only needed first time or after package.json changes)
npm install

# Make sure .env file exists with DATABASE_URL
# (Edit .env file if needed)

# Start the server
npm run dev
```

---

## Troubleshooting

**Error: "DATABASE_URL must be set"**
- Make sure you have a `.env` file in the root directory
- Add `DATABASE_URL=your_connection_string` to the `.env` file

**Port already in use**
- Change the `PORT` in your `.env` file to a different port (e.g., `PORT=5001`)

**Module not found errors**
- Run `npm install` to install all dependencies

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server (after build)
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes










<<<<<<< HEAD
=======









>>>>>>> 2684970d52491dc0bbc266271ec1954e5f6dc2e7

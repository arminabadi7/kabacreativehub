# KabaContent Platform — Complete Technical Rebuild Specification
## Master Blueprint for Ground-Up Reconstruction

> **Purpose:** This document is the complete technical analysis of the current KabaContent / KabaCreativeHub platform, followed by a full architectural blueprint for rebuilding it from scratch as a unified, RBAC-driven, modern application. Paste this into a new Claude Code session to begin the rebuild.

---

# PART 1: CURRENT SYSTEM ANALYSIS

---

## 1.1 System Overview

KabaContent is a content-agency operations platform used to manage clients, team members, video production projects, affiliate marketing, financial tracking, and scheduling. It currently consists of **four completely separate dashboard applications** within one codebase, each with their own login, navigation, and state management.

| Dashboard | User Type | URL | Auth Mechanism |
|---|---|---|---|
| Founder Dashboard | Owner/Admin | `/founder` | Hardcoded password env var |
| Members Dashboard | Staff (editors, clippers, managers) | `/member-dashboard/*` | Session + bcrypt |
| Client Dashboard | Paying customers | `/client` | Session + bcrypt |
| Affiliate Dashboard | Referral partners | `/affiliate-dashboard` | Session + bcrypt |

---

## 1.2 Full Feature Inventory

### 1.2.1 Founder Dashboard Features

**Bookings & Sales Pipeline**
- View all bookings synced from Calendly API and Google Calendar API
- Manual booking creation
- Update booking status: `call_scheduled`, `no_show`, `follow_up`, `no_interest`, `sale`
- Mark booking as sold (triggers commission calculation by tier)
- Assign affiliate to booking
- Set tier: Growth, Domination, Empire
- Commission amounts: Growth=$1,000 | Domination=$1,750 | Empire=$3,368.75

**Affiliate Management**
- View all affiliates with stats (clicks, conversions, commission balance)
- View affiliate plain-text passwords (stored in DB — security issue)
- Reset affiliate passwords
- Pay affiliate commissions (full balance or partial)
- View per-affiliate transaction history

**Client Management**
- Create/edit/delete clients
- Set tier (Growth, Domination, Empire)
- Set monthly payment date
- Set next payment date, amount, and note
- Assign client to a team
- Add Google Drive link for client
- Add offer/promo link for client
- Manage client social media accounts (account name, username, password, platforms, email, profile photo)
- View client invoices and payment history

**Member Management**
- Create/edit/delete members
- Assign role: admin, manager, editor, clipper, member
- Assign team
- Reset member passwords
- View member point balances and transactions
- Add/adjust points manually

**Financial Dashboard** (`/finances/FinancesPage.tsx`)
- Income tracker: record income by source, currency, client association
- Expense tracker: record by category
- Invoice creation and status tracking
- Payment plans: split monthly payment into installments
- Recurring subscriptions tracker
- Affiliate commission payables overview
- Summary stats: total revenue, total expenses, net profit

**Tutorial Management** (`TutorialManagement.tsx`)
- Create/edit/delete tutorial videos
- Set video URL (YouTube/Vimeo/Loom), thumbnail, duration
- Control visibility: published/archived
- Target by tier or specific client IDs
- Drag-to-reorder videos

**Scheduling / Booking Form Configuration**
- Set weekly availability (day of week, time ranges, enable/disable)
- Configure meeting duration and buffer time
- Set timezone
- Build custom booking form (question types: short answer, paragraph, multiple choice, checkboxes, dropdown, file upload, linear scale, rating, date, time)
- View appointments list

**Members Dashboard Access**
- Launch the Members Dashboard from within Founder Dashboard (with "Back to Founder" button)

---

### 1.2.2 Members Dashboard Features

**Navigation Sections:**
- Home
- My Issues (personal task inbox)
- Boards (Kanban project board — unified)
- Clipping Area (video clip validation workflow)
- Clients
- Teams
- Members
- Templates
- Workspace settings
- Profile / Billing / Payments
- Labels (placeholder — not implemented)
- Calendar (placeholder — not implemented)

**Home Page** (`HomePage.tsx`)
- Activity overview
- Quick stats

**My Issues** (`MyIssuesPage.tsx`)
- Lists issues assigned to the current member
- Filter by status
- Navigate to issue detail

**Boards / Projects** (`ProjectsBoardV2.tsx` + `KanbanBoard.tsx`)
- Left sidebar: teams grouped, projects listed under each team
- Kanban board per project with draggable cards
- Status columns: Backlog, Ready for Editing, Editing, Ready for Caption, Ready for Upload (customizable)
- Drag cards between columns (updates status + order)
- Drag columns left/right to reorder
- Add new columns
- Rename columns (inline click-to-edit)
- Change column colors (10-color palette)
- Delete columns (guarded: blocks if issues exist)
- Create new issue via modal (breadcrumb header, title, description, metadata chips, video URL/duration, task list, assignee picker)
- Issue cards show: title, task checklist rows, footer with dates/duration/avatars
- Task checkbox toggle (optimistic UI)
- Click card → navigate to IssueDetailPage

**Issue Detail Page** (`IssueDetailPage.tsx`)
- View/edit issue title, description
- Set status, priority (no_priority, low, medium, high, urgent)
- Set assignee
- Set due date, publish date
- Set video URL and duration
- Add/edit/delete sub-tasks (with name, points, assignee, priority)
- Inline task creation
- Back navigation

**Clipping Area** (`ClippingArea.tsx`)
- Select project
- View clips for the project (clip number, title, file path, status: pending/valid/invalid)
- Mark clip as valid or invalid (with rejection note)
- Add new clips
- Convert clip to issue (using a template)
- Select template for converted clip

**Templates** (`TemplatesPage.tsx`, `TemplateCreatePage.tsx`, `TemplateEditPage.tsx`)
- List all templates
- Create template: name, issue title, description, video URL, duration, default status/priority/assignee/project, team assignment
- Add template tasks with name, points, priority, assignee
- Edit template
- Delete template

**Teams** (`TeamsPage.tsx`, `TeamDetailPage.tsx`)
- List all teams
- Create/delete teams
- View team detail: members in team, clients assigned to team, projects for team

**Clients** (`ClientsSection.tsx`)
- List all clients with tier/status info
- View/edit client details
- Navigate to client's projects

**Members** (`MembersPage.tsx`)
- List all members
- View member details, role, team assignment
- Manage members (role-dependent)

**Profile/Settings** (`ProfileSection.tsx`)
- Edit profile info (name, email)
- Change password
- View role and team

**Billing** (`BillingSection.tsx`)
- View points balance
- View transaction history

**Payments** (`PaymentsSection.tsx`)
- View payment records

**Workspace** (`WorkspacePage.tsx`)
- Configure workspace currency
- Set points-to-USD conversion rate

**Statuses** (`StatusesPage.tsx`)
- View/manage default status labels (legacy — predates `project_statuses` table)

---

### 1.2.3 Client Dashboard Features

**Profile**
- View/edit name, email, phone, Instagram username
- Change password

**Social Media Accounts**
- View assigned social media credentials (platforms, username, password)
- Show/hide password toggle

**Billing / Payments**
- View invoices
- View payment history
- View next payment date and amount

**Tutorials** (`GettingStartedSection.tsx`, `GuidesTabContent.tsx`)
- View published tutorial videos targeted to their tier or specifically to them
- Progress tracking: resume position, percentage watched, completed status
- Video player with Suspense boundary (react-player v3)

**Google Drive**
- Link to client's assigned Google Drive folder

---

### 1.2.4 Affiliate Dashboard Features

**Stats**
- Total clicks (referral link tracking)
- Total conversions (referral converted to booking)
- Total commission earned
- Current balance (earned minus paid)
- Total paid out

**Referral Link**
- Generate personal referral URL
- Copy link to clipboard

**Bookings from Referrals**
- View all bookings attributed to their referrals
- Booking status and commission info

**Transactions**
- View all commission payment transactions
- Pending vs paid status

**Payment Request**
- Request payout of available balance

**Profile**
- Edit: name, country, Telegram, Instagram, phone number
- Set payment method (PayPal, e-transfer, bank transfer) and details

---

### 1.2.5 Public Pages

| Route | Purpose |
|---|---|
| `/` | Home/landing page |
| `/book` | Public booking page with custom form builder output |
| `/affiliate` | Affiliate registration page |
| `/login` | Unified login page (routes to correct dashboard by user type) |
| `/member-login` | Members-specific login |
| `/client-login` | Client-specific login |

---

### 1.2.6 Background & Automation Behaviors

- **Calendly webhook / polling**: `GET /api/founder/bookings` syncs from Calendly API and Google Calendar on every request (not event-driven)
- **Email on booking**: Confirmation email sent when appointment created; reminder scheduled via `setTimeout` (in-memory, lost on server restart)
- **Google Calendar event creation**: New appointment → Calendar event created
- **Google Sheets append**: New appointment → row appended to sheet
- **Rate limiting**: In-memory Map-based rate limiter for referral tracking (lost on restart)
- **DB migrations at startup**: Sequential migration files run in `server/index.ts` startup sequence

---

## 1.3 Database Schema (Complete)

### Entity Tables

```
users            — Legacy table (not actively used in current auth flow)
members          — Staff accounts (editor, clipper, manager, admin)
clients          — Customer accounts
affiliates       — Referral partner accounts
```

### Scheduling / Booking Tables

```
bookings            — Calendly/Google Calendar synced calls
appointments        — Self-serve scheduled calls from /book page
availability        — Weekly time blocks (day 0-6, start/end time)
bookingQuestions    — Custom form questions for /book page
```

### Settings

```
founderSettings     — time format, meeting duration, buffer, timezone, default statuses
```

### Finance Tables

```
income                      — Revenue records
expenses                    — Cost records
invoices                    — Invoice records (Stripe/PayPal tracking)
paymentPlans                — Split monthly payments
paymentPlanInstallments     — Individual installments in a plan
affiliateTransactions       — Commission payout records
recurringSubscriptions      — Monthly recurring costs
workspaceCurrency           — Points-to-USD conversion rate
```

### Project Management Tables

```
teams               — Team groups
projects            — Client projects
project_statuses    — Kanban columns per project (added via migration, NOT in schema.ts)
issues              — Kanban cards (includes JSONB tasks column — legacy)
tasks               — Sub-tasks for issues (also used for member tasks)
clips               — Video clip validation queue
```

### Member Points Tables

```
memberStats     — Per-member points balance
transactions    — Points earning/spending history
```

### Affiliate Tables

```
referrals       — Click tracking records
affiliateTransactions — Commission payment records
```

### Content Tables

```
issueTemplates  — Reusable issue templates
templateTasks   — Tasks within a template
socialMediaAccounts — Client social credentials
notes           — Comments (client/project/task scoped)
outreachTracking — DM outreach tracking
editorWorkload   — Editor assignment tracking
```

### Tutorial Tables

```
tutorialVideos    — Video library (YouTube/Vimeo/Loom)
tutorialProgress  — Per-client watch progress and completion
```

**Total: ~27 tables**

---

## 1.4 Current Architecture Breakdown

### Frontend Architecture

```
/client/src/
├── App.tsx                  # Root router (wouter Switch/Route)
├── main.tsx                 # React entry point
├── pages/
│   ├── Home.tsx             # Landing page
│   ├── Login.tsx            # Unified login
│   ├── MemberLogin.tsx      # Members login
│   ├── ClientLogin.tsx      # Client login
│   ├── FounderDashboard.tsx # 1,500+ line monolith
│   ├── MembersDashboard.tsx # 600+ line monolith shell
│   ├── ClientDashboard.tsx  # Client portal
│   ├── AffiliateDashboard.tsx
│   ├── Affiliate.tsx        # Affiliate registration
│   ├── BookingPage.tsx      # Public booking form
│   ├── finances/
│   │   └── FinancesPage.tsx
│   └── members/             # Sub-pages rendered inside MembersDashboard
│       ├── ActivityOverview.tsx
│       ├── BillingSection.tsx
│       ├── BoardPage.tsx        (legacy board wrapper)
│       ├── ClientsSection.tsx
│       ├── ClippingArea.tsx
│       ├── FinancialSummary.tsx
│       ├── HomePage.tsx
│       ├── IssueCard.tsx
│       ├── IssueDetailPage.tsx  (~700 lines)
│       ├── MembersPage.tsx
│       ├── MyIssuesPage.tsx
│       ├── PaymentsSection.tsx
│       ├── ProfileSection.tsx
│       ├── ProjectsBoard.tsx    (legacy V1 board)
│       ├── ProjectsBoardV2.tsx  (current board)
│       ├── StatusesPage.tsx
│       ├── TeamDetailPage.tsx
│       ├── TeamsPage.tsx
│       ├── TemplateCreatePage.tsx
│       ├── TemplateEditPage.tsx
│       ├── TemplatesPage.tsx
│       ├── TransactionsSection.tsx
│       ├── UserInformation.tsx
│       └── WorkspacePage.tsx
├── components/
│   ├── boards/
│   │   ├── AssigneePicker.tsx     (Radix Popover dropdown)
│   │   ├── BoardSidebar.tsx
│   │   ├── CreateIssueModal.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanCard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── MemberAvatar.tsx
│   │   ├── StatusColumnHeader.tsx
│   │   ├── TaskRow.tsx
│   │   └── types.ts
│   ├── founder/
│   │   └── tutorials/
│   │       └── TutorialManagement.tsx
│   ├── tutorials/
│   │   ├── GettingStartedSection.tsx
│   │   ├── GuidesTabContent.tsx
│   │   ├── TutorialCard.tsx
│   │   └── VideoPlayerModal.tsx
│   ├── CountrySelect.tsx
│   ├── SchedulingCalendar.tsx
│   └── ui/                   # Full shadcn/ui library (35+ components)
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── useTutorialProgress.ts
└── lib/
    ├── bankDetection.ts
    ├── boardConstants.ts
    ├── permissions.ts        (frontend role checks)
    ├── queryClient.ts        (TanStack Query client config)
    └── utils.ts
```

### Backend Architecture

```
/server/
├── index.ts          # Server startup, migration runner, session config
├── routes.ts         # 5,400+ line monolith with ALL routes
├── board-routes.ts   # Board-specific routes (modularized later)
├── tutorial-routes.ts # Tutorial routes (modularized later)
├── storage.ts        # Data access layer (all DB queries via Drizzle)
├── db.ts             # Neon database connection
├── migrate.ts        # Runtime schema migration functions
├── email.ts          # Nodemailer email service
├── integrations.ts   # Google Calendar + Google Sheets clients
├── calendly-routes.ts # Calendly webhook/API routes
├── calendly-service.ts # Calendly API service class
├── google-oauth-setup.ts # Google OAuth2 credentials
├── seedData.ts       # Initial data seeding
├── seedClippingData.ts # Clipping area seed data
├── test-and-fix-issues.ts # Debug script
└── vite.ts           # Vite dev middleware integration
```

### State Management

- **TanStack Query v5** with `staleTime: Infinity` globally (never auto-refetches)
- Query keys are URL path strings used as-is
- Two-step cache pattern: `setQueryData` for optimistic update + `invalidateQueries` for background sync
- No global client-side state store (no Zustand, Redux, Context beyond QueryClientProvider)
- Component-local state (`useState`) for UI state
- Session state is entirely server-side (express-session)

### Routing

- **Wouter v3** (lightweight React router)
- Client-side only routing
- `MembersDashboard` uses an `activeSection` state variable instead of nested routes for most views (URL does NOT reflect current section in most cases)
- Manual regex matching for nested routes (issue detail, team detail)
- Auth redirects done manually (setLocation)

### Authentication

```
Session data structure (express-session):
{
  affiliateId?: string
  username?: string
  isFounder?: boolean
  memberId?: string
  clientId?: string
  userType?: "founder" | "member" | "client" | "affiliate"
  role?: string
}

Routes:
POST /api/founder/login      — Founder (env var password check)
POST /api/auth/login         — Unified login (checks members → clients → affiliates → founder)
POST /api/members/login      — Members-specific login
POST /api/client-login       — Client login
POST /api/auth/register      — Affiliate self-registration
GET  /api/auth/session       — Returns current user info from session
POST /api/auth/logout        — Destroy session
```

### API Patterns

- REST over HTTP (no GraphQL, no tRPC)
- All routes return JSON
- Error responses: `{ error: string }`
- Auth guards: `requireFounderAuth`, `requireMember` (board routes), `requireOwnership`, `requirePermission(permission)`
- Zod validation on request bodies
- No versioning (`/api/...` flat namespace)
- Mixed patterns: some routes use `storage.*` (Drizzle ORM via storage layer), others query `db.*` directly

### Caching Strategy

- `staleTime: Infinity` — data never auto-refetches
- Manual `invalidateQueries` after every mutation
- Optimistic updates via `setQueryData` for latency-sensitive operations (card drag, task toggle)
- No server-side caching
- No CDN or edge caching

### Third-Party Dependencies

| Dependency | Purpose |
|---|---|
| `@hello-pangea/dnd` | Drag-and-drop (Kanban cards + column reordering) |
| `@neondatabase/serverless` | PostgreSQL (Neon serverless) |
| `@radix-ui/*` | 20+ headless UI primitives |
| `@tanstack/react-query` | Server state management |
| `bcrypt` | Password hashing |
| `connect-pg-simple` | PostgreSQL session store |
| `date-fns` / `date-fns-tz` | Date formatting and timezone handling |
| `drizzle-orm` + `drizzle-zod` | ORM + schema-to-Zod bridge |
| `express` + `express-session` | HTTP server + session management |
| `framer-motion` | Animations |
| `googleapis` | Google Calendar + Sheets API |
| `lucide-react` | Icon set |
| `multer` | File upload handling |
| `react-hook-form` + `@hookform/resolvers` | Form state |
| `react-player` | Video player (YouTube/Vimeo) |
| `recharts` | Charts |
| `tailwindcss` + `tw-animate-css` | Styling |
| `wouter` | Client-side routing |
| `zod` | Schema validation |
| `passport` + `passport-local` | Auth middleware (installed but minimally used) |

---

## 1.5 UX / UI System Analysis

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Fixed left sidebar (w-64)  │  Main content area    │
│                             │  (flex-1, scrollable) │
│  - Logo                     │                       │
│  - Navigation items         │  Page content         │
│  - Section groups           │                       │
│  - User avatar + logout     │                       │
└─────────────────────────────────────────────────────┘
```

- No responsive/mobile layout (fixed sidebar doesn't collapse)
- No top navbar
- Content area has no consistent max-width or padding system
- Page titles/breadcrumbs inconsistently implemented

### Design System

- **Tailwind CSS v3** with custom config
- **shadcn/ui** component library based on Radix UI
- Color palette: gray scale base + blue accent (`cyan-400` to `blue-500` gradient for brand)
- No dark mode implementation (next-themes is installed but not wired)
- No design token system (colors hardcoded as Tailwind classes)

### Forms

- `react-hook-form` + `zodResolver` for complex forms
- Raw `useState` + direct fetch for simpler forms
- Inconsistent validation UX (some show toast errors, some show inline errors)
- No consistent form layout primitives

### Board/Kanban

- Horizontal scroll for columns (`overflow-x-auto`)
- Drag feedback: scale + rotate + shadow on dragging card
- Drag feedback: blue dashed border on drop target column
- Column fixed width: `w-72` (288px)
- Cards: white bg, border, rounded-lg, hover shadow

### Tables/Lists

- shadcn `<Table>` for data-heavy views (clients, affiliates, bookings)
- Custom card lists for member/team views
- No virtualization (renders all rows)

### Responsive Behavior

- **Not responsive.** Fixed 256px sidebar. No breakpoints for mobile/tablet.
- Horizontal scroll on mobile for kanban board

---

## 1.6 Existing Problems and Weaknesses

### 🔴 Critical Security Issues

1. **Plain-text passwords stored in DB**: `plainPassword` column exists on `members`, `clients`, and `affiliates` tables "for founder access." This is a severe security vulnerability.

2. **Hardcoded founder password with insecure fallback**: `const founderPassword = process.env.FOUNDER_PASSWORD || "Mohi2002"` — the default password is committed to code.

3. **Founder not in DB**: The founder identity has no database record. There is no way to audit founder actions, rotate credentials properly, or have multiple admins.

4. **Passwords visible to founder in UI**: The founder dashboard can display member/affiliate plain-text passwords in the UI.

5. **No CSRF protection**: Session cookies without any CSRF token validation.

6. **Auth checks commented out for testing**: `MembersDashboard.tsx` has auth guards commented out with a `mockMember` fallback still in production code.

### 🔴 Architectural Problems

7. **5,400+ line monolithic routes.ts**: Extremely difficult to maintain, test, or reason about. Functions defined at the top are used thousands of lines below with no clear organization.

8. **Four completely separate dashboards**: Zero code sharing between Founder, Members, Client, and Affiliate dashboards. Duplicated UI patterns, auth flows, and data fetching.

9. **No URL-based routing for sub-pages**: `MembersDashboard` uses `activeSection` state, meaning the browser back button doesn't work, URLs can't be shared/bookmarked, and deep links are broken for most sections.

10. **Schema drift**: `project_statuses` table and extended `issues` fields (priority, assignee_id, due_date, etc.) were added via raw SQL migration scripts and are NOT reflected in `shared/schema.ts` (Drizzle schema). The ORM schema and the actual DB are out of sync.

11. **Two competing task storage models**: Issue tasks are stored both in `issues.tasks` (JSONB column, legacy) AND in the `tasks` table (relational). Both are queried simultaneously with fallback logic, leading to the `tasks.filter is not a function` runtime error.

12. **Multiple migration systems**: 
    - `drizzle-kit push` (ORM migrations)
    - Individual `add-*.ts` scripts in root (raw SQL)
    - Inline runtime migrations in `server/index.ts`
    - `server/migrate.ts` functions called at startup
    These systems are completely separate and can cause conflicts.

13. **`staleTime: Infinity` everywhere**: Data is never automatically refreshed. Every mutation must manually call `invalidateQueries` on every relevant query key. Missing a single invalidation causes stale UI. This has caused multiple bugs (board not updating, issues not appearing).

14. **Two separate board systems coexisting**: `ProjectsBoard.tsx` (V1, legacy) and `ProjectsBoardV2.tsx` (new) both exist and are both accessible. The sidebar has both "Boards" and "projects-legacy" entries.

### 🟡 Technical Debt

15. **Hardcoded debug logging for specific users**: The commissions endpoint has multi-hundred-line debug blocks specifically checking `if (username.toLowerCase() === 'mojgan')` with hardcoded expected values. This is production code.

16. **Hardcoded Google Calendar ID** in `routes.ts` (not in env config).

17. **In-memory rate limiter**: Lost on server restart. Not distributed (would fail with multiple server instances).

18. **In-memory reminder scheduling**: `setTimeout` for 24-hour email reminders is lost on server restart.

19. **No error boundaries**: React runtime errors crash the entire dashboard. No graceful fallback UI.

20. **No request validation consistency**: Some endpoints use Zod `.parse()`, some use `.safeParse()`, some do no validation.

21. **Mixed direct DB vs storage layer**: Some routes in `routes.ts` call `db.select().from(...)` directly while others use `storage.*()`. The storage abstraction is inconsistently applied.

22. **Mock member in production**: `const mockMember` with hardcoded test data is used as a fallback when the real member session is null, bypassing auth completely.

23. **Currency inconsistency**: Some API endpoints return amounts in cents (integers), others return them in dollars (after `/100`). No consistent convention.

24. **`any` type abuse**: Dozens of `any` type casts throughout the codebase, especially in data transformation code.

### 🟡 UX/Performance Problems

25. **No mobile support**: Entirely desktop-only. Fixed sidebar, no responsive breakpoints.

26. **No loading skeletons for most pages**: Only the Kanban board loading state has skeleton UI.

27. **No empty state handling**: Most list views show nothing (no message) when data is empty.

28. **Pagination missing**: All data is fetched and rendered at once (no pagination or virtual scrolling). Will break with large datasets.

29. **No search or filtering** on most list views (clients, members, bookings).

30. **Section navigation doesn't update URL**: Navigating to "Clients" section doesn't change the URL. Refreshing the page resets to the default section.

31. **Inconsistent modal/dialog patterns**: Some modals use shadcn `<Dialog>`, some are inline conditional renders, some are custom absolute-positioned divs.

---

# PART 2: REBUILD RECOMMENDATIONS

---

## 2.1 Recommended Stack

### Frontend

| Concern | Recommendation | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server components, file-based routing, streaming, SEO, built-in image optimization. Superior to Vite+React for a full-stack app. |
| Language | **TypeScript 5** (strict mode) | Already in use; keep it. |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Familiar, extremely productive. Upgrade to v4 for better performance and design tokens. |
| State (server) | **TanStack Query v5** | Already in use; excellent. Configure with `staleTime: 5 * 60 * 1000` (5 min) not Infinity. |
| State (client UI) | **Zustand** | Replace scattered `useState` with small, targeted Zustand stores for cross-component UI state (active section, sidebar open state, etc.). |
| Forms | **React Hook Form + Zod** | Already in use; keep it. |
| Icons | **Lucide React** | Already in use; keep it. |
| Charts | **Recharts** or **Tremor** | Already in use; Tremor provides more pre-built dashboard widgets. |
| Drag-and-drop | **@dnd-kit/core** | More modern and actively maintained than @hello-pangea/dnd. Better touch support. |
| Animations | **Framer Motion** | Already in use; keep it. |
| Routing | **Next.js App Router** | File-system routing replaces Wouter. Full URL for every view. |
| Date handling | **date-fns v3** + **date-fns-tz** | Already in use; keep it. |
| Email previews | **React Email** | Modern email templating with preview support. |

### Backend

| Concern | Recommendation | Rationale |
|---|---|---|
| Architecture | **Next.js Route Handlers** (API routes in App Router) | Co-located with frontend, no separate server process, serverless-ready. |
| OR (if complex) | **Hono** (on Node/Bun) as separate service | Extremely fast, TypeScript-first, edge-ready. If you need WebSockets or complex background jobs, keep a dedicated server. |
| ORM | **Drizzle ORM** (keep, upgrade to latest) | Already familiar; excellent TypeScript integration. Fix schema drift issue. |
| Auth | **Lucia Auth v3** OR **Auth.js (NextAuth) v5** | Proper multi-tenant auth library. Replaces the custom session system. Lucia gives full control; Auth.js handles providers. |
| Validation | **Zod** (keep) | Already in use everywhere. |
| File uploads | **UploadThing** or **Cloudflare R2 + presigned URLs** | Replaces local Multer uploads. Files should not be stored on the server. |
| Background jobs | **Inngest** or **Trigger.dev** | Replaces `setTimeout`-based reminders. Proper job queuing with retry logic and persistence. |
| Email | **Resend** + **React Email** | Modern, reliable email API. Much better developer experience than Nodemailer. |
| Real-time | **Pusher** or **Ably** (managed) or **Partykit** | WebSocket-based real-time for board updates, notifications. |

### Database

| Concern | Recommendation |
|---|---|
| Database | **PostgreSQL** (keep Neon) — it's excellent |
| ORM | **Drizzle ORM** (keep) — rebuild schema cleanly |
| Migrations | **Drizzle Kit** ONLY — one migration system |
| Schema design | See Section 2.3 |

### Deployment

| Concern | Recommendation |
|---|---|
| Hosting | **Vercel** (if Next.js) or **Railway** (if separate server) |
| Database | **Neon** (serverless PostgreSQL — keep) |
| File storage | **Cloudflare R2** or **AWS S3** |
| Email | **Resend** |
| Background jobs | **Inngest** (serverless-compatible) |
| CDN | Vercel Edge Network (automatic with Vercel) |

---

## 2.2 RBAC Architecture

### Design Principles

1. **One unified user table** — all users in one `users` table with a `role` field
2. **Permissions are DB-driven** — roles and their permissions are stored in the database, not hardcoded
3. **Founder = highest-privilege user** — no special login, just a user with `founder` role
4. **Granular, composable permissions** — each feature action is a named permission
5. **Frontend gates** — nav items, buttons, and pages conditionally render based on permissions
6. **Backend enforces** — every API route validates permissions server-side; frontend gates are UX only

### Role Hierarchy

```
founder   (full access, all permissions)
  └── admin     (management access, most permissions)
        └── manager   (team lead, can create/delete most things)
              └── editor    (can edit content, limited admin)
                    └── clipper   (clip-specific access)
                          └── member    (basic access, own data only)

client    (portal access: tutorials, projects, billing)
affiliate (referral portal access)
viewer    (read-only access — future role)
```

### Permission Table Design

```sql
-- Core roles (seeded)
CREATE TABLE roles (
  id        TEXT PRIMARY KEY,  -- "founder", "admin", "manager", "editor", "clipper", "member", "client", "affiliate"
  label     TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE  -- system roles can't be deleted
);

-- Individual permission keys
CREATE TABLE permissions (
  id          TEXT PRIMARY KEY,  -- "manage_members", "view_finances", etc.
  label       TEXT NOT NULL,
  group_name  TEXT,              -- "Members", "Finance", "Projects", etc.
  description TEXT
);

-- Role → Permission mapping
CREATE TABLE role_permissions (
  role_id       TEXT REFERENCES roles(id),
  permission_id TEXT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Users table
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  username       TEXT UNIQUE,
  password_hash  TEXT NOT NULL,
  full_name      TEXT,
  role_id        TEXT NOT NULL REFERENCES roles(id) DEFAULT 'member',
  team_id        UUID REFERENCES teams(id),
  must_change_password BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### Permission Keys (Recommended)

```typescript
// Organized by domain
const PERMISSIONS = {
  // Members / Users
  MANAGE_MEMBERS:       "manage_members",
  VIEW_MEMBERS:         "view_members",

  // Clients
  MANAGE_CLIENTS:       "manage_clients",
  VIEW_CLIENTS:         "view_clients",

  // Projects & Boards
  MANAGE_PROJECTS:      "manage_projects",
  VIEW_PROJECTS:        "view_projects",
  CREATE_ISSUES:        "create_issues",
  EDIT_ANY_ISSUE:       "edit_any_issue",
  EDIT_OWN_ISSUE:       "edit_own_issue",

  // Clipping
  VIEW_CLIPPING:        "view_clipping",
  VALIDATE_CLIPS:       "validate_clips",
  ADD_CLIPS:            "add_clips",

  // Templates
  MANAGE_TEMPLATES:     "manage_templates",
  USE_TEMPLATES:        "use_templates",

  // Teams
  MANAGE_TEAMS:         "manage_teams",
  VIEW_TEAMS:           "view_teams",

  // Finance
  VIEW_FINANCES:        "view_finances",
  MANAGE_FINANCES:      "manage_finances",
  PAY_AFFILIATES:       "pay_affiliates",

  // Affiliates
  MANAGE_AFFILIATES:    "manage_affiliates",
  VIEW_AFFILIATES:      "view_affiliates",

  // Tutorials
  MANAGE_TUTORIALS:     "manage_tutorials",
  VIEW_TUTORIALS:       "view_tutorials",

  // Scheduling
  MANAGE_SCHEDULING:    "manage_scheduling",
  VIEW_BOOKINGS:        "view_bookings",

  // Settings
  MANAGE_WORKSPACE:     "manage_workspace",
  VIEW_WORKSPACE:       "view_workspace",

  // Points
  MANAGE_POINTS:        "manage_points",
  VIEW_OWN_POINTS:      "view_own_points",
} as const;
```

### Default Role → Permission Mappings

```typescript
const DEFAULT_ROLE_PERMISSIONS = {
  founder:   ["*"],  // All permissions
  admin:     ["*"],
  manager: [
    "manage_members", "view_members",
    "manage_clients", "view_clients",
    "manage_projects", "view_projects", "create_issues", "edit_any_issue",
    "view_clipping", "validate_clips", "add_clips",
    "manage_templates", "use_templates",
    "manage_teams", "view_teams",
    "view_finances",
    "view_affiliates",
    "manage_tutorials",
    "view_bookings",
    "manage_workspace", "view_workspace",
    "manage_points", "view_own_points",
  ],
  editor: [
    "view_members",
    "view_clients",
    "view_projects", "create_issues", "edit_own_issue",
    "view_clipping", "add_clips",
    "use_templates",
    "view_teams",
    "view_workspace",
    "view_own_points",
  ],
  clipper: [
    "view_clients",
    "view_projects", "create_issues", "edit_own_issue",
    "view_clipping", "add_clips",
    "use_templates",
    "view_teams",
    "view_own_points",
  ],
  member: [
    "view_projects",
    "view_clipping",
    "view_own_points",
  ],
  client:    ["view_tutorials", "view_projects", "view_own_points"],
  affiliate: [],  // Only their own dashboard
};
```

### Frontend Permission Hook

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  
  const can = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === "founder" || user.role === "admin") return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);
  
  const canAny = useCallback((...perms: string[]): boolean => {
    return perms.some(p => can(p));
  }, [can]);
  
  return { can, canAny };
}

// Usage:
const { can } = usePermissions();
{can("manage_members") && <ManageMembersButton />}
```

### Backend Middleware

```typescript
// middleware/requirePermission.ts
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    if (user.role === "founder" || user.role === "admin") return next();
    
    const hasPermission = await permissionService.userHasPermission(user.id, permission);
    if (!hasPermission) return res.status(403).json({ error: "Forbidden" });
    
    next();
  };
}
```

---

## 2.3 Recommended Database Schema Direction

### Unified User Model

```sql
-- Replace: users, members, clients, affiliates (4 tables)
-- With: users (1 table) + role-specific profile tables

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL UNIQUE,
  username             TEXT UNIQUE,
  password_hash        TEXT NOT NULL,
  full_name            TEXT,
  role_id              TEXT NOT NULL DEFAULT 'member',
  team_id              UUID,
  is_active            BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Role-specific profiles (optional extension pattern)
CREATE TABLE member_profiles (
  user_id   UUID PRIMARY KEY REFERENCES users(id),
  points_balance INTEGER DEFAULT 0
);

CREATE TABLE client_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id),
  tier                TEXT,  -- "Growth" | "Domination" | "Empire"
  phone_number        TEXT,
  instagram_username  TEXT,
  offer_link          TEXT,
  google_drive_link   TEXT,
  total_spent         INTEGER DEFAULT 0,
  client_since        TIMESTAMPTZ DEFAULT NOW(),
  monthly_payment_day INTEGER,
  next_payment_date   TIMESTAMPTZ,
  next_payment_amount INTEGER,
  next_payment_note   TEXT
);

CREATE TABLE affiliate_profiles (
  user_id          UUID PRIMARY KEY REFERENCES users(id),
  country          TEXT,
  telegram_account TEXT,
  phone_number     TEXT,
  payment_method   TEXT,
  payment_details  TEXT
);
```

### Project Management (Clean)

```sql
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  client_id   UUID NOT NULL REFERENCES users(id),
  team_id     UUID REFERENCES teams(id),
  file_link   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_statuses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6B7280',
  "order"    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, key)
);

CREATE TABLE issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'backlog',
  priority     TEXT NOT NULL DEFAULT 'no_priority',
  "order"      INTEGER NOT NULL DEFAULT 0,
  assignee_id  UUID REFERENCES users(id),
  creator_id   UUID REFERENCES users(id),
  due_date     TIMESTAMPTZ,
  publish_date TIMESTAMPTZ,
  video_url    TEXT,
  video_duration INTEGER,
  team_id      UUID REFERENCES teams(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
-- NOTE: Remove `tasks JSONB` column entirely — use tasks table only

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id     UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  points       INTEGER DEFAULT 0,
  priority     TEXT DEFAULT 'no_priority',
  assigned_to  UUID REFERENCES users(id),
  "order"      INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Schema Improvements vs Current

| Problem | Fix |
|---|---|
| 4 separate user tables | 1 `users` table + 3 profile extension tables |
| `plainPassword` column | Remove entirely |
| `tasks` JSONB + `tasks` table coexisting | Remove JSONB column, tasks table only |
| `project_statuses` not in schema.ts | Add to Drizzle schema |
| Extended issue fields not in schema.ts | Add to Drizzle schema |
| `statusLabels` JSON column on projects | Remove (replaced by `project_statuses` table) |
| `issues.tasks` JSONB fallback | Remove, tasks table is source of truth |

---

## 2.4 API Architecture

### Structure

Organize API routes by domain, not user type:

```
/api/
├── auth/           — login, logout, session, register
├── users/          — CRUD (behind RBAC)
├── clients/        — Client-specific data
├── affiliates/     — Affiliate-specific data
├── teams/          — Team management
├── projects/       — Project CRUD + statuses
├── issues/         — Issue CRUD
├── tasks/          — Task CRUD
├── clips/          — Clipping area workflow
├── templates/      — Issue templates
├── finance/        — Income, expenses, invoices, payment plans
├── scheduling/     — Availability, appointments, booking questions
├── bookings/       — Sales call bookings (Calendly sync)
├── tutorials/      — Tutorial video library
├── notifications/  — Real-time notification system
└── workspace/      — Global settings
```

### API Design Principles

1. **Consistent response envelope**: `{ data: T, meta?: PaginationMeta }` for lists
2. **Consistent error format**: `{ error: string, code?: string, details?: unknown }`
3. **Pagination**: All list endpoints support `?page=&limit=` or cursor-based
4. **Filtering**: List endpoints support query params for filtering
5. **No money inconsistency**: ALL monetary values stored and returned in cents (integer); frontend divides by 100
6. **Timestamps**: All in ISO 8601 UTC format
7. **IDs**: All UUIDs (not mixed varchar/uuid)

---

# PART 3: REBUILD BLUEPRINT

---

## 3.1 Recommended Folder Structure

```
kabacontent/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no sidebar)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard group
│   │   ├── layout.tsx            # Unified shell (sidebar + header)
│   │   ├── page.tsx              # Redirect to /dashboard/home
│   │   ├── home/
│   │   ├── boards/
│   │   │   └── [projectId]/
│   │   │       └── page.tsx
│   │   ├── issues/
│   │   │   ├── page.tsx          # My issues
│   │   │   └── [issueId]/
│   │   ├── projects/
│   │   ├── clients/
│   │   │   └── [clientId]/
│   │   ├── members/
│   │   │   └── [memberId]/
│   │   ├── teams/
│   │   │   └── [teamId]/
│   │   ├── affiliates/
│   │   ├── finance/
│   │   ├── bookings/
│   │   ├── templates/
│   │   ├── clipping/
│   │   ├── tutorials/
│   │   ├── scheduling/
│   │   ├── settings/
│   │   └── workspace/
│   ├── (portal)/                 # Client/affiliate portal (different layout)
│   │   ├── layout.tsx
│   │   ├── tutorials/
│   │   ├── projects/
│   │   └── billing/
│   ├── book/                     # Public booking page
│   ├── affiliate/                # Public affiliate registration
│   └── api/                      # API route handlers
│       ├── auth/
│       ├── users/
│       ├── projects/
│       ├── issues/
│       └── ...
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/
│   │   ├── AppShell.tsx          # Main shell (sidebar + content)
│   │   ├── Sidebar.tsx           # Permission-aware sidebar
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── boards/                   # Kanban system
│   ├── forms/                    # Reusable form components
│   ├── data-display/             # Tables, cards, stat widgets
│   └── [domain]/                 # Domain-specific components
│
├── lib/
│   ├── auth/
│   │   ├── session.ts            # Auth session helpers
│   │   ├── permissions.ts        # Permission utilities
│   │   └── middleware.ts         # Auth middleware
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema/               # Schema files per domain
│   │   │   ├── users.ts
│   │   │   ├── projects.ts
│   │   │   ├── finance.ts
│   │   │   └── ...
│   │   └── migrations/           # Drizzle Kit generated migrations
│   ├── api/
│   │   ├── client.ts             # TanStack Query + fetch utilities
│   │   └── errors.ts
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts
│   │   ├── commission.service.ts
│   │   ├── project.service.ts
│   │   └── email.service.ts
│   ├── integrations/
│   │   ├── calendly.ts
│   │   ├── google-calendar.ts
│   │   └── google-sheets.ts
│   └── utils/
│       ├── currency.ts           # formatCents(), parseCents()
│       ├── dates.ts
│       └── permissions.ts
│
├── hooks/
│   ├── useAuth.ts                # Current user + permissions
│   ├── usePermissions.ts         # Permission checks
│   └── ...
│
├── stores/                       # Zustand stores (UI state only)
│   ├── sidebar.store.ts
│   └── board.store.ts
│
├── types/                        # Shared TypeScript types
│   ├── auth.ts
│   ├── api.ts
│   └── domain.ts
│
├── drizzle.config.ts
├── middleware.ts                 # Next.js middleware (auth)
└── package.json
```

---

## 3.2 Component Architecture

### Permission-Aware Navigation

```tsx
// components/layout/Sidebar.tsx
export function Sidebar() {
  const { can, user } = usePermissions();
  
  const navSections = [
    {
      items: [
        { label: "Home", href: "/home", icon: HomeIcon },
        { label: "My Issues", href: "/issues", icon: InboxIcon },
        { label: "Boards", href: "/boards", icon: LayoutGridIcon },
      ]
    },
    {
      label: "WORKSPACE",
      items: [
        can("view_clipping") && { label: "Clipping Area", href: "/clipping", icon: ScissorsIcon },
        can("use_templates") && { label: "Templates", href: "/templates", icon: FileTextIcon },
      ].filter(Boolean)
    },
    {
      label: "MANAGEMENT",
      show: can("view_members") || can("view_clients"),
      items: [
        can("view_clients") && { label: "Clients", href: "/clients", icon: BuildingIcon },
        can("view_members") && { label: "Members", href: "/members", icon: UsersIcon },
        can("view_teams") && { label: "Teams", href: "/teams", icon: UsersIcon },
      ].filter(Boolean)
    },
    // etc.
  ];
  
  return <nav>{/* render navSections */}</nav>;
}
```

### Protected Route Pattern (Next.js)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = getSession(request);
  
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Portal-only routes
  if (request.nextUrl.pathname.startsWith("/portal")) {
    if (session?.role !== "client" && session?.role !== "affiliate") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
}
```

---

## 3.3 State Architecture

### Server State (TanStack Query)

```typescript
// Use reasonable staleTime, not Infinity
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes
      refetchOnWindowFocus: true,
      retry: (count, err) => count < 2 && err.status !== 401,
    }
  }
});

// Consistent query key factory
export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    list: () => ["projects", "list"] as const,
    detail: (id: string) => ["projects", id] as const,
    issues: (id: string) => ["projects", id, "issues"] as const,
    statuses: (id: string) => ["projects", id, "statuses"] as const,
  },
  users: {
    all: () => ["users"] as const,
    me: () => ["users", "me"] as const,
  },
  // etc.
};
```

### Client State (Zustand)

```typescript
// stores/sidebar.store.ts
interface SidebarStore {
  isOpen: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));
```

---

## 3.4 Authentication Architecture

### Recommended: Lucia Auth v3 with DB Sessions

```typescript
// lib/auth/index.ts
import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";

const adapter = new DrizzlePostgreSQLAdapter(db, sessionsTable, usersTable);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    }
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    username: attributes.username,
    fullName: attributes.full_name,
    role: attributes.role_id,
    teamId: attributes.team_id,
    permissions: attributes.permissions, // pre-loaded from role_permissions
  })
});

// Sessions stored in DB — survives server restarts
// No MemoryStore fallback needed
// No plain-text passwords
// No hardcoded credentials
```

### Login Flow

```
POST /api/auth/login
  → validate credentials (email/username + bcrypt)
  → load user with role + permissions
  → create DB session
  → set cookie
  → return { user, permissions[] }

GET /api/auth/me (or /api/auth/session)
  → validate session cookie
  → return { user, permissions[] }
  → frontend caches in TanStack Query ["users", "me"]
```

### Founder Bootstrap

```typescript
// seed.ts — run once at setup
await db.insert(users).values({
  email: process.env.FOUNDER_EMAIL,
  password_hash: await hash(process.env.FOUNDER_PASSWORD),
  full_name: "Armin Kaba",
  role_id: "founder",
});
// Founder is a normal user with the highest role
// No hardcoded passwords in code
// Rotate by updating via the settings page
```

---

## 3.5 Real-Time Architecture

```
Recommended: Pusher Channels (managed WebSockets)

Events to broadcast:
- board:issue_moved       { projectId, issueId, newStatus, newOrder }
- board:issue_created     { projectId, issue }
- board:column_reordered  { projectId, statuses }
- notification:new        { userId, notification }

Frontend:
- Subscribe on board page mount
- Update TanStack Query cache on event receipt (not full invalidation)

Backend:
- After DB mutation succeeds, call pusher.trigger(channel, event, data)

Channels:
- board-{projectId}    — project-specific board events
- user-{userId}        — per-user notifications
- workspace            — workspace-wide events (member added, etc.)
```

---

## 3.6 Development Phases

### Phase 1 — Foundation (Week 1-2)

1. Initialize Next.js 15 project with TypeScript, Tailwind v4, shadcn/ui
2. Set up Drizzle ORM with clean unified schema
3. Implement Lucia Auth (login, session, logout)
4. Build RBAC system (roles, permissions tables, middleware)
5. Implement unified user model (migrate member/client/affiliate)
6. Build app shell: sidebar (permission-aware), header, layout
7. Set up TanStack Query with consistent query key factory
8. Deploy skeleton to Vercel + Neon

### Phase 2 — Core Boards & Projects (Week 3-4)

1. Projects list + create
2. Project statuses management
3. Kanban board (dnd-kit, columns, cards)
4. Issue detail page (full CRUD)
5. Tasks (create, toggle, reorder)
6. Issue templates (create from template)
7. My Issues inbox

### Phase 3 — People & Teams (Week 5)

1. Members management (CRUD, role assignment)
2. Teams management (CRUD, member assignment)
3. Clients management (CRUD, tier, billing info)
4. Social media accounts
5. Member profile + password change

### Phase 4 — Clipping & Content (Week 6)

1. Clipping area (project clips, validate/reject, convert to issue)
2. Tutorial system (client portal, video player, progress tracking)
3. Tutorial management (admin side)

### Phase 5 — Finance (Week 7)

1. Income tracker
2. Expense tracker
3. Invoice management
4. Payment plans + installments
5. Recurring subscriptions
6. Financial dashboard / summary

### Phase 6 — Affiliate System (Week 8)

1. Affiliate management + RBAC portal
2. Referral tracking
3. Commission calculation
4. Commission payouts + transactions
5. Affiliate dashboard portal

### Phase 7 — Scheduling & Bookings (Week 9)

1. Availability configuration
2. Public booking page + custom form builder
3. Calendly sync integration
4. Google Calendar integration
5. Appointments management
6. Email confirmations + reminders (via Inngest jobs)

### Phase 8 — Real-Time & Polish (Week 10)

1. WebSocket board updates (Pusher)
2. Notification system
3. Mobile responsive layout
4. Loading skeletons + empty states
5. Pagination on all list views
6. Global search
7. Error boundaries

### Phase 9 — Migration & Cutover

1. Data export from old system
2. Data import scripts
3. Parallel run period
4. Cutover

---

## 3.7 Migration Strategy from Old System

### Data Migration Plan

```
Step 1: Merge user tables
  - members → users (role: member/editor/clipper/manager/admin)
  - clients → users (role: client) + client_profiles
  - affiliates → users (role: affiliate) + affiliate_profiles
  - Generate new UUIDs, store mapping table for FK resolution

Step 2: Migrate projects
  - projects → projects (map client_id to new user UUIDs)

Step 3: Migrate issues
  - issues → issues (map project_id, assignee_id, creator_id)
  - Remove tasks JSONB, migrate to tasks table

Step 4: Migrate tasks
  - tasks → tasks (keep if already relational, discard JSONB tasks)

Step 5: Migrate project statuses
  - project_statuses → project_statuses (same structure)

Step 6: Migrate finance
  - income, expenses, invoices, payment_plans, payment_plan_installments

Step 7: Migrate affiliate data
  - referrals, affiliateTransactions, bookings

Step 8: Migrate tutorials
  - tutorialVideos, tutorialProgress (map clientId to new userId)

Step 9: Set founder password
  - Create founder user record in new system

Step 10: Drop old plain_password columns
```

---

## 3.8 Key Improvements Summary

| Current | Rebuilt |
|---|---|
| 4 separate dashboards | 1 unified dashboard with RBAC |
| Hardcoded founder password | Founder is a normal DB user with top role |
| `plainPassword` stored in DB | Removed entirely |
| Auth checked commented out (mockMember in prod) | Proper auth middleware on every route |
| 5,400-line routes.ts monolith | Route handlers split by domain |
| No URL for dashboard sections | Full Next.js file-based routing |
| `staleTime: Infinity` → manual invalidation everywhere | 5-min staleTime, smarter cache management |
| Two task storage models (JSONB + table) | Tasks table only |
| Drizzle schema ≠ actual DB | Single Drizzle schema = ground truth |
| 3 different migration systems | Drizzle Kit only |
| In-memory `setTimeout` for reminders | Inngest jobs (persistent, retryable) |
| In-memory rate limiter | Upstash Redis rate limiter |
| No mobile support | Mobile-first responsive layout |
| Hardcoded commission calculations with debug for specific user | Clean commission service |
| No real-time | Pusher WebSocket events for board updates |
| No pagination | Cursor-based pagination on all lists |
| No error boundaries | React error boundaries + Sentry |
| Multer local file storage | Cloudflare R2 / UploadThing |
| Nodemailer | Resend + React Email |

---

## 3.9 Testing Strategy

```
Unit tests:
  - Permission logic (who can do what)
  - Commission calculation service
  - Currency utilities
  → Vitest

Integration tests:
  - API route handlers (auth, CRUD)
  - DB queries (with test DB)
  → Vitest + @testing-library/react

E2E tests:
  - Login flows for each user type
  - Create issue → appears on board
  - Drag card → persists after reload
  - Commission payout flow
  → Playwright

Component tests:
  - Kanban board behavior
  - Permission-gated UI components
  → Storybook + Chromatic for visual regression
```

---

## 3.10 Environment Variables (New System)

```env
# Database
DATABASE_URL=                 # Neon PostgreSQL connection string

# Auth
AUTH_SECRET=                  # Lucia session signing secret (random 32 bytes)
FOUNDER_EMAIL=                # Initial founder account email
FOUNDER_PASSWORD=             # Initial founder password (hashed on first run, then rotate)

# Email (Resend)
RESEND_API_KEY=

# Background jobs (Inngest)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Real-time (Pusher)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_CALENDAR_ID=           # Move from hardcoded to env

# Calendly
CALENDLY_API_TOKEN=
CALENDLY_WEBHOOK_SECRET=

# File Storage (Cloudflare R2 or AWS S3)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

*End of Rebuild Specification. This document contains everything needed to rebuild KabaContent from scratch with a clean, scalable, secure, unified architecture.*

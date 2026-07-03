# Implementation Tasks — Seat of Wisdom Math Olympiad

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Scaffold Next.js + TypeScript + Tailwind
- Create Next.js app (App Router) with TypeScript
- Install and configure Tailwind CSS
- Add Space Grotesk, Inter, IBM Plex Mono fonts from Google Fonts
- Set up base layout and global styles
- Verify build and dev server run locally
- **Acceptance:** Project builds, dev server runs without errors, Tailwind classes work

### Task 1.2: Supabase Project & Authentication Setup
- Create Supabase project (free tier)
- Enable Database and Realtime
- Set up `.env.local` with Supabase URL and anon key
- Create Supabase client module (`lib/supabase.ts`)
- Test connection (query `public.schema_information` or similar)
- **Acceptance:** Supabase client connects, can query public schema

### Task 1.3: Admin Password Authentication
- Implement admin login function (password → bcrypt hash comparison)
- Create login endpoint: `/api/auth/login` (POST, returns JWT or session token)
- Create logout endpoint: `/api/auth/logout` (POST)
- Add middleware to protect `/admin` and `/host` routes (check token/session)
- Add "Admin" nav link to header that redirects to `/host` if already logged in
- **Acceptance:** Admin login works, token persists, protected routes redirect to login if no token

## Phase 2: Data Model & Seed Data

### Task 2.1: Create Supabase Tables
- Create `sections` table with all 6 sections pre-populated
- Create `questions` table (section-scoped)
- Create `rooms` table (code generation logic in app, not DB)
- Create `room_participants` table
- Create `answers` table
- Create `certificates` table
- Create `admin_credentials` table (single row, hashed password)
- Enable RLS if needed (or disable for v1 simplicity; document decision)
- **Acceptance:** All tables created, can insert/query rows via Supabase UI

### Task 2.2: Seed Sample Data
- Insert 6 sections with names, grade ranges, tier colors, icon names
- Insert 10–15 sample questions per section (mix of MCQ and numeric, across all 3 round types)
- Insert one admin credential (password: default phrase, e.g. "admin123")
- **Acceptance:** Sample data visible in Supabase UI, queries return expected rows

### Task 2.3: Database Helper Functions
- Create `lib/db.ts` with typed functions:
  - `getSection(id)`, `getAllSections()`
  - `getQuestionsBySection(sectionId, roundType, difficulty?)`
  - `createRoom(roundType, sectionId, timeLimitSeconds?)` → returns room with generated code
  - `getRoomByCode(code)`, `getRoomById(id)`
  - `addRoomParticipant(roomId, studentName)` → returns participant record
  - `recordAnswer(participantId, questionId, response, isCorrect, timeTaken?)`
  - `updateParticipantScore(participantId, newScore)`
  - `getRoomLeaderboard(roomId)` → sorted by live_score DESC
  - `createCertificate(recipientName, sectionId, mode, roundType, score)`
  - `getAdminPasswordHash()`, `verifyAdminPassword(plaintext)`
- **Acceptance:** All functions typed, no console errors, can call from API routes

## Phase 3: Routes & Pages

### Task 3.1: Homepage (`/`)
- Create layout with:
  - Header (logo + "Join room" + "Admin" nav)
  - Hero section (cycling background patterns, headline, subheading, level-up path, CTAs)
  - Section grid (6 cards, tier colors, icons, clickable to `/practice?section=[id]`)
- Implement background pattern cycling (4.5s interval, respect `prefers-reduced-motion`)
- Implement level-up path (animated on load, each node clickable)
- Verify responsive layout (mobile → tablet → desktop)
- **Acceptance:** Hero cycles patterns smoothly, level-up path draws in, section cards clickable, mobile-responsive

### Task 3.2: Practice Mode Selector (`/practice`)
- Display section picker (if no section in URL) or skip to round type selector
- Display 3 round type cards (Grid, Tiered, Sprint)
- Clicking a round type → navigate to `/practice/[section]/[roundType]`
- **Acceptance:** Section and round type selection flow works, navigates to practice round

### Task 3.3: Practice Round Player (`/practice/[section]/[roundType]`)
- Fetch 20 random questions from DB (section-scoped, round-type-scoped)
  - **Query logic:** `SELECT * FROM questions WHERE section_id = ? AND round_type = ? ORDER BY RANDOM() LIMIT 20`
  - If < 20 questions available in pool, use all available
- Render questions sequentially:
  - Question card with content
  - Answer input (MCQ buttons or numeric field)
  - Instant feedback (correct/incorrect, colors)
  - "Next" button to advance
  - Question counter + timer (if round type has one)
- On final question completion:
  - Calculate final score (sum of `points` for correct answers)
  - Create certificate record in DB
  - Show completion screen with score + download link
- **Acceptance:** Can answer 20 randomly-selected questions, feedback works, certificate created on completion, different sessions show different questions

### Task 3.4: Join Competition (`/join`)
- Simple form: Room code input + Name input
- Validate room code exists and status is "waiting"
- POST to create room participant
- On success: redirect to `/room/[code]`
- **Acceptance:** Can enter room code, join, redirect to room lobby

### Task 3.5: Room Lobby (`/room/[code]`)
- Fetch room details from DB
- Display:
  - Room code
  - Section name
  - Round type
  - Participants list (real-time via Realtime)
  - Status ("Waiting for admin to start...")
  - If admin is logged in AND room owner: "Start" button
  - If student: "Waiting..." message
- Admin clicking "Start" → update room status to "active" → round begins
- **Acceptance:** Lobby loads, shows participants in real time, admin can start round

### Task 3.6: Live Round Player (`/room/[code]/play`)
- Fetch current question
- Render based on round type:
  - **Grid:** 5×5 grid, each cell clickable → opens question modal
  - **Tiered:** Sequential questions filtered by difficulty, show difficulty tier
  - **Sprint:** Rapid-fire questions, timer counts down from time_limit_seconds
- Sync timer via Supabase Realtime (all participants see same countdown)
- On answer submit: record in `answers` table, update participant score in real-time
- On timer = 0 or manual admin end: round ends, redirect to `/room/[code]/leaderboard`
- **Acceptance:** Questions display, answers record, timer syncs, can complete round

### Task 3.7: Live Leaderboard (`/room/[code]/leaderboard`)
- Fetch final leaderboard from DB (sorted by score DESC)
- Display:
  - Rank 1–3 with gold/silver/bronze styling
  - All participants with score
  - Each participant has a certificate download link
- **Acceptance:** Leaderboard displays correctly, scores shown, certificate links present

### Task 3.8: Host/Admin Panel (`/host`)
- Protected by admin password (middleware check)
- Admin-only controls:
  - Select round type (Grid / Tiered / Sprint)
  - Select section
  - Optional: time limit for Sprint rounds
  - Button: "Create room" → generates unique code
  - Display list of active/recent rooms
  - Button per room: "View room" (→ `/room/[code]`)
- **Acceptance:** Logged-in admin can create rooms, see list, view active rooms

### Task 3.9: Admin Question Bank (`/admin`)
- Protected by admin password (middleware check)
- Display:
  - Section filter dropdown
  - Round type filter dropdown
  - Difficulty tier filter (if applicable)
  - Table of questions matching filters
  - Add/edit/delete buttons

#### Single-Question Entry
- CRUD forms:
  - **Add:** Modal or page with fields (section, round type, difficulty, content, answer type, options, correct answer, points)
  - **Edit:** Pre-populate form with existing question data
  - **Delete:** Confirm dialog, delete row

#### Bulk CSV Import
- **Upload form:** File input (accept `.csv`)
- **Validation:** Row-by-row checks:
  - Required fields present (section, round_type, content, answer_type, correct_answer)
  - answer_type is "mcq" or "numeric"
  - For MCQ: `option_a–d` populated, `correct_answer` matches exact text of one option
  - For numeric: `option_a–d` empty/null, `correct_answer` is valid number
  - section exists in DB
  - difficulty_tier valid (easy/medium/hard or null)
- **Error report:** Display rows that failed with specific error (e.g., "Row 5: correct_answer 'E' does not match any option for MCQ")
- **Success feedback:** "X rows imported successfully, Y rows failed"
- **Rollback on error:** Option to fix CSV and re-upload; failed rows not inserted

#### CSV Template Download
- Link: "Download CSV template" on /admin
- File: `math_olympiad_template.csv`
- Content: Headers + 1 MCQ example + 1 numeric example
  ```
  section,round_type,difficulty_tier,content,answer_type,option_a,option_b,option_c,option_d,correct_answer,points
  Little Maths Sprout,tiered,easy,What is 2+2?,mcq,3,4,5,6,4,1
  Rising Maths Explorers,sprint,,Solve for x: x + 5 = 12,numeric,,,,,7,1
  ```
- **Acceptance:** Can add/edit/delete questions individually, CSV imports with validation, template downloads, errors reported clearly

### Task 3.10: Certificate Download (`/certificate/[id]`)
- Fetch certificate record from DB
- Render certificate as PNG (use `satori` or `html-to-image`)
- Return PNG as downloadable file (Content-Disposition: attachment)
- Fallback UI if certificate not found
- **Acceptance:** PNG downloads, renders correctly with all certificate info

## Phase 4: Live Realtime Features

### Task 4.1: Realtime Room Participant List
- Subscribe to `room_participants` table for given room_id
- Update participant list in lobby as students join
- Unsub on component unmount
- **Acceptance:** New participants appear in real-time in lobby

### Task 4.2: Realtime Leaderboard Scoring
- Subscribe to `room_participants` table (live_score column)
- Update leaderboard scores in real-time as participants answer
- Scores animate up (counting), not jump
- **Acceptance:** Scores update live without page refresh, animation smooth

### Task 4.3: Realtime Timer Sync
- Admin starts round → broadcasts start_at timestamp via Realtime or DB update
- All participants receive same start_at → calculate countdown as `(start_at + duration) - now()`
- All timers count down in sync
- On 0, round auto-ends (client-side or server-side check)
- **Acceptance:** All participants see same countdown, timer reaches 0 simultaneously

## Phase 5: Certificate Generation

### Task 5.1: PNG Certificate Rendering
- Use `satori` + `resvg` or `html-to-image` to render HTML/React to PNG
- Create certificate component with:
  - Navy border
  - Gold seal (SW monogram, top-right)
  - Centered text: recipient name, section, score, date, round type
  - Clean, printable layout (1200×800px)
- Endpoint: `/api/certificate/generate` (POST, accepts certificate data, returns PNG buffer)
- **Acceptance:** Certificate downloads, text renders clearly, dimensions correct

### Task 5.2: Link Certificate to Completion
- On practice round completion: create certificate record, display download link
- On competition round end: create certificate records for all participants, display link in leaderboard
- Both links go to `/certificate/[id]` (public download route)
- **Acceptance:** Certificate created after round ends, download link works

## Phase 6: Visual Polish & Responsive Design

### Task 6.1: Responsive Layout Pass
- Test all pages on mobile (375px), tablet (768px), desktop (1920px)
- Adjust grid layouts, font sizes, spacing for each breakpoint
- Ensure touch targets are ≥44×44px on mobile
- **Acceptance:** Pages render correctly at all breakpoints, no horizontal scroll

### Task 6.2: Design System Implementation
- Apply Tailwind color tokens (ink-navy, marigold, etc.) consistently
- Use Space Grotesk for headlines, Inter for body, IBM Plex Mono for monospace
- Apply section tier colors to cards, icons, accents throughout
- Verify background patterns (graph paper, dot grid, etc.) render correctly
- **Acceptance:** Design matches spec, colors/fonts consistent across pages

### Task 6.3: Accessibility & Motion
- Test with keyboard navigation (Tab, Enter, Escape)
- Verify all focus states visible (2–3px focus ring)
- Implement `prefers-reduced-motion` media query (disable animations if set)
- Verify color contrast (WCAG AA minimum 4.5:1 for body text)
- **Acceptance:** Keyboard nav works, focus states visible, animations pause with prefers-reduced-motion

### Task 6.4: Micro-interactions
- Hover states on all buttons/cards (scale, shadow, color shift)
- Press states (slight scale-down)
- Loading states (spinner, disabled button)
- Success/error feedback (toast or inline message)
- **Acceptance:** All interactive elements have clear feedback

## Phase 7: Deployment & Testing

### Task 7.1: Deploy to Vercel
- Connect Git repo to Vercel
- Set environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Deploy main branch
- Test all routes in production
- **Acceptance:** App runs on Vercel, no build errors, routes accessible

### Task 7.2: End-to-End Testing
- Test complete practice flow: select section → round type → answer questions → download certificate
- Test complete competition flow: admin create room → students join → start → answer → see leaderboard → download certificate
- Test Grid Round: claim cells, verify cell state updates live
- Test Tiered Round: answer different difficulties, verify points correct
- Test Speed Sprint: timer counts down, rapid questions
- Test admin question bank: CRUD operations
- **Acceptance:** All major user flows work without errors

### Task 7.3: Staff/Student UAT
- Recruit 2–3 teachers and 5–10 students for real-world testing
- Provide feedback form (ease of use, clear instructions, bugs)
- Iterate on feedback
- **Acceptance:** No critical bugs, positive feedback on UX

## Timeline & Prioritization

- **Phase 1–2** (P0): Must complete before any features work — 2–3 days
- **Phase 3.1–3.4** (P1): Homepage + practice basics — 2–3 days
- **Phase 3.5–3.8** (P1): Live rooms + admin — 2–3 days
- **Phase 4** (P2): Realtime features (leaderboard, timer) — 1–2 days
- **Phase 5** (P2): Certificate generation — 1 day
- **Phase 6** (P3): Polish & responsive — 2–3 days
- **Phase 7** (P3): Deployment & testing — 1–2 days
- **Total estimate:** 12–18 days for full launch

## Success Criteria Checklist

- ✓ Students can practice solo without login
- ✓ Admin can create live rooms with unique codes
- ✓ Live leaderboard updates in real-time
- ✓ Certificates auto-generate as PNG on completion
- ✓ All 3 round types functional (Grid, Tiered, Sprint)
- ✓ 6 sections accessible and colored per spec
- ✓ Responsive on mobile/tablet/desktop
- ✓ Accessibility: keyboard nav + focus states + prefers-reduced-motion
- ✓ Design matches spec (colors, fonts, patterns, micro-interactions)
- ✓ No paid services used (Vercel + Supabase free tier)
- ✓ UAT passed with 2–3 staff + 5–10 students

# Requirements — Seat of Wisdom Math Olympiad

## User Roles

### Student
- **Practice Mode:** Name + section selection, no password, self-paced
- **Competition Mode:** Name + room code to join a live round
- **No persistent account**

### Admin/Teacher
- **Shared password** (hashed, single credential for now; schema supports per-user accounts later)
- Access to /admin (question bank CRUD, results view) and /host (live room control)

## Sections (Fixed)

All six sections are fixed (no dynamic topic filtering). Each has:
- Unique color tier (green → gold journey)
- Icon (seedling, compass, calculator, puzzle, sword, trophy)
- Grade range

| Section | Grade Range | Color | Icon |
|---------|-------------|-------|------|
| Little Maths Sprout | Sprout 1-2 | #4CAF7D | Seedling |
| Rising Maths Explorers | Stepping Stone–Grade 1 | #3FA79A | Compass |
| Clever Calculators | Grade 2-3 | #3E8FC4 | Calculator |
| Elite Problem Solvers | Grade 4-5 | #6C4EE3 | Puzzle |
| Algebra Warriors | Grade 7-9 / JSS1-3 | #C2478C | Sword |
| Grand Maths Master League | Grade 10-11 / SSS1-2 | #F4A73B | Trophy |

## Modes

### Practice Mode
- Solo, self-paced, no login
- Student picks section → picks round type (Grid / Tiered / Sprint)
- **Question selection:** System randomly selects 20 questions from the section+round-type pool (not fixed; each session varies)
- Instant feedback per question
- **On completion:** Auto-generate and download PNG certificate
- Untimed or self-timed depending on round type

### Competition Mode
- Live, admin-hosted, password-gated
- Admin logs in at /host → selects round type + section → system generates unique room code
- Students join at /join with room code + name → land in live lobby
- Admin clicks "Start" → round begins simultaneously, synced timer via Supabase Realtime
- **Live leaderboard** updates in real time as students answer
- **On round end:** Each participant gets auto-generated certificate (name, section, score, date)

## Round Types

### Grid Round
- Shared 5×5 grid (25 questions)
- Race dynamic: first correct answer claims the cell (visible live to all)
- Background: graph paper
- Admin-gated for competition; open for practice
- **Points:** 1 point per correctly claimed cell

### Tiered Difficulty Round
- Questions grouped by difficulty: Easy / Medium / Hard
- Harder tiers worth more points
- Example: Easy = 1pt, Medium = 2pts, Hard = 3pts
- Admin-gated for competition; open for practice
- **Time:** Optional self-timed or unlimited

### Speed Sprint Round
- Continuous question stream within fixed time window (3–5 minutes)
- Score = correct answers within window
- Background: number line
- Admin-gated for competition; open for practice
- **Points:** 1 point per correct answer

## Routes

| Route | Purpose | Auth | Audience |
|-------|---------|------|----------|
| `/` | Homepage (hero, section picker) | None | Public |
| `/join` | Enter room code + name | None | Students joining competitions |
| `/practice` | Pick section + round type | None | Students doing practice |
| `/room/[code]` | Live lobby → play → leaderboard | Room code | Students in competition |
| `/host` | Create/control live room | Admin password | Teachers/admin |
| `/admin` | Question bank CRUD, results | Admin password | Teachers/admin |
| `/certificate/[id]` | Download PNG certificate | Public (link) | Certificate recipients |

## Data Model (Supabase/Postgres)

### `sections`
```
id: UUID (PK)
name: TEXT (e.g. "Little Maths Sprout")
grade_range: TEXT (e.g. "Sprout 1-2")
tier_color: TEXT (hex, e.g. "#4CAF7D")
icon_name: TEXT (e.g. "seedling")
created_at: TIMESTAMP DEFAULT now()
```

### `questions`
```
id: UUID (PK)
section_id: UUID (FK)
round_type: TEXT (grid, tiered, sprint)
difficulty_tier: TEXT (easy, medium, hard, or null for grid/sprint)
content: TEXT (question text)
answer_type: TEXT (mcq, numeric)
correct_answer: TEXT or JSONB (single answer or array for numeric variations)
options: JSONB (null for numeric; for mcq: ["A", "B", "C", "D"])
points: INTEGER (default 1)
created_at: TIMESTAMP DEFAULT now()
```

### `rooms`
```
id: UUID (PK)
code: TEXT UNIQUE (generated 6-char alphanumeric)
round_type: TEXT (grid, tiered, sprint)
section_id: UUID (FK)
status: TEXT (waiting, active, ended)
time_limit_seconds: INTEGER (null for untimed; e.g. 180 for 3 min sprint)
created_at: TIMESTAMP DEFAULT now()
started_at: TIMESTAMP (null until admin clicks start)
ended_at: TIMESTAMP (null until round ends)
```

### `room_participants`
```
id: UUID (PK)
room_id: UUID (FK)
student_name: TEXT
live_score: INTEGER (default 0, real-time increment)
joined_at: TIMESTAMP DEFAULT now()
submitted_at: TIMESTAMP (null until student completes round)
```

### `answers`
```
id: UUID (PK)
participant_id: UUID (FK)
question_id: UUID (FK)
response: TEXT (student's answer)
is_correct: BOOLEAN
time_taken_seconds: FLOAT (null for non-timed rounds)
submitted_at: TIMESTAMP DEFAULT now()
```

### `certificates`
```
id: UUID (PK)
recipient_name: TEXT
section_id: UUID (FK)
mode: TEXT (practice, competition)
round_type: TEXT (grid, tiered, sprint)
score: INTEGER
date_issued: DATE
certificate_image_url: TEXT (optional, for future CDN storage)
created_at: TIMESTAMP DEFAULT now()
```

### `admin_credentials`
```
id: UUID (PK)
password_hash: TEXT (bcrypt)
created_at: TIMESTAMP DEFAULT now()
updated_at: TIMESTAMP
```
*Note: Single row for now; schema supports multiple rows (one per admin) by adding `admin_id: TEXT UNIQUE` in future.*

## Feature Requirements

### Practice Mode Flow
1. Student lands on `/practice`
2. Selects section (6-card grid)
3. Selects round type (Grid / Tiered / Sprint)
4. Round starts (untimed or self-timed)
5. Instant feedback per question
6. On completion: Certificate auto-generates → downloadable PNG

### Competition Mode Flow
1. **Admin:** /host → password-protected → selects round type + section → system generates room code
2. **Admin:** Displays room code; students given code (via QR or verbal)
3. **Students:** /join → enter code + name → land in `/room/[code]` lobby
4. **Lobby state:** Students waiting, admin controls start
5. **Admin:** Clicks "Start" → round begins, timer synced via Realtime
6. **Play state:** Live leaderboard updates as students answer
7. **End state:** Round timer expires or admin ends manually → participants see final leaderboard + certificate link
8. **Certificate:** Each participant auto-receives a downloadable PNG

### Admin Question Bank
- CRUD for questions (section-scoped, round-type-scoped)
- **Single-question entry form:** Add/edit/delete individual questions
- **Bulk CSV import:** Upload spreadsheet with multiple rows
  - CSV columns: `section`, `round_type`, `difficulty_tier`, `content`, `answer_type`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `points`
  - For MCQ: `option_a–d` filled, `correct_answer` matches the exact text of one option
  - For numeric: `option_a–d` left blank, `correct_answer` holds the numeric value
  - Row-level validation: check required fields, answer_type consistency, correct_answer matches option for MCQ
  - Error report: display rows that failed to import with specific error reason
  - Success: display count of rows imported, updated UI to show new questions
- **CSV template download:** Pre-filled headers + 1 example MCQ row + 1 example numeric row (downloadable from /admin)
- View past results (student name, section, score, date, round type)
- Filter by section, round type, difficulty (for viewing/searching)

### Live Leaderboard
- Real-time score updates via Supabase Realtime
- Monospace digits
- Top 3: gold/silver/bronze styling
- Scores animate up (counting), not jump

### Certificates
- PNG format (not PDF)
- Navy border, gold seal, clean/printable layout
- Elements: recipient name, section, score, date, round type
- Downloadable via `/certificate/[id]`

## Design & UX Constraints

See `design.md` for full details. Key points:
- **Responsive:** Mobile-first, down to mobile
- **Motion:** Respect prefers-reduced-motion; one orchestrated hero reveal on load
- **Focus states:** Visible keyboard focus throughout
- **Copy:** Sentence case, no ALL CAPS, no exclamation marks in system UI
- **Background patterns:** 5 math-themed patterns cycle on hero; fixed patterns per screen context
- **Micro-interactions:** Hover/press feedback on all interactive elements

## Assumptions & Non-Goals

### Assumptions
- **Question pool per section+round-type:** Admin maintains up to ~200 questions per section/round-type combo
- **Random selection:** Each practice session randomly selects 20 questions from that pool (varying between attempts and between students)
- **Room codes:** 6-character alphanumeric, auto-generated (no custom codes yet)
- **Grid round:** Always 5×5 (25 questions)
- **Speed Sprint:** Default 3 minutes; configurable via admin panel
- **Certificates:** Print well on A4/Letter (landscape, 1200×800px)
- **Admin password:** Shared (all staff use same credential); per-user accounts designed in schema but not implemented
- **CSV import:** Requires exact format match; admin exports template to fill and re-upload
- **No email notifications or external integrations in v1**

### Non-Goals
- Individual student accounts or login persistence
- Payment processing
- Topic-based filtering (section is the only category)
- Third-party ads or tracking
- Student performance analytics (view-only for v1)
- Multi-language support (English only for now)
- Exporting results as CSV/JSON (for v1; admin can view in-app)

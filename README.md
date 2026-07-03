# Seat of Wisdom Math Olympiad

An interactive math competition platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Getting Started

### Phase 1: Project Setup

#### 1.1 Install Dependencies

First, free up some disk space (at least 2GB), then:

```bash
npm install
```

This will install:
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Supabase JS client
- bcryptjs (for password hashing)
- satori + @resvg/resvg-js (for certificate generation)

#### 1.2 Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the placeholder homepage.

### Phase 2: Supabase Setup

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free tier project
2. Note your project URL and anon key from Project Settings → API

#### 2.2 Set Environment Variables

Create a `.env.local` file (use `.env.local.example` as a template):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_PASSWORD_HASH=your-bcrypt-hash-here
JWT_SECRET=your-jwt-secret-here
```

#### 2.3 Create Database Tables

1. In Supabase dashboard, go to SQL Editor
2. Copy and paste contents of `supabase/schema.sql`
3. Run the SQL script

This creates:
- `sections` - 6 math levels
- `questions` - MCQ and numeric questions per section
- `rooms` - Live competition rooms
- `room_participants` - Students in rooms
- `answers` - Student responses
- `certificates` - Generated certificates
- `admin_credentials` - Admin login

#### 2.4 Seed Sample Data

1. In Supabase SQL Editor
2. Copy and paste contents of `supabase/seed.sql`
3. Run the SQL script

This populates:
- 6 sections (Little Maths Sprout through Elite Maths Champions)
- 30+ sample questions across sections and round types
- 1 admin credential with default password

#### 2.5 Generate Admin Password Hash

For production, create a bcrypt hash for your admin password:

```bash
npm run generate-admin-hash
```

Or manually generate one:

```javascript
const bcrypt = require("bcryptjs");
const hash = await bcrypt.hash("your-password", 10);
console.log(hash);
```

Update the `admin_credentials` table with this hash.

### Directory Structure

```
maths-sow/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── page.tsx              # Homepage
│   ├── api/                  # API routes
│   ├── practice/             # Practice routes
│   ├── join/                 # Join competition
│   ├── room/                 # Live room routes
│   ├── admin/                # Admin panel
│   └── host/                 # Host/organizer panel
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── db.ts                 # Database helper functions
├── components/               # React components
├── supabase/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Sample data
├── public/                   # Static assets
├── .env.local.example        # Environment variables template
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Functions

All database operations are in `lib/db.ts`:

**Sections:**
- `getSection(id)` - Fetch single section
- `getAllSections()` - Fetch all 6 sections

**Questions:**
- `getQuestionsBySection(sectionId, roundType, difficulty?)` - Fetch questions

**Rooms:**
- `createRoom(roundType, sectionId, timeLimitSeconds?)` - Create new room
- `getRoomByCode(code)` - Fetch room by unique code
- `getRoomById(id)` - Fetch room by ID

**Participants:**
- `addRoomParticipant(roomId, studentName)` - Add student to room
- `getRoomParticipants(roomId)` - Get all students in room
- `getRoomLeaderboard(roomId)` - Get sorted leaderboard

**Answers:**
- `recordAnswer(participantId, questionId, response, isCorrect, timeTaken?)` - Record answer
- `updateParticipantScore(participantId, points, correctAnswer)` - Update score

**Certificates:**
- `createCertificate(recipientName, sectionId, mode, roundType, score)` - Create certificate
- `getCertificate(id)` - Fetch certificate

**Admin:**
- `getAdminPasswordHash()` - Get stored password hash
- `verifyAdminPassword(plaintext)` - Verify password against hash

## Features

### Phases

1. **Phase 1-2** (Current): Scaffolding, Supabase setup, database schema, seed data
2. **Phase 3**: Routes & pages (homepage, practice, competition, admin)
3. **Phase 4**: Realtime features (leaderboard, timer sync)
4. **Phase 5**: Certificate generation
5. **Phase 6**: Polish & responsive design
6. **Phase 7**: Deployment & testing

### Round Types

- **Grid**: 5×5 grid of questions, click to open
- **Tiered**: Sequential difficulty tiers (easy → medium → hard)
- **Sprint**: Rapid-fire with countdown timer

### Sections

1. Little Maths Sprout (K-2)
2. Rising Maths Explorers (3-4)
3. Maths Navigators (5-6)
4. Problem Solvers Academy (7-8)
5. Advanced Maths Craftsmen (9-10)
6. Elite Maths Champions (11-12)

## Design System

### Colors

- **Ink Navy**: `#1a1d2e` (primary)
- **Ink Slate**: `#3d3f4d` (secondary)
- **Marigold**: `#f5a623` (accent)
- **Sage**: `#7cb342` (section 1)
- **Coral**: `#ff6b6b` (section 2)
- **Sky**: `#4db8ff` (section 3)

### Fonts

- **Space Grotesk**: Headlines (Google Fonts)
- **Inter**: Body text (Google Fonts)
- **IBM Plex Mono**: Code & monospace (Google Fonts)

### Accessibility

- Keyboard navigation support
- WCAG AA color contrast (4.5:1 minimum)
- `prefers-reduced-motion` support
- Focus states (2-3px focus ring)

## Deployment

Deploy to [Vercel](https://vercel.com):

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

## License

ISC

# Setup Instructions - Phases 1-2

## Current Status ✓

**Completed:**
- ✓ Next.js 15 project scaffolding
- ✓ TypeScript, Tailwind CSS configuration
- ✓ Project structure created
- ✓ Database schema defined (`supabase/schema.sql`)
- ✓ Sample seed data prepared (`supabase/seed.sql`)
- ✓ Database helper functions written (`lib/db.ts`)
- ✓ Supabase client setup (`lib/supabase.ts`)
- ✓ Environment variables template (`.env.local.example`)
- ✓ Core dependencies partially installed (Next.js, React, TypeScript, Tailwind)

**Blocked by Disk Space:**
- ⚠ `npm install` did not complete due to insufficient disk space
- Missing packages: `bcryptjs`, `@supabase/supabase-js`, `satori`, `@resvg/resvg-js`

---

## Next Steps

### 1. FREE UP DISK SPACE (Critical)

You need **at least 2-3 GB** of free space. Options:

- Delete old project folders
- Clear temp files: `C:\Users\User\AppData\Local\Temp`
- Uninstall unused applications
- Run Disk Cleanup utility
- Delete npm cache: `npm cache clean --force` (once space is freed)

**Verify free space:**
```powershell
Get-Volume C: | Select-Object Size, SizeRemaining
```

### 2. COMPLETE NPM INSTALLATION

Once disk space is freed:

```bash
cd "c:\Users\User\Desktop\maths sow"
npm install
```

This will install the missing packages.

### 3. SET UP SUPABASE PROJECT

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free tier)
3. Create new project
4. Note your:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **Anon Key** (under Settings → API)

### 4. CREATE `.env.local` FILE

Create `c:\Users\User\Desktop\maths sow\.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_PASSWORD_HASH=$2a$10$YQv8PlkzYlKSHEZA8TK1BOhqwM5EEG/JGvgCGLxAChD9Gw.6Ey5hS
JWT_SECRET=your-jwt-secret-here-generate-a-random-string
```

### 5. CREATE DATABASE TABLES

In Supabase dashboard:

1. Go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Wait for success message

### 6. SEED SAMPLE DATA

In Supabase dashboard (same SQL Editor):

1. Click "New Query"
2. Copy contents of `supabase/seed.sql`
3. Paste and click "Run"
4. Verify data in Table Editor (should see 6 sections, 30+ questions, etc.)

### 7. TEST SUPABASE CONNECTION

Run dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`

You should see the placeholder homepage. Check browser console for any Supabase connection errors.

### 8. VERIFY DATABASE HELPERS

Create a test script `test-db.ts` to verify connections:

```typescript
import { getAllSections, getSection } from "@/lib/db";

async function test() {
  const sections = await getAllSections();
  console.log("Sections:", sections);
  
  if (sections.length > 0) {
    const section = await getSection(sections[0].id);
    console.log("Single section:", section);
  }
}

test();
```

---

## Project Files Reference

### Configuration Files
- `package.json` - Dependencies & scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind color scheme & fonts
- `next.config.ts` - Next.js configuration
- `postcss.config.js` - PostCSS/Tailwind pipeline

### Source Files
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Homepage (placeholder)
- `app/globals.css` - Global styles & fonts
- `lib/supabase.ts` - Supabase client
- `lib/db.ts` - Database functions (types + queries)

### Database Files
- `supabase/schema.sql` - Table definitions (run in Supabase first)
- `supabase/seed.sql` - Sample data (run in Supabase second)

### Documentation
- `README.md` - Project overview & usage
- `.env.local.example` - Environment variables template
- `SETUP_INSTRUCTIONS.md` - This file

---

## Database Schema Overview

### Tables Created

1. **sections** - 6 math levels (K-2 through 11-12)
2. **questions** - MCQ & numeric problems per section
3. **rooms** - Live competition rooms
4. **room_participants** - Students in rooms
5. **answers** - Student responses & scoring
6. **certificates** - Generated certificates
7. **admin_credentials** - Admin login (1 row)

### Indexes Created

- `idx_questions_section_round_type` - Fast question lookup
- `idx_rooms_code` - Fast room lookup by code
- `idx_rooms_status` - Filter rooms by status
- `idx_room_participants_room` - Get participants per room
- `idx_answers_participant` - Get answers per participant
- `idx_certificates_section` - Get certificates per section

---

## Database Helper Functions Available

### Sections
```typescript
getSection(id: string)                      // Get one
getAllSections()                            // Get all 6
```

### Questions
```typescript
getQuestionsBySection(sectionId, roundType, difficulty?)
```

### Rooms
```typescript
createRoom(roundType, sectionId, timeLimitSeconds?)
getRoomByCode(code)
getRoomById(id)
generateRoomCode()  // Creates unique code like "ABC123"
```

### Participants
```typescript
addRoomParticipant(roomId, studentName)
getRoomParticipants(roomId)
getRoomLeaderboard(roomId)  // Sorted by score
```

### Answers & Scoring
```typescript
recordAnswer(participantId, questionId, response, isCorrect, timeTaken?)
updateParticipantScore(participantId, points, correctAnswer)
```

### Certificates
```typescript
createCertificate(recipientName, sectionId, mode, roundType, score, roomId?, roomParticipantId?)
getCertificate(id)
```

### Admin
```typescript
getAdminPasswordHash()
verifyAdminPassword(plaintext)
```

---

## Admin Password Setup

### Default Hash (for testing)
Password: `admin123`
Hash: `$2a$10$YQv8PlkzYlKSHEZA8TK1BOhqwM5EEG/JGvgCGLxAChD9Gw.6Ey5hS`

### Generate Custom Hash

Use Node.js:

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

Then update `admin_credentials` table in Supabase with new hash.

---

## Design System (Pre-configured)

### Colors (Tailwind)
- `text-ink-navy` - Primary (#1a1d2e)
- `text-ink-slate` - Secondary (#3d3f4d)
- `text-marigold` - Accent (#f5a623)
- `text-sage` - Section 1 (#7cb342)
- `text-coral` - Section 2 (#ff6b6b)
- `text-sky` - Section 3 (#4db8ff)

### Fonts (Google Fonts imported)
- `font-space-grotesk` - Headlines
- `font-inter` - Body text
- `font-ibm-plex-mono` - Code

### Accessibility (Pre-built)
- WCAG AA color contrast
- `prefers-reduced-motion` support
- Focus states (2-3px ring)

---

## Troubleshooting

### "ENOSPC: no space left on device"
**Solution:** Free up disk space (see step 1)

### "Missing Supabase environment variables"
**Solution:** Create `.env.local` with correct URL and anon key

### "Cannot find module @supabase/supabase-js"
**Solution:** Run `npm install` after freeing disk space

### "Connect ECONNREFUSED 127.0.0.1:3000"
**Solution:** Dev server not running. Run `npm run dev`

### Supabase query returns null
**Solution:** Check `.env.local` URL/key are correct, verify data was seeded

---

## Next Phase

Once phases 1-2 are complete, phase 3 begins:
- **Task 3.1:** Homepage with hero, sections grid, navigation
- **Task 3.2:** Practice mode selector
- **Task 3.3:** Practice round player (answer questions, download certificate)
- **Task 3.4:** Join competition form
- **Task 3.5:** Room lobby with real-time participant list
- **And more...**

See `tasks.md` for full breakdown.

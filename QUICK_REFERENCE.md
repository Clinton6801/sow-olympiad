# Quick Reference Guide

## Available Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter

# npm install        # Complete dependency installation (blocked - needs disk space)
```

## Database Functions Quick Access

All functions are in `lib/db.ts`:

```typescript
import {
  // Sections
  getSection,
  getAllSections,

  // Questions
  getQuestionsBySection,

  // Rooms
  createRoom,
  getRoomByCode,
  getRoomById,
  generateRoomCode,

  // Participants
  addRoomParticipant,
  getRoomParticipants,

  // Scoring
  recordAnswer,
  updateParticipantScore,
  getRoomLeaderboard,

  // Certificates
  createCertificate,
  getCertificate,

  // Admin
  getAdminPasswordHash,
  verifyAdminPassword,
} from "@/lib/db";
```

## File Locations

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Homepage (placeholder) |
| `app/globals.css` | Global styles |
| `lib/supabase.ts` | Supabase client |
| `lib/db.ts` | Database functions |
| `supabase/schema.sql` | Database tables |
| `supabase/seed.sql` | Sample data |
| `.env.local.example` | Environment template |
| `tailwind.config.ts` | Design system |
| `README.md` | Full documentation |
| `SETUP_INSTRUCTIONS.md` | Setup steps |
| `PHASES_1-2_COMPLETE.md` | Completion checklist |

## Colors (Tailwind)

```
Backgrounds: bg-ink-navy, bg-ink-slate
Text: text-ink-navy, text-ink-slate
Accents: text-marigold, text-sage, text-coral, text-sky
```

## Fonts (CSS class based)

```
font-space-grotesk    # Headlines
font-inter            # Body
font-ibm-plex-mono    # Code
```

## Route Structure (To Be Built)

```
/                          # Homepage
/practice                  # Practice mode selector
/practice/[section]/[round] # Practice player
/join                      # Join competition
/room/[code]              # Room lobby
/room/[code]/play         # Live competition
/room/[code]/leaderboard  # Final results
/host                     # Admin panel (protected)
/admin                    # Question bank (protected)
/certificate/[id]         # Download certificate
/api/auth/login           # Admin login
/api/auth/logout          # Admin logout
/api/certificate/generate # Certificate generation
```

## Database Schema Summary

| Table | Columns | Notes |
|-------|---------|-------|
| `sections` | 6 rows | K-2 through 11-12, tier colors, icons |
| `questions` | 30+ | Per section, round type (grid/tiered/sprint), answer type (mcq/numeric) |
| `rooms` | Dynamic | Created by admin, status: waiting→active→completed |
| `room_participants` | Dynamic | Student name, live_score, answers_submitted |
| `answers` | Dynamic | Per question answered, is_correct, points_awarded |
| `certificates` | Dynamic | Generated after round completion |
| `admin_credentials` | 1 row | Password hash for login |

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL       # From Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY  # From Supabase API settings
ADMIN_PASSWORD_HASH            # Bcrypt hash (or use default: admin123)
JWT_SECRET                     # Random string for session tokens
```

## Default Admin Credentials (for Testing)

```
Username: admin
Password: admin123
Hash: $2a$10$YQv8PlkzYlKSHEZA8TK1BOhqwM5EEG/JGvgCGLxAChD9Gw.6Ey5hS
```

## 6 Sections (Pre-seeded)

1. **Little Maths Sprout** (K-2) - Sage green
2. **Rising Maths Explorers** (3-4) - Coral
3. **Maths Navigators** (5-6) - Sky blue
4. **Problem Solvers Academy** (7-8) - Marigold
5. **Advanced Maths Craftsmen** (9-10) - Ink slate
6. **Elite Maths Champions** (11-12) - Ink navy

## 3 Round Types

| Type | Format | Timer | Questions |
|------|--------|-------|-----------|
| Grid | 5×5 clickable cells | Optional | 25 total |
| Tiered | Sequential difficulty | Optional | 3 tiers (easy→hard) |
| Sprint | Rapid fire | Required | 20 with countdown |

## Accessibility Features (Built-in)

✓ WCAG AA color contrast (4.5:1 minimum)
✓ Keyboard navigation support
✓ Focus states (2-3px ring)
✓ `prefers-reduced-motion` support (disables animations)

## Next Steps (When Disk Space Freed)

1. Run `npm install`
2. Create Supabase project
3. Get URL & anon key
4. Create `.env.local`
5. Run SQL schema in Supabase
6. Run SQL seed in Supabase
7. Run `npm run dev`
8. Start Phase 3 (routes & pages)

## Common TypeScript Interfaces

```typescript
// From lib/db.ts
interface Section {
  id: string;
  name: string;
  grade_range?: string;
  tier_color: string;
  icon_name?: string;
}

interface Question {
  id: string;
  section_id: string;
  round_type: "grid" | "tiered" | "sprint";
  content: string;
  answer_type: "mcq" | "numeric";
  correct_answer: string;
  points: number;
}

interface Room {
  id: string;
  code: string;
  section_id: string;
  round_type: "grid" | "tiered" | "sprint";
  status: "waiting" | "active" | "completed";
}

interface RoomParticipant {
  id: string;
  room_id: string;
  student_name: string;
  live_score: number;
  correct_answers: number;
}

interface Certificate {
  id: string;
  recipient_name: string;
  section_id: string;
  mode: "practice" | "competition";
  score: number;
}
```

## Troubleshooting Quick Fixes

| Error | Fix |
|-------|-----|
| "ENOSPC: no space left" | Free disk space, clear temp files |
| "Cannot find module @supabase/supabase-js" | Run `npm install` |
| "Missing Supabase environment variables" | Create `.env.local` with URL & key |
| "Cannot GET /" | Run `npm run dev` first |
| "Connection refused" | Check Supabase URL in `.env.local` |

---

**See README.md for full documentation**
**See SETUP_INSTRUCTIONS.md for step-by-step setup**
**See PHASES_1-2_COMPLETE.md for completion checklist**

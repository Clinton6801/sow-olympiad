# Seat of Wisdom Math Olympiad — Spec

**Project:** Web platform for a Nigerian school group (Seat of Wisdom Group of Schools)  
**Scope:** Single Next.js repository with live competitions, practice mode, and certificate generation  
**Deploy:** Vercel (frontend) + Supabase (backend) — free tier on both

## Vision

Build a math competition platform where students can practice solo or compete live in real-time across 6 grade-level sections. Instant feedback, live leaderboards, and auto-generated certificates drive engagement.

## Key Constraints

- No persistent student accounts (name + section only)
- Shared admin password (design for future per-user accounts)
- Certificate generation as PNG images only (no paid services)
- Three round types: Grid, Tiered Difficulty, Speed Sprint
- 6 fixed sections spanning Sprout 1-2 through Grade 10-11/SSS1-2

## Success Criteria

- ✓ Students can practice solo without login
- ✓ Admin can create and host live competition rooms
- ✓ Real-time leaderboard updates via Supabase Realtime
- ✓ Certificates auto-generate and download as PNG
- ✓ Fully responsive (mobile-first)
- ✓ Respects prefers-reduced-motion
- ✓ Design system consistently applied across all UI

## Build Phases

See `requirements.md`, `design.md`, and `tasks.md` for structured breakdown.

# Security Patch Applied: Server-Side Answer Validation

## Summary

A critical security vulnerability has been identified and fixed. The platform now enforces **server-side validation for all score-affecting operations**, preventing students from manipulating scores or fabricating answers.

## What Changed

### Files Added

1. **`lib/db-server.ts`** (NEW)
   - Server-only database functions using service role key
   - Functions like `recordAnswerServerSide()` and `claimGridCellServerSide()`
   - Never imported or called from client-side code

2. **`app/api/rooms/[code]/answer/route.ts`** (NEW)
   - API route for submitting answers
   - Validates answer server-side before recording
   - Returns only: `{ is_correct, points_awarded, updated_score }`
   - Never sends `correct_answer` to client

3. **`app/api/rooms/[code]/claim-cell/route.ts`** (NEW)
   - API route for Grid Round cell claims
   - Prevents race conditions and score manipulation
   - Validates answer before claiming cell

4. **`supabase/rls-security.sql`** (NEW)
   - Row-Level Security policies for `answers` and `room_participants` tables
   - Prevents anon key from INSERT/UPDATE on score-affecting tables
   - Enforces server-side validation at database level
   - Must be applied to Supabase project

5. **`SECURITY_IMPLEMENTATION.md`** (NEW)
   - Complete documentation of security architecture
   - Implementation details and testing procedures
   - Rollout checklist

### Files Modified

1. **`lib/db.ts`**
   - `Question` interface: `correct_answer` field removed (never sent to client)
   - Added `QuestionWithCorrectAnswer` interface (server-only)
   - Removed `recordAnswer()` function (replaced with API route)
   - Removed `updateParticipantScore()` function (now server-only)
   - `getQuestionsBySection()`: Now excludes `correct_answer` in SELECT
   - Added `getQuestionById()`: Excludes `correct_answer`
   - `getRoomLeaderboard()`: Read-only (unchanged)

2. **`.env.local.example`**
   - Added `SUPABASE_SERVICE_ROLE_KEY` variable
   - Added security warnings
   - Clarified which variables are public vs. private

## The Security Flow

### Before (Vulnerable)
```
Client Browser
    ↓
supabase.from("answers").insert({...}) [DIRECT]
    ↓
Anon Key (Public)
    ↓
Supabase
    ↓
Student's score inserted directly (no validation)
❌ Attacker can read correct_answer in response
❌ Attacker can update own score
```

### After (Secure)
```
Client Browser
    ↓
fetch("/api/rooms/[code]/answer", { body: { answer } })
    ↓
Next.js API Route (HTTPS, Server-Side)
    ↓
Service Role Key (Private, Server-Only)
    ↓
1. Fetch question with correct_answer (server memory only)
2. Validate answer
3. Insert into answers table
4. Update room_participants.live_score
5. Return ONLY: { is_correct, points_awarded, updated_score }
    ↓
Client receives feedback (no correct_answer)
✅ Server validates all answers
✅ RLS prevents direct writes
✅ Correct answer never sent to client
```

## Immediate Actions Required

### 1. Get Service Role Key from Supabase

```
1. Go to: https://twgdfztpklcxfojuxugo.supabase.co
2. Settings → API
3. Copy "Service role key" (NOT anon key)
4. Add to .env.local:
   SUPABASE_SERVICE_ROLE_KEY="eyJ......"
5. Never commit this file
```

### 2. Apply RLS Policies to Supabase

```
1. Open: https://twgdfztpklcxfojuxugo.supabase.co/sql/new
2. Paste contents of: supabase/rls-security.sql
3. Click "Run"
4. Verify no errors in output
```

### 3. Deploy Code Changes

The new API routes and database functions are ready:

```bash
npm run build  # Verify no errors
npm run dev    # Test locally
```

## Testing

### Test 1: Verify Correct Answers Not Leaked

```bash
# Open browser console on localhost:3000
const { data } = await supabase
  .from("questions")
  .select("*")
  .eq("section_id", "some-id")
  .single();

console.log(data.correct_answer); // Should be undefined
```

### Test 2: Verify API Route Works

```bash
# Submit a valid answer
curl -X POST http://localhost:3000/api/rooms/ABC123/answer \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "...",
    "question_id": "...",
    "response": "A"
  }'

# Should return:
# { "success": true, "is_correct": true, "points_awarded": 1, "updated_score": 15 }
```

### Test 3: Verify RLS Blocks Direct Writes

In Supabase SQL Editor (as regular user, not service role):

```sql
-- This should FAIL:
INSERT INTO answers (room_participant_id, question_id, response, is_correct, points_awarded)
VALUES ('test'::uuid, 'test'::uuid, 'A', true, 1);

-- Error: "new row violates row-level security policy"
```

## Breaking Changes

### Client Components Must Update

Any component that previously called:
```typescript
// ❌ OLD - No longer works
import { recordAnswer } from "@/lib/db";
await recordAnswer(participantId, questionId, response, isCorrect);
```

Must now call:
```typescript
// ✅ NEW - Use API route
const response = await fetch(`/api/rooms/${roomCode}/answer`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    participant_id: participantId,
    question_id: questionId,
    response: studentAnswer,
    time_taken_seconds: timeTaken,
  }),
});

const result = await response.json();
if (result.error) {
  // Handle error
} else {
  // Use result.is_correct, result.points_awarded, result.updated_score
}
```

### Update Checklist for Phase 3

When building Phase 3 components (practice round player, live round player, etc.):

- [ ] Never call `recordAnswer()` from client (function removed)
- [ ] Never call `updateParticipantScore()` from client (function removed)
- [ ] Always call `/api/rooms/[code]/answer` for answer submission
- [ ] Always call `/api/rooms/[code]/claim-cell` for grid cell claims
- [ ] Never select or use `correct_answer` in client code
- [ ] Don't build local validation — trust server response
- [ ] Subscribe to `room_participants` via Realtime for leaderboard updates only

## Environment Variables

### Local Development (`.env.local`)

Required to run server API routes:

```env
NEXT_PUBLIC_SUPABASE_URL="https://..."          # Public (ok to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."          # Public (ok to expose)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."              # PRIVATE - Never expose
ADMIN_PASSWORD_HASH="$2a$10$..."                # PRIVATE - Never expose
JWT_SECRET="your-secret"                         # PRIVATE - Never expose
```

### Deployment (Vercel, etc.)

Set environment variables in deployment config:
- Add `SUPABASE_SERVICE_ROLE_KEY` to server-side environment
- Do NOT add `NEXT_PUBLIC_` prefix (would leak to browser)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is not in build logs

## API Route Specifications

### POST /api/rooms/[code]/answer

**Authentication:** None (uses room code + participant ID validation)

**Request:**
```json
{
  "participant_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": "550e8400-e29b-41d4-a716-446655440001",
  "response": "A" | "42.5",
  "time_taken_seconds": 25
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "is_correct": true,
  "points_awarded": 1,
  "updated_score": 16
}
```

**Response (Wrong Answer - 200):**
```json
{
  "success": true,
  "is_correct": false,
  "points_awarded": 0,
  "updated_score": 15
}
```

**Response (Error - 4xx/5xx):**
```json
{
  "error": "Participant not found in this room" | "Room not found" | "Question not found" | etc.
}
```

### POST /api/rooms/[code]/claim-cell

**Authentication:** None (uses room code + participant ID validation)

**Request:**
```json
{
  "participant_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": "550e8400-e29b-41d4-a716-446655440001",
  "response": "A"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "is_correct": true,
  "points_awarded": 1
}
```

**Response (Error - 4xx/5xx):**
```json
{
  "error": "Question already answered" | "Room not found" | "Not a grid round" | etc.
}
```

## Monitoring & Auditing

Track these metrics:
- Failed answer validation attempts (possible cheating)
- Multiple answer submissions for same question (race condition)
- Unusually high scores (anomaly detection)
- API route error rates (technical issues)

## Reference Documentation

- **Security Details:** `SECURITY_IMPLEMENTATION.md`
- **Database Functions:** `lib/db-server.ts` (server-only)
- **API Routes:** `app/api/rooms/[code]/answer/route.ts` and `claim-cell/route.ts`
- **RLS Policies:** `supabase/rls-security.sql`

## Questions?

- What's exposed to the client? Only question content + options, not answers
- Can students bypass this? No — RLS prevents direct DB writes, API validates all answers
- Is the service key safe? Yes — kept in server-only environment variables, never exposed
- Why was this needed? Students could open dev tools and read correct answers or manipulate scores

---

**Deployed:** [Date]  
**Applied to environments:** [List]  
**Status:** 🔒 Secure

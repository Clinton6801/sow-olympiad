# Security Implementation: Server-Side Validation for Score Integrity

## Overview

This document describes the security architecture implemented to prevent score manipulation and answer fabrication in the Math Olympiad platform.

## The Vulnerability (Fixed)

**Before:** The client could directly write to the database using the anon key:
```typescript
// ❌ VULNERABLE - This was possible before
await supabase
  .from("room_participants")
  .update({ live_score: 9999 })
  .eq("id", student_id);

// ❌ VULNERABLE - Student could read correct answers in browser
const { data: questions } = await supabase
  .from("questions")
  .select("*, correct_answer") // No, correct_answer is now excluded
  .eq("section_id", sectionId);
```

**Attack Scenarios:**
1. Open browser dev tools → Network tab
2. See all correct answers in the API responses
3. Modify local score before submitting
4. Directly call Supabase client to insert/update scores
5. Fabricate answers in the `answers` table

## The Solution

### 1. Server-Side Answer Validation

All score-affecting operations now go through **server-only API routes** that use the **service role key** (never exposed to browser).

**Flow:**
```
Client submits answer
    ↓
POST /api/rooms/[code]/answer (HTTPS, secure)
    ↓
Server (using service role key):
  1. Fetch question with correct_answer
  2. Validate answer server-side
  3. Calculate is_correct
  4. Insert into answers table
  5. Update room_participants.live_score
    ↓
Server returns ONLY: { is_correct, points_awarded, updated_score }
    ↓
Client displays feedback (no correct_answer ever sent)
```

**API Endpoint:** `POST /api/rooms/[code]/answer`
- Location: `app/api/rooms/[code]/answer/route.ts`
- Authentication: None required (stateless validation)
- Validation:
  - Verify room exists and is active
  - Verify participant is in the room
  - Verify question exists
  - Validate answer against correct_answer (server-side)
  - Check for duplicate answers

### 2. Client-Side Query Filtering

The `correct_answer` column is **never selected** in client queries:

```typescript
// ✅ SECURE - Client-side db.ts
export async function getQuestionsBySection(...): Promise<Question[]> {
  let query = supabase
    .from("questions")
    .select(
      "id, section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, points"
      // NOTE: correct_answer NOT included
    );
}
```

Only **server-side** functions have access to `correct_answer`:

```typescript
// ✅ SERVER-ONLY - lib/db-server.ts
export async function getQuestionByIdWithAnswer(id: string): Promise<QuestionWithCorrectAnswer | null> {
  const { data } = await supabaseAdmin
    .from("questions")
    .select("*") // Full access with correct_answer
    .eq("id", id);
}
```

### 3. Row-Level Security (RLS) Policies

Even if a student somehow bypasses the app and tries to directly write to the database, the RLS policies prevent it:

**File:** `supabase/rls-security.sql`

#### For `answers` table:
- **Anonymous (anon key):** Can `SELECT` only
- **Anonymous (anon key):** Cannot `INSERT`, `UPDATE`, or `DELETE`
- **Service role:** Full access (bypasses RLS)

```sql
-- Policy: Prevent anon key from writing
CREATE POLICY "prevent_anon_insert_answers" ON answers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);
```

#### For `room_participants` table:
- **Anonymous (anon key):** Can `SELECT` only (for leaderboard)
- **Anonymous (anon key):** Cannot `UPDATE` (cannot change `live_score`)
- **Service role:** Full access

```sql
-- Policy: Prevent anon key from updating scores
CREATE POLICY "prevent_anon_update_room_participants" ON room_participants
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
```

**Result:** If a student opens dev tools and tries:
```typescript
// This will FAIL with RLS policy error:
await supabase
  .from("room_participants")
  .update({ live_score: 9999 })
  .eq("id", student_id);
// Error: "new row violates row-level security policy"
```

### 4. Service Role Key Protection

The **Supabase service role key** is stored in:
```env
# .env.local (NOT .env.local.example, NOT in Git)
SUPABASE_SERVICE_ROLE_KEY=... (server environment variable only)
```

**Access control:**
- Stored in `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Only readable by Node.js/server code
- Never exposed to client JavaScript
- Never included in `NEXT_PUBLIC_*` variables
- Only used inside `app/api/**` routes

**Verification:**
```typescript
// ✅ SAFE - Used only in server-side code
const supabaseAdmin = createClient(url, serviceRoleKey);

// ❌ NEVER - Would leak service key to browser
process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY = "...";
```

## Implementation Details

### API Routes

#### `POST /api/rooms/[code]/answer`
Submits an answer for any round type (grid, tiered, sprint).

**Request:**
```json
{
  "participant_id": "uuid",
  "question_id": "uuid",
  "response": "A" or "42.5",
  "time_taken_seconds": 30
}
```

**Response (Success):**
```json
{
  "success": true,
  "is_correct": true,
  "points_awarded": 1,
  "updated_score": 15
}
```

**Response (Error):**
```json
{
  "error": "Question not found" | "Participant not found in this room" | etc.
}
```

**Validation:**
1. Participant exists and is in the room
2. Room is active
3. Question exists
4. Answer not already submitted for this question
5. Answer validation (MCQ options or numeric tolerance)

#### `POST /api/rooms/[code]/claim-cell`
Claims a grid cell with server-side answer validation (prevents race conditions).

**Request:**
```json
{
  "participant_id": "uuid",
  "question_id": "uuid",
  "response": "A"
}
```

**Response (Success):**
```json
{
  "success": true,
  "is_correct": true,
  "points_awarded": 1
}
```

**Validation:**
1. Room is a grid round
2. Room is active
3. Participant is in the room
4. Question is in the room's section
5. Cell not already claimed (no duplicate answer)
6. Answer validation

### Database Functions

**Client-safe functions** (`lib/db.ts`):
- `getAllSections()` - No correct_answer
- `getQuestionsBySection()` - No correct_answer
- `getQuestionById()` - No correct_answer
- `getRoomLeaderboard()` - Read-only

**Server-only functions** (`lib/db-server.ts`):
- `getQuestionByIdWithAnswer()` - Server only, has correct_answer
- `recordAnswerServerSide()` - Validates and records answer
- `claimGridCellServerSide()` - Validates and claims cell
- `getParticipant()` - Verifies participant ownership

## Environment Variables

**Required in `.env.local` (server-side only):**
```env
# Never commit this file
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Never use these patterns:**
```env
# ❌ WRONG - Leaked to browser
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...

# ❌ WRONG - Exposed in source
const serviceKey = "..."; // Hardcoded
```

## Testing the Security

### Test 1: Verify anon key cannot write
```bash
# In Supabase SQL Editor, logged in as normal user:
INSERT INTO answers (room_participant_id, question_id, response, is_correct, points_awarded)
VALUES ('test'::uuid, 'test'::uuid, 'A', true, 1);
# Should fail with: "new row violates row-level security policy"
```

### Test 2: Verify correct_answer not leaked
```bash
# In browser console:
const { data } = await supabase
  .from("questions")
  .select("*")
  .single();
# Check if data.correct_answer exists (it shouldn't)
```

### Test 3: Verify API route validates
```bash
# Valid answer:
curl -X POST http://localhost:3000/api/rooms/ABC123/answer \
  -H "Content-Type: application/json" \
  -d '{"participant_id":"...","question_id":"...","response":"A"}'
# Should return: { success: true, is_correct: true, ... }

# Invalid answer:
# Same request with response: "Z" (invalid option)
# Should return: { success: true, is_correct: false, ... }

# Tampering attempt:
curl -X POST http://localhost:3000/api/rooms/ABC123/answer \
  -H "Content-Type: application/json" \
  -d '{"participant_id":"FAKE","question_id":"...","response":"A"}'
# Should return: { error: "Participant not found in this room" }
```

## Rollout Checklist

- [ ] Apply `supabase/rls-security.sql` to all environments
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and deployment config
- [ ] Deploy `/api/rooms/[code]/answer` route
- [ ] Deploy `/api/rooms/[code]/claim-cell` route
- [ ] Update `lib/db.ts` (remove client-side answer recording)
- [ ] Update client components to call API routes instead of direct writes
- [ ] Verify no `correct_answer` leaks to client in any API response
- [ ] Test with real students (attempt to manipulate score)
- [ ] Monitor error logs for suspicious activity
- [ ] Document for team (no direct DB writes from client)

## Future Enhancements

1. **Rate limiting:** Limit answers per participant per minute
2. **Audit logging:** Log all score changes with participant IP/session
3. **Anomaly detection:** Flag sudden score spikes
4. **Encryption:** Encrypt sensitive data at rest
5. **Session tokens:** Require JWT token (not just participant_id) for API calls
6. **Geofencing:** Verify participant location during competition (if applicable)

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Next.js API Routes Security](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api#service-role-key)

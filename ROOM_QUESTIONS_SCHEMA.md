# room_questions Table: Grid & Competition Data Model

## Overview

The `room_questions` table solves a critical data model gap: **tracking which question corresponds to which cell, and who claimed what after the fact**.

Every room (Grid, Tiered, Sprint) has a **fixed, room-specific question set** determined at room creation time. This enables:
- Deterministic grid cell-to-question mapping (same grid for all participants)
- Audit trail of cell claims (who answered correctly, when)
- Reconstruction of game state after completion
- Proper scoring for different round types

---

## Schema

```sql
CREATE TABLE room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  cell_index INT,                                   -- 0-24 for Grid (5×5), NULL for Tiered/Sprint
  position INT,                                      -- 1-20 for Tiered/Sprint, NULL for Grid
  claimed_by_participant_id UUID REFERENCES room_participants(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP,                              -- NULL until claimed (Grid only)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_room_questions_room ON room_questions(room_id);
CREATE INDEX idx_room_questions_cell ON room_questions(room_id, cell_index);
CREATE INDEX idx_room_questions_claimed ON room_questions(claimed_by_participant_id);
```

---

## Field Descriptions

| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| `id` | UUID | Primary key | Unique identifier for this cell/question mapping |
| `room_id` | UUID | Foreign key | Links to the parent room |
| `question_id` | UUID | Foreign key | Links to the question in the questions pool |
| `cell_index` | INT | Grid cells | 0-24 for Grid Round (5×5 grid cells), NULL for Tiered/Sprint |
| `position` | INT | Sequential order | 1-20 for Tiered/Sprint rounds, NULL for Grid |
| `claimed_by_participant_id` | UUID | Cell claim owner | NULL until correct answer; set when cell claimed |
| `claimed_at` | TIMESTAMP | Claim timestamp | NULL until correct answer; populated on claim |
| `created_at` | TIMESTAMP | Audit trail | When this room_questions row was created |
| `updated_at` | TIMESTAMP | Audit trail | Last time this row was updated |

---

## Behavior by Round Type

### Grid Round (5×5)

**At room creation:**
- Select 25 random questions from section's Grid questions
- Insert 25 `room_questions` rows, one per cell_index (0-24)
- `position` = NULL (unused for Grid)
- `claimed_by_participant_id` = NULL (unclaimed)

**Example:**
```
room_id: abc-123
cell_index: 0  → question_id: q-1001, claimed_by_participant_id: NULL
cell_index: 1  → question_id: q-1002, claimed_by_participant_id: NULL
cell_index: 2  → question_id: q-1003, claimed_by_participant_id: NULL
...
cell_index: 24 → question_id: q-1025, claimed_by_participant_id: NULL
```

**On correct answer (POST /api/rooms/[code]/claim-cell):**
- Server finds `room_questions` row by `room_id` + `cell_index`
- Validates answer is correct
- Updates: `claimed_by_participant_id` = participantId, `claimed_at` = now
- All participants see cell marked as claimed (via Realtime subscription)

**On incorrect answer:**
- Cell remains unclaimed (`claimed_by_participant_id` = NULL)
- Same student or any other student can try again
- Each attempt increments participant's `answers_submitted`

**Final state (example):**
```
cell_index: 0  → claimed_by_participant_id: p-100 (Student A), claimed_at: 2026-07-03 10:02:15
cell_index: 1  → claimed_by_participant_id: p-101 (Student B), claimed_at: 2026-07-03 10:03:42
cell_index: 2  → claimed_by_participant_id: NULL (unclaimed)
...
```

---

### Tiered Round (Sequential)

**At room creation:**
- Select 20 random questions from section's Tiered questions
- Insert 20 `room_questions` rows with sequential `position` (1-20)
- `cell_index` = NULL (unused for Tiered)
- `claimed_by_participant_id` = NULL

**Example:**
```
room_id: xyz-456
position: 1  → question_id: q-2001, claimed_by_participant_id: NULL, difficulty_tier: easy
position: 2  → question_id: q-2002, claimed_by_participant_id: NULL, difficulty_tier: easy
position: 3  → question_id: q-2003, claimed_by_participant_id: NULL, difficulty_tier: medium
...
position: 20 → question_id: q-2020, claimed_by_participant_id: NULL, difficulty_tier: hard
```

**Behavior:**
- Each participant works through their own question sequence
- Questions presented in order (1 → 2 → 3 ... → 20)
- On correct answer: student advances to next question
- `claimed_by_participant_id` tracks who first solved each question (optional, for leaderboard)
- Server-side answer validation as per `/api/rooms/[code]/answer`

**Note:** Tiered rounds may support *multiple attempts per cell* (student tries question 3, gets it wrong, tries again, then moves to question 4 if correct). The `claimed_by_participant_id` could remain NULL in Tiered rounds, or be set to the first participant to answer correctly. Clarify behavior if needed.

---

### Sprint Round (Rapid-Fire)

**At room creation:**
- Select 20 random questions from section's Sprint questions
- Insert 20 `room_questions` rows with sequential `position` (1-20)
- `cell_index` = NULL (unused for Sprint)
- `claimed_by_participant_id` = NULL

**Example:**
```
room_id: def-789
position: 1  → question_id: q-3001, claimed_by_participant_id: NULL
position: 2  → question_id: q-3002, claimed_by_participant_id: NULL
...
position: 20 → question_id: q-3020, claimed_by_participant_id: NULL
```

**Behavior:**
- Timer counts down (stored in rooms.time_limit_seconds)
- Questions appear one at a time
- Students submit answers as fast as possible
- On correct answer: points awarded, move to next question
- On incorrect answer: zero points, move to next question (no retry)
- `claimed_by_participant_id` unused for Sprint (not relevant)

---

## API Endpoints

### Grid Round: Claim Cell

**POST /api/rooms/[code]/claim-cell**

**Request:**
```json
{
  "participant_id": "550e8400-e29b-41d4-a716-446655440000",
  "room_question_id": "550e8400-e29b-41d4-a716-446655440001",
  "response": "A"
}
```

**Flow:**
1. Client fetches room_questions for room (includes cell_index, question_id, claimed_by_participant_id)
2. User clicks cell → client knows room_question_id
3. User submits answer → POST to /api/rooms/[code]/claim-cell with room_question_id
4. Server validates answer, updates room_questions.claimed_by_participant_id if correct
5. Realtime broadcasts updated room_questions row to all participants
6. Grid updates visually (cell marked as claimed, colored with participant's section tier)

---

## Server Functions

### Create Room Questions (called on room creation)

```typescript
// lib/db-server.ts
export async function createRoomQuestions(
  roomId: string,
  sectionId: string,
  roundType: "grid" | "tiered" | "sprint"
): Promise<RoomQuestion[] | null>
```

**Behavior:**
- Selects 25 random (Grid) or 20 random (Tiered/Sprint) questions
- Inserts room_questions rows with appropriate cell_index/position
- Returns inserted rows or null on error

**Example usage (in room creation endpoint):**
```typescript
const room = await createRoom(roundType, sectionId, timeLimitSeconds);
if (room) {
  const roomQuestions = await createRoomQuestions(room.id, sectionId, roundType);
  if (!roomQuestions) {
    // Handle error: not enough questions in pool
  }
}
```

---

### Get Room Questions (client-side read)

```typescript
// lib/db.ts (client)
export async function getRoomQuestions(roomId: string): Promise<RoomQuestion[]>
export async function getRoomQuestionByCellIndex(
  roomId: string,
  cellIndex: number
): Promise<RoomQuestion | null>
```

**Usage in Grid component:**
```typescript
// On room join, fetch all 25 cells
const roomQuestions = await getRoomQuestions(roomId);

// Render 5×5 grid with cells
// Cell state: unclaimed (empty), claimed by Student A (colored), claimed by Student B (colored)

// On cell click, fetch the question
const roomQuestion = await getRoomQuestionByCellIndex(roomId, cellIndex);
const question = await getQuestionById(roomQuestion.question_id);
// Display question modal, user submits answer
```

---

### Get Room Question by Position (for Tiered/Sprint)

```typescript
// lib/db-server.ts (server-only)
export async function getRoomQuestionByPosition(
  roomId: string,
  position: number
): Promise<RoomQuestion | null>
```

---

## Realtime Subscriptions

### Grid Cell Updates

```typescript
// Client subscribes to room_questions for this room
supabase
  .channel(`room:${roomId}:questions`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "room_questions",
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      // payload.new = updated row with claimed_by_participant_id, claimed_at
      updateGridCell(payload.new.cell_index, payload.new.claimed_by_participant_id);
    }
  )
  .subscribe();
```

All participants see the same grid update in real-time when a cell is claimed.

---

## Audit Trail & Reconstruction

### Who Claimed What?

**Query:**
```sql
SELECT
  rq.cell_index,
  rq.position,
  rq.claimed_by_participant_id,
  rp.student_name,
  rq.claimed_at,
  q.content
FROM room_questions rq
LEFT JOIN room_participants rp ON rq.claimed_by_participant_id = rp.id
LEFT JOIN questions q ON rq.question_id = q.id
WHERE rq.room_id = '...'
ORDER BY rq.claimed_at DESC;
```

**Result (Grid Round):**
| cell_index | student_name | claimed_at | question |
|------------|--------------|-----------|----------|
| 5 | Alice | 2026-07-03 10:02:15 | What is 2+2? |
| 12 | Bob | 2026-07-03 10:02:18 | Solve x + 5 = 12 |
| 3 | Alice | 2026-07-03 10:02:25 | What is 15 ÷ 3? |

---

## Row-Level Security (RLS)

```sql
-- Anon key can SELECT (read grid state)
CREATE POLICY "anon_select_room_questions" ON room_questions
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

-- Anon key CANNOT UPDATE (only server can claim cells)
CREATE POLICY "prevent_anon_update_room_questions" ON room_questions
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
```

---

## Incorrect Answer Behavior (Clarification)

**Current implementation:** On incorrect answer, cell remains unclaimed (open for anyone to retry).

**Behavior:**
- Student clicks cell, submits wrong answer → `claimed_by_participant_id` stays NULL
- Server records the answer in `answers` table (with `is_correct: false`)
- Cell is still visible and clickable
- Same student or different student can try again
- Each attempt counts toward `room_participants.answers_submitted`

**Alternative (if needed):** Lock cell after N wrong attempts, or show "locked" state. This would require additional column in room_questions (e.g., `attempts_count`, `locked_until_timestamp`). Confirm if standard behavior (retry always allowed) is correct.

---

## Summary

| Aspect | Grid Round | Tiered Round | Sprint Round |
|--------|-----------|--------------|--------------|
| Questions selected | 25 random | 20 random | 20 random |
| Mapped by | `cell_index` (0-24) | `position` (1-20) | `position` (1-20) |
| Claim behavior | Click cell, claim on correct | Sequential, optional claim tracking | Sequential, time-limited |
| Wrong answer | Cell stays open | Can retry or advance | Move to next, no retry |
| `claimed_by_participant_id` | Populated on claim | Optional tracking | Unused |

---

## Files Updated

1. **`supabase/schema.sql`** - Added `room_questions` table + indexes
2. **`supabase/rls-security.sql`** - Added RLS policies for room_questions
3. **`lib/db-server.ts`** - Added server functions for room_questions management
4. **`lib/db.ts`** - Added client functions for fetching room_questions
5. **`app/api/rooms/[code]/claim-cell/route.ts`** - Updated to use room_question_id
6. **`ROOM_QUESTIONS_SCHEMA.md`** - This documentation

---

## Deployment Checklist

- [ ] Run `supabase/schema.sql` to create table and indexes
- [ ] Run `supabase/rls-security.sql` to apply RLS policies
- [ ] Deploy updated `lib/db-server.ts` and `lib/db.ts`
- [ ] Deploy updated `/api/rooms/[code]/claim-cell/route.ts`
- [ ] Update client Grid component to use `getRoomQuestions()` and new cell claim flow
- [ ] Test: Create Grid room, verify 25 cells created, claim cell workflow works
- [ ] Test: Verify incorrect answer keeps cell unclaimed, allows retry
- [ ] Test Tiered/Sprint room creation (should populate room_questions with 20 items)

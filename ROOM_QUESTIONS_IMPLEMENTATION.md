# room_questions Table Implementation Complete

## What Was Added

A new `room_questions` table that creates a fixed, room-specific question set for **every room** (Grid, Tiered, Sprint) at creation time. This solves the critical gap: **knowing which question maps to which cell, and who claimed what**.

---

## Files Changed

### 1. Database Schema

**`supabase/schema.sql`** ✅

```sql
CREATE TABLE IF NOT EXISTS room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  cell_index INT,                    -- 0-24 for Grid, NULL for Tiered/Sprint
  position INT,                       -- 1-20 for Tiered/Sprint, NULL for Grid
  claimed_by_participant_id UUID REFERENCES room_participants(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes added:
CREATE INDEX idx_room_questions_room ON room_questions(room_id);
CREATE INDEX idx_room_questions_cell ON room_questions(room_id, cell_index);
CREATE INDEX idx_room_questions_claimed ON room_questions(claimed_by_participant_id);
```

### 2. Row-Level Security

**`supabase/rls-security.sql`** ✅

```sql
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;

-- Anon can SELECT (read grid state)
CREATE POLICY "anon_select_room_questions" ON room_questions
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

-- Anon CANNOT UPDATE (only server can claim cells)
CREATE POLICY "prevent_anon_update_room_questions" ON room_questions
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Anon CANNOT INSERT/DELETE
CREATE POLICY "prevent_anon_insert_room_questions" ON room_questions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "prevent_anon_delete_room_questions" ON room_questions
  FOR DELETE
  USING (auth.role() = 'service_role'::text);
```

### 3. Server Database Functions

**`lib/db-server.ts`** ✅

#### Added Interfaces
```typescript
export interface RoomQuestion {
  id: string;
  room_id: string;
  question_id: string;
  cell_index?: number;
  position?: number;
  claimed_by_participant_id?: string;
  claimed_at?: string;
}
```

#### Added Functions

- **`createRoomQuestions(roomId, sectionId, roundType)`**
  - Called when admin creates a room
  - Selects 25 random (Grid) or 20 random (Tiered/Sprint) questions
  - Inserts room_questions rows with cell_index or position
  - Returns inserted rows or null on error

- **`getRoomQuestionByCell(roomId, cellIndex)`**
  - Fetch question for a specific grid cell
  - Used internally by claim-cell endpoint

- **`getRoomQuestionByPosition(roomId, position)`**
  - Fetch question for Tiered/Sprint round by position
  - For sequential question access

- **`getRoomAllQuestions(roomId)`**
  - Fetch all room_questions for a room
  - For audit trails and grid rendering

- **`updateRoomQuestionClaimed(roomQuestionId, participantId)`**
  - Mark a cell as claimed
  - Sets `claimed_by_participant_id` and `claimed_at`
  - Only called on correct answer

#### Updated Functions

- **`claimGridCellServerSide(participantId, roomQuestionId, response)`**
  - Changed from using `questionId` to `roomQuestionId`
  - Now checks if cell already claimed
  - Updates room_questions table on correct answer
  - On wrong answer: cell stays open, attempt counted

### 4. Client Database Functions

**`lib/db.ts`** ✅

#### Added Interfaces
```typescript
export interface RoomQuestion {
  id: string;
  room_id: string;
  question_id: string;
  cell_index?: number;
  position?: number;
  claimed_by_participant_id?: string;
  claimed_at?: string;
}
```

#### Added Functions

- **`getRoomQuestions(roomId)`**
  - Fetch all room_questions for a room
  - Ordered by cell_index (Grid) or position (Tiered/Sprint)
  - Client uses this to render grid or question list

- **`getRoomQuestionByCellIndex(roomId, cellIndex)`**
  - Fetch specific cell for Grid rounds
  - Used when user clicks a cell

---

## Grid Round Workflow

### Room Creation (Admin)

```
1. Admin calls POST /api/rooms with:
   - section_id, round_type: "grid", time_limit_seconds
   
2. Server:
   - Creates room (status: "waiting", code: "ABC123")
   - Calls createRoomQuestions(room.id, section.id, "grid")
   - Inserts 25 room_questions rows:
     cell_index: 0 → question_id: q-1001, claimed_by_participant_id: NULL
     cell_index: 1 → question_id: q-1002, claimed_by_participant_id: NULL
     ...
     cell_index: 24 → question_id: q-1025, claimed_by_participant_id: NULL
```

### Student Joins Room

```
1. Student enters room code "ABC123"
2. Client fetches room_questions for room via getRoomQuestions(roomId)
3. Grid rendered with 25 cells:
   - Unclaimed cells: empty/grey
   - Claimed cells: colored (participant's section tier)
   - Shows "Claimed by: Student Name"
```

### Student Clicks Cell

```
1. Client fetches room_question for cell_index via getRoomQuestionByCellIndex(roomId, cellIndex)
2. Display question modal with content + options
3. Student submits answer
4. Client POSTs to /api/rooms/[code]/claim-cell:
   {
     "participant_id": "p-123",
     "room_question_id": "rq-abc", // NOT question_id
     "response": "A"
   }
```

### Server Validates & Claims

```
1. Server:
   - Validates room exists and is active
   - Validates participant is in room
   - Checks if cell already claimed (if yes, return error)
   - Fetches question with correct_answer
   - Validates response matches correct_answer
   
2. If correct:
   - Records answer in answers table (is_correct: true)
   - Updates room_questions: claimed_by_participant_id, claimed_at
   - Updates room_participants: live_score, correct_answers
   - Returns: { success: true, is_correct: true, points_awarded: 1 }
   
3. If incorrect:
   - Records answer in answers table (is_correct: false)
   - Leaves room_questions unchanged (cell stays unclaimed)
   - Increments answers_submitted
   - Returns: { success: true, is_correct: false, points_awarded: 0 }
```

### Realtime Updates

```
1. Supabase Realtime broadcasts UPDATE to room_questions
2. All participants receive: { id, claimed_by_participant_id, claimed_at, ... }
3. Grid re-renders with cell marked as claimed
```

---

## Tiered & Sprint Rounds

### Room Creation

```
1. Same flow as Grid, but:
   - Selects 20 random questions (not 25)
   - Sets position: 1, 2, 3, ... 20
   - cell_index: NULL
   - claimed_by_participant_id: NULL (optional, not used for scoring)
```

### Question Flow

```
1. Student fetches room_questions with position ordering
2. Questions presented sequentially: 1 → 2 → 3 ... → 20
3. On correct answer: advance to next, update score
4. On incorrect answer: 
   - Tiered: Can retry or skip (depends on game rules)
   - Sprint: Move to next (no retry, timer running)
```

---

## Audit & Reconstruction

### Query: Who Claimed Which Cells?

```sql
SELECT
  rq.cell_index,
  rp.student_name,
  rq.claimed_at,
  q.content,
  q.correct_answer
FROM room_questions rq
LEFT JOIN room_participants rp ON rq.claimed_by_participant_id = rp.id
LEFT JOIN questions q ON rq.question_id = q.id
WHERE rq.room_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY rq.cell_index ASC;
```

Result:
```
cell_index | student_name | claimed_at | content | correct_answer
0          | Alice        | 10:02:15   | 2+2=?   | 4
1          | NULL         | NULL       | 5+3=?   | 8
2          | Bob          | 10:03:42   | 10-5=?  | 5
...
```

### Query: Leaderboard by Claims

```sql
SELECT
  rp.student_name,
  rp.live_score,
  COUNT(rq.claimed_by_participant_id) as cells_claimed
FROM room_participants rp
LEFT JOIN room_questions rq ON rq.claimed_by_participant_id = rp.id
WHERE rp.room_id = '...'
GROUP BY rp.id
ORDER BY rp.live_score DESC;
```

---

## API Changes

### POST /api/rooms/[code]/claim-cell

**Old Request:**
```json
{
  "participant_id": "...",
  "question_id": "...",      // ❌ OLD
  "response": "A"
}
```

**New Request:**
```json
{
  "participant_id": "...",
  "room_question_id": "...", // ✅ NEW
  "response": "A"
}
```

**Response (unchanged):**
```json
{
  "success": true,
  "is_correct": true,
  "points_awarded": 1
}
```

---

## Deployment Steps

1. **Run schema migration:**
   ```sql
   -- Copy entire supabase/schema.sql content
   -- Paste into Supabase SQL Editor
   -- Click Run
   ```

2. **Apply RLS policies:**
   ```sql
   -- Copy entire supabase/rls-security.sql content
   -- Paste into Supabase SQL Editor
   -- Click Run
   ```

3. **Deploy code:**
   ```bash
   git add lib/db.ts lib/db-server.ts app/api/rooms/
   git commit -m "feat: implement room_questions table for fixed question sets"
   git push
   ```

4. **Test Room Creation:**
   ```bash
   # Create a Grid room
   curl -X POST http://localhost:3000/api/admin/rooms \
     -H "Content-Type: application/json" \
     -d '{
       "section_id": "...",
       "round_type": "grid",
       "time_limit_seconds": null
     }'
   
   # Verify: 25 room_questions rows created
   SELECT COUNT(*) FROM room_questions WHERE room_id = '...';
   # Expected: 25
   ```

5. **Test Grid Claim:**
   ```bash
   # Fetch room_questions for display
   const roomQuestions = await getRoomQuestions(roomId);
   
   # Click a cell, submit answer
   curl -X POST http://localhost:3000/api/rooms/ABC123/claim-cell \
     -H "Content-Type: application/json" \
     -d '{
       "participant_id": "...",
       "room_question_id": "...", # Use room_question_id, not question_id
       "response": "A"
     }'
   
   # Verify: room_questions row updated with claimed_by_participant_id and claimed_at
   ```

---

## Backward Compatibility

✅ **No breaking changes to existing data:**
- `rooms` table unchanged
- `questions` table unchanged
- `answers` table unchanged
- `room_participants` table unchanged

✅ **New table is additive:**
- Existing rooms created before deployment still work
- Rooms created after deployment use room_questions

⚠️ **If you need to backfill room_questions for existing rooms:**
```sql
INSERT INTO room_questions (room_id, question_id, cell_index)
SELECT r.id, q.id, ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY RANDOM()) - 1
FROM rooms r
CROSS JOIN questions q
WHERE r.round_type = 'grid'
  AND q.section_id = r.section_id
  AND q.round_type = 'grid'
  AND NOT EXISTS (SELECT 1 FROM room_questions WHERE room_id = r.id)
LIMIT 25 * (SELECT COUNT(*) FROM rooms WHERE round_type = 'grid');
```

---

## Incorrect Answer Behavior (Confirmed)

✅ **Current implementation:**
- Student answers incorrectly → cell stays unclaimed
- Same or different student can try again
- Each attempt counts toward `answers_submitted`
- Multiple attempts on same cell allowed

**If future behavior needed (e.g., "lock after 3 wrong attempts"):**
- Add column: `attempts_count INT DEFAULT 0`
- Add column: `locked_until_timestamp TIMESTAMP`
- Update logic to check these fields

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Grid cell mapping | Unknown | Tracked via `cell_index` in room_questions |
| Question selection | Random per-student | Fixed per-room at creation |
| Cell claims | No audit trail | Tracked: who claimed, when |
| Wrong answers | Indeterminate | Cell stays open for retry |
| Tiered/Sprint | No structure | Fixed 20-question set per room |
| Auditable | No | Yes (full claim history) |

✅ **Implementation complete and ready for Phase 3 development.**

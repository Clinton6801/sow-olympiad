-- Phase 2.4: Row-Level Security (RLS) Policies for Score Integrity
-- 
-- This file enforces server-side validation by making it impossible for the
-- client-side anon key to directly INSERT or UPDATE score-affecting tables.
-- The anon key can only READ. All writes must go through server API routes
-- using the service role key.

-- ============================================================================
-- ENABLE RLS ON SCORE-AFFECTING TABLES
-- ============================================================================

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ANSWERS TABLE: Anonymous users can ONLY SELECT (for viewing their answers)
-- No INSERT, UPDATE, DELETE allowed via anon key
-- ============================================================================

-- Allow anonymous users to SELECT answers (read leaderboard, review submitted answers)
CREATE POLICY "anon_select_answers" ON answers
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

-- Explicitly prevent INSERT via anon key (only service role can insert)
CREATE POLICY "prevent_anon_insert_answers" ON answers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

-- Explicitly prevent UPDATE via anon key
CREATE POLICY "prevent_anon_update_answers" ON answers
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Explicitly prevent DELETE via anon key
CREATE POLICY "prevent_anon_delete_answers" ON answers
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- ============================================================================
-- ROOM_PARTICIPANTS TABLE: Anonymous users can SELECT, but NOT UPDATE live_score
-- ============================================================================

-- Allow anonymous users to SELECT room_participants (for leaderboard)
CREATE POLICY "anon_select_room_participants" ON room_participants
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

-- Explicitly prevent INSERT via anon key for room_participants
-- (students join via server API route, not direct insert)
CREATE POLICY "prevent_anon_insert_room_participants" ON room_participants
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

-- Explicitly prevent UPDATE via anon key (only service role can update scores)
-- This is the CRITICAL policy: prevents dev-tools score manipulation
CREATE POLICY "prevent_anon_update_room_participants" ON room_participants
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Explicitly prevent DELETE via anon key
CREATE POLICY "prevent_anon_delete_room_participants" ON room_participants
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- ============================================================================
-- ALLOW ANONYMOUS READ-ONLY ACCESS TO OTHER TABLES
-- ============================================================================

-- Allow public read access to sections (needed to display round options)
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_sections" ON sections
  FOR SELECT
  USING (true); -- Public read

-- Allow anonymous read access to questions (client needs to display them)
-- NOTE: correct_answer column is excluded in client queries at query level
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_questions" ON questions
  FOR SELECT
  USING (true); -- Public read

-- Allow anonymous read access to room_questions (for grid display)
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_room_questions" ON room_questions
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

-- Explicitly prevent UPDATE via anon key (only server can claim cells)
CREATE POLICY "prevent_anon_update_room_questions" ON room_questions
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Explicitly prevent INSERT/DELETE via anon key
CREATE POLICY "prevent_anon_insert_room_questions" ON room_questions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "prevent_anon_delete_room_questions" ON room_questions
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- Allow anonymous read access to rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_rooms" ON rooms
  FOR SELECT
  USING (true); -- Public read

-- Allow anonymous read access to certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_certificates" ON certificates
  FOR SELECT
  USING (true); -- Public read

-- Admin credentials: No public access
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_admin_credentials" ON admin_credentials
  FOR SELECT
  USING (false); -- No one can read (service role bypasses this anyway)

-- ============================================================================
-- SERVICE ROLE KEY EXCEPTIONS (For Admin API Routes)
-- ============================================================================

-- Service role key bypasses all RLS policies, so it can:
-- 1. INSERT into answers and room_participants via API routes
-- 2. UPDATE room_participants.live_score via API routes
-- 3. READ admin_credentials for password verification
-- 4. Manage all other admin operations

-- No explicit policies needed for service role — it bypasses RLS by design.

-- ============================================================================
-- VERIFICATION QUERIES (Run after applying policies)
-- ============================================================================

-- Verify that anon key CANNOT insert into answers:
-- SELECT count(*) FROM answers WHERE id = 'test-will-fail'::uuid;
-- INSERT INTO answers (room_participant_id, question_id, response, is_correct, points_awarded)
-- VALUES ('test'::uuid, 'test'::uuid, 'A', true, 1);
-- ^ Should return: "new row violates row-level security policy"

-- Verify that anon key CANNOT update room_participants:
-- UPDATE room_participants SET live_score = 9999 WHERE id = 'test'::uuid;
-- ^ Should return: "new row violates row-level security policy"

-- Verify that anon key CAN SELECT from room_participants:
-- SELECT id, student_name, live_score FROM room_participants LIMIT 1;
-- ^ Should return rows

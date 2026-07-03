-- ============================================================================
-- ADD ROW-LEVEL SECURITY (RLS) POLICIES
-- Run this if tables already exist and you just need to add RLS
-- ============================================================================

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES - SCORE INTEGRITY ENFORCEMENT
-- ============================================================================
-- These policies prevent the client-side anon key from directly manipulating scores
-- All score writes must go through server-side API routes using the service role key

-- Enable RLS on score-affecting tables
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ANSWERS TABLE POLICIES
-- ============================================================================
-- Anon key can ONLY SELECT (read leaderboard/history)
-- Cannot INSERT, UPDATE, or DELETE (only service role can)

DROP POLICY IF EXISTS "anon_select_answers" ON answers;
CREATE POLICY "anon_select_answers" ON answers
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_insert_answers" ON answers;
CREATE POLICY "prevent_anon_insert_answers" ON answers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_update_answers" ON answers;
CREATE POLICY "prevent_anon_update_answers" ON answers
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_delete_answers" ON answers;
CREATE POLICY "prevent_anon_delete_answers" ON answers
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- ============================================================================
-- ROOM_PARTICIPANTS TABLE POLICIES
-- ============================================================================
-- Anon key can SELECT (for leaderboard)
-- Cannot UPDATE scores (only service role can)
-- Cannot INSERT or DELETE directly (only service role can)

DROP POLICY IF EXISTS "anon_select_room_participants" ON room_participants;
CREATE POLICY "anon_select_room_participants" ON room_participants
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_insert_room_participants" ON room_participants;
CREATE POLICY "prevent_anon_insert_room_participants" ON room_participants
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

-- CRITICAL: Prevent anon key from updating live_score
DROP POLICY IF EXISTS "prevent_anon_update_room_participants" ON room_participants;
CREATE POLICY "prevent_anon_update_room_participants" ON room_participants
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_delete_room_participants" ON room_participants;
CREATE POLICY "prevent_anon_delete_room_participants" ON room_participants
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- ============================================================================
-- ROOM_QUESTIONS TABLE POLICIES
-- ============================================================================
-- Anon key can SELECT (read grid state and questions for display)
-- Cannot UPDATE (only server can claim cells)
-- Cannot INSERT or DELETE (only server can)

ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_room_questions" ON room_questions;
CREATE POLICY "anon_select_room_questions" ON room_questions
  FOR SELECT
  USING (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_update_room_questions" ON room_questions;
CREATE POLICY "prevent_anon_update_room_questions" ON room_questions
  FOR UPDATE
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_insert_room_questions" ON room_questions;
CREATE POLICY "prevent_anon_insert_room_questions" ON room_questions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "prevent_anon_delete_room_questions" ON room_questions;
CREATE POLICY "prevent_anon_delete_room_questions" ON room_questions
  FOR DELETE
  USING (auth.role() = 'service_role'::text);

-- ============================================================================
-- PUBLIC READ-ONLY ACCESS TABLES
-- ============================================================================

-- Sections: Public read access
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_sections" ON sections;
CREATE POLICY "public_select_sections" ON sections
  FOR SELECT
  USING (true);

-- Questions: Public read access (correct_answer excluded in client queries)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_questions" ON questions;
CREATE POLICY "public_select_questions" ON questions
  FOR SELECT
  USING (true);

-- Rooms: Public read access
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_rooms" ON rooms;
CREATE POLICY "public_select_rooms" ON rooms
  FOR SELECT
  USING (true);

-- Certificates: Public read access
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_certificates" ON certificates;
CREATE POLICY "public_select_certificates" ON certificates
  FOR SELECT
  USING (true);

-- Admin credentials: No public access
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_admin_credentials" ON admin_credentials;
CREATE POLICY "no_public_admin_credentials" ON admin_credentials
  FOR SELECT
  USING (false);

-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================
-- All policies use CREATE POLICY IF NOT EXISTS to avoid conflicts
-- Safe to run multiple times
-- ============================================================================

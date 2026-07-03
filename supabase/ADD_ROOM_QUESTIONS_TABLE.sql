-- ============================================================================
-- ADD room_questions TABLE (if it doesn't already exist)
-- Run this if your existing schema doesn't have room_questions yet
-- ============================================================================

-- Room questions table
-- Stores the fixed question set for each room (determined at creation time)
-- For Grid: 25 questions mapped to cells (cell_index 0-24)
-- For Tiered/Sprint: 20 questions (cell_index NULL, sequential order by position)
CREATE TABLE IF NOT EXISTS room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  cell_index INT, -- 0-24 for Grid (5x5), NULL for Tiered/Sprint
  position INT, -- For Tiered/Sprint: question order (1-20), NULL for Grid
  claimed_by_participant_id UUID REFERENCES room_participants(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for room_questions
CREATE INDEX IF NOT EXISTS idx_room_questions_room ON room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_questions_cell ON room_questions(room_id, cell_index);
CREATE INDEX IF NOT EXISTS idx_room_questions_claimed ON room_questions(claimed_by_participant_id);

-- ============================================================================
-- room_questions TABLE ADDED
-- Next: Run ADD_RLS_POLICIES.sql to add security policies
-- ============================================================================

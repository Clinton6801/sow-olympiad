-- Phase 2: Create Supabase Tables

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  grade_range TEXT,
  tier_color TEXT NOT NULL, -- e.g., "sage", "coral", "sky"
  icon_name TEXT,
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL, -- 'grid', 'tiered', 'sprint'
  difficulty_tier TEXT, -- 'easy', 'medium', 'hard' (optional, null for sprint)
  content TEXT NOT NULL,
  answer_type TEXT NOT NULL, -- 'mcq' or 'numeric'
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL, -- 'grid', 'tiered', 'sprint'
  status TEXT DEFAULT 'waiting', -- 'waiting', 'active', 'completed'
  time_limit_seconds INT, -- for sprint mode
  created_by_admin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  live_score INT DEFAULT 0,
  final_score INT,
  answers_submitted INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_participant_id UUID NOT NULL REFERENCES room_participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  is_correct BOOLEAN,
  points_awarded INT DEFAULT 0,
  time_taken_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name TEXT NOT NULL,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'practice' or 'competition'
  round_type TEXT, -- 'grid', 'tiered', 'sprint'
  score INT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_participant_id UUID REFERENCES room_participants(id) ON DELETE SET NULL
);

-- Admin credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_section_round_type ON questions(section_id, round_type);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_questions_room ON room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_questions_cell ON room_questions(room_id, cell_index);
CREATE INDEX IF NOT EXISTS idx_room_questions_claimed ON room_questions(claimed_by_participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant ON answers(room_participant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_section ON certificates(section_id);

-- ============================================================================
-- ENABLE ROW-LEVEL SECURITY (RLS)
-- ============================================================================
-- CRITICAL: RLS must be enabled from the start to enforce security model
-- Score-affecting tables (answers, room_participants) are write-protected
-- via RLS policies (see ADD_RLS_POLICIES.sql)

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;

-- Read-only tables can have public access policies
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

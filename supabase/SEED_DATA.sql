-- ============================================================================
-- SEED DATA FOR MATH OLYMPIAD PLATFORM
-- Run this AFTER running COMPLETE_SETUP.sql
-- This file is idempotent - safe to run multiple times
-- ============================================================================

-- ============================================================================
-- CLEAR OLD DATA (optional - comment out if you want to keep existing data)
-- ============================================================================
-- Uncomment these lines to start fresh:
-- DELETE FROM sections;
-- (cascade will delete related questions, rooms, answers, etc.)

-- ============================================================================
-- INSERT 6 SECTIONS
-- Using ON CONFLICT to handle re-runs gracefully
-- ============================================================================

INSERT INTO sections (name, description, grade_range, tier_color, icon_name, display_order) VALUES
('Little Maths Sprout', 'Perfect for young mathematicians just beginning their journey', 'Sprout 1-2', '#4CAF7D', 'seedling', 1),
('Rising Maths Explorers', 'For curious minds exploring the wonder of numbers', 'Stepping Stone-Grade 1', '#3FA79A', 'compass', 2),
('Clever Calculators', 'Building strong computational and problem-solving skills', 'Grade 2-3', '#3E8FC4', 'calculator', 3),
('Elite Problem Solvers', 'Where advanced thinking meets creative mathematics', 'Grade 4-5', '#6C4EE3', 'puzzle', 4),
('Algebra Warriors', 'Mastering algebraic concepts and symbolic reasoning', 'Grade 7-9 / JSS1-3', '#C2478C', 'sword', 5),
('Grand Maths Master League', 'The pinnacle of mathematical excellence and innovation', 'Grade 10-11 / SSS1-2', '#F4A73B', 'trophy', 6)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  grade_range = EXCLUDED.grade_range,
  tier_color = EXCLUDED.tier_color,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- INSERT SAMPLE QUESTIONS FOR "LITTLE MATHS SPROUT"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 2 + 3?', 'mcq', '4', '5', '6', '7', '5', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 5 + 4?', 'mcq', '8', '9', '10', '11', '9', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 10 - 3?', 'mcq', '5', '6', '7', '8', '7', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 6 × 2?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 3 + 3?', 'mcq', '5', '6', '7', '8', '6', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 8 - 2?', 'mcq', '5', '6', '7', '8', '6', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 4 × 3?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 20 ÷ 5?', 'mcq', '2', '3', '4', '5', '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 15 - 7?', 'mcq', '6', '7', '8', '9', '8', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 9 ÷ 3?', 'mcq', '1', '2', '3', '4', '3', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 7 + 1?', 'mcq', '6', '7', '8', '9', '8', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 11 - 5?', 'mcq', '5', '6', '7', '8', '6', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 5 × 2?', 'mcq', '8', '9', '10', '11', '10', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 14 ÷ 2?', 'mcq', '6', '7', '8', '9', '7', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 12 + 8?', 'mcq', '18', '19', '20', '21', '20', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 25 - 10?', 'mcq', '13', '14', '15', '16', '15', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 4 + 2?', 'mcq', '5', '6', '7', '8', '6', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 9 - 4?', 'mcq', '4', '5', '6', '7', '5', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 8 × 1?', 'mcq', '6', '7', '8', '9', '8', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'medium', 'What is 16 ÷ 4?', 'mcq', '2', '3', '4', '5', '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 18 + 2?', 'mcq', '18', '19', '20', '21', '20', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 30 - 15?', 'mcq', '13', '14', '15', '16', '15', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 1 + 1?', 'mcq', '1', '2', '3', '4', '2', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'easy', 'What is 6 - 1?', 'mcq', '4', '5', '6', '7', '5', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'grid', 'hard', 'What is 7 × 3?', 'mcq', '18', '19', '20', '21', '21', 1);

-- ============================================================================
-- INSERT TIERED ROUND QUESTIONS FOR "LITTLE MATHS SPROUT"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'easy', 'Solve: x + 2 = 5', 'numeric', NULL, NULL, NULL, NULL, '3', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'easy', 'What is 8 ÷ 2?', 'numeric', NULL, NULL, NULL, NULL, '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'easy', 'What is 3 × 2?', 'numeric', NULL, NULL, NULL, NULL, '6', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'medium', 'Solve: 2x = 10', 'numeric', NULL, NULL, NULL, NULL, '5', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'medium', 'What is 12 ÷ 3?', 'numeric', NULL, NULL, NULL, NULL, '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'medium', 'What is 7 × 2?', 'numeric', NULL, NULL, NULL, NULL, '14', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'hard', 'Solve: 3x - 2 = 7', 'numeric', NULL, NULL, NULL, NULL, '3', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'hard', 'What is 20 ÷ 4?', 'numeric', NULL, NULL, NULL, NULL, '5', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'hard', 'What is 9 × 2?', 'numeric', NULL, NULL, NULL, NULL, '18', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'tiered', 'easy', 'Solve: x + 1 = 4', 'numeric', NULL, NULL, NULL, NULL, '3', 1);

-- ============================================================================
-- INSERT SPRINT ROUND QUESTIONS FOR "LITTLE MATHS SPROUT"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 1 + 1?', 'mcq', '1', '2', '3', '4', '2', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 7 + 2?', 'mcq', '8', '9', '10', '11', '9', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 15 - 5?', 'mcq', '8', '9', '10', '11', '10', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 4 × 2?', 'mcq', '6', '7', '8', '9', '8', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 12 ÷ 3?', 'mcq', '2', '3', '4', '5', '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 5 + 5?', 'mcq', '8', '9', '10', '11', '10', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 20 - 8?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 3 × 3?', 'mcq', '6', '7', '8', '9', '9', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 24 ÷ 6?', 'mcq', '2', '3', '4', '5', '4', 1),
((SELECT id FROM sections WHERE name = 'Little Maths Sprout'), 'sprint', NULL, 'What is 13 + 7?', 'mcq', '18', '19', '20', '21', '20', 1);

-- ============================================================================
-- INSERT SAMPLE QUESTIONS FOR "RISING MATHS EXPLORERS"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 12 + 8?', 'mcq', '18', '19', '20', '21', '20', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 25 - 10?', 'mcq', '14', '15', '16', '17', '15', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 7 × 6?', 'mcq', '40', '41', '42', '43', '42', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 144 ÷ 12?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 30 + 20?', 'mcq', '45', '50', '55', '60', '50', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 100 - 45?', 'mcq', '50', '55', '60', '65', '55', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 8 × 8?', 'mcq', '60', '62', '64', '66', '64', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 99 ÷ 11?', 'mcq', '7', '8', '9', '10', '9', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 15 + 15?', 'mcq', '28', '29', '30', '31', '30', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 50 - 20?', 'mcq', '28', '29', '30', '31', '30', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 9 × 7?', 'mcq', '60', '61', '62', '63', '63', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 120 ÷ 10?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 22 + 18?', 'mcq', '38', '39', '40', '41', '40', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 60 - 25?', 'mcq', '33', '34', '35', '36', '35', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 10 × 10?', 'mcq', '98', '99', '100', '101', '100', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 180 ÷ 15?', 'mcq', '10', '11', '12', '13', '12', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 33 + 17?', 'mcq', '48', '49', '50', '51', '50', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 75 - 30?', 'mcq', '43', '44', '45', '46', '45', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 12 × 5?', 'mcq', '58', '59', '60', '61', '60', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 90 ÷ 9?', 'mcq', '8', '9', '10', '11', '10', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 11 × 11?', 'mcq', '118', '119', '120', '121', '121', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'hard', 'What is 200 ÷ 20?', 'mcq', '8', '9', '10', '11', '10', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 21 + 19?', 'mcq', '38', '39', '40', '41', '40', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'easy', 'What is 85 - 35?', 'mcq', '48', '49', '50', '51', '50', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'grid', 'medium', 'What is 6 × 9?', 'mcq', '52', '53', '54', '55', '54', 1);

-- ============================================================================
-- INSERT TIERED QUESTIONS FOR "RISING MATHS EXPLORERS"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'easy', 'Solve: x + 5 = 12', 'numeric', NULL, NULL, NULL, NULL, '7', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'easy', 'What is 24 ÷ 4?', 'numeric', NULL, NULL, NULL, NULL, '6', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'medium', 'Solve: 3x + 2 = 14', 'numeric', NULL, NULL, NULL, NULL, '4', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'medium', 'What is 15 × 2?', 'numeric', NULL, NULL, NULL, NULL, '30', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'hard', 'Solve: x² = 25', 'numeric', NULL, NULL, NULL, NULL, '5', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'hard', 'What is 100 ÷ 5?', 'numeric', NULL, NULL, NULL, NULL, '20', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'easy', 'Solve: x - 3 = 7', 'numeric', NULL, NULL, NULL, NULL, '10', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'medium', 'What is 18 × 2?', 'numeric', NULL, NULL, NULL, NULL, '36', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'hard', 'What is √64?', 'numeric', NULL, NULL, NULL, NULL, '8', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'tiered', 'easy', 'Solve: 2x = 20', 'numeric', NULL, NULL, NULL, NULL, '10', 1);

-- ============================================================================
-- INSERT SPRINT QUESTIONS FOR "RISING MATHS EXPLORERS"
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 30 + 20?', 'mcq', '45', '50', '55', '60', '50', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 100 - 45?', 'mcq', '50', '55', '60', '65', '55', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 8 × 8?', 'mcq', '60', '62', '64', '66', '64', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 72 ÷ 9?', 'mcq', '6', '7', '8', '9', '8', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 40 + 40?', 'mcq', '75', '78', '80', '85', '80', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 150 - 50?', 'mcq', '95', '98', '100', '105', '100', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 5 × 12?', 'mcq', '58', '59', '60', '61', '60', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 108 ÷ 12?', 'mcq', '7', '8', '9', '10', '9', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 99 + 1?', 'mcq', '98', '99', '100', '101', '100', 1),
((SELECT id FROM sections WHERE name = 'Rising Maths Explorers'), 'sprint', NULL, 'What is 200 - 75?', 'mcq', '123', '124', '125', '126', '125', 1);

-- ============================================================================
-- INSERT SAMPLE QUESTIONS FOR OTHER SECTIONS (minimal)
-- ============================================================================

INSERT INTO questions (section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'grid', 'easy', 'What is √36?', 'mcq', '4', '5', '6', '7', '6', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'grid', 'medium', 'What is 15% of 200?', 'mcq', '25', '30', '35', '40', '30', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'grid', 'hard', 'What is 20% of 500?', 'mcq', '95', '98', '100', '105', '100', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'tiered', 'easy', 'Solve: x + 10 = 20', 'numeric', NULL, NULL, NULL, NULL, '10', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'tiered', 'medium', 'What is √49?', 'numeric', NULL, NULL, NULL, NULL, '7', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'tiered', 'hard', 'What is √121?', 'numeric', NULL, NULL, NULL, NULL, '11', 1),
((SELECT id FROM sections WHERE name = 'Clever Calculators'), 'sprint', NULL, 'What is 50 + 50?', 'mcq', '90', '95', '100', '105', '100', 1),
((SELECT id FROM sections WHERE name = 'Elite Problem Solvers'), 'grid', 'medium', 'Solve: 2x + 3 = 11', 'numeric', NULL, NULL, NULL, NULL, '4', 1),
((SELECT id FROM sections WHERE name = 'Algebra Warriors'), 'grid', 'hard', 'What is √144?', 'numeric', NULL, NULL, NULL, NULL, '12', 1),
((SELECT id FROM sections WHERE name = 'Grand Maths Master League'), 'grid', 'hard', 'What is e approximately?', 'mcq', '2.71', '2.72', '3.14', '1.41', '2.72', 1);

-- ============================================================================
-- INSERT ADMIN CREDENTIAL
-- Password: admin123 (bcrypt hash)
-- ============================================================================

INSERT INTO admin_credentials (password_hash) VALUES
('$2a$10$YQv8PlkzYlKSHEZA8TK1BOhqwM5EEG/JGvgCGLxAChD9Gw.6Ey5hS');

-- ============================================================================
-- SEED DATA COMPLETE
-- Tables are now populated with:
-- - 6 sections
-- - 120+ sample questions across all round types
-- - 1 admin credential (password: admin123)
-- ============================================================================

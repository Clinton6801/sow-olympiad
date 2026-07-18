-- Phase 2.2: Seed Sample Data

-- CLEANUP: Delete all existing sections and dependent data (pre-launch test data)
DELETE FROM certificates;
DELETE FROM answers;
DELETE FROM room_questions;
DELETE FROM room_participants;
DELETE FROM rooms;
DELETE FROM questions;
DELETE FROM sections;

-- Insert 14 new class-level sections (grades/classes Sprout 2 through SS3)
-- display_order: 0-13 (visual row position from top-left)
-- name: competition category
-- grade_range: class name
-- tier_color: hex color code
-- icon_name: Tabler icon identifier (lowercase, matches iconMap)
INSERT INTO sections (display_order, name, grade_range, tier_color, icon_name) VALUES
(0, 'Number Sprouts', 'Sprout 2', '#3FD68A', 'seedling'),
(1, 'Counting Champions', 'Sprout 3', '#3FD6B9', 'medal'),
(2, 'Math Explorers', 'Stepping Stone', '#3FC3D6', 'telescope'),
(3, 'Number Navigators', 'Grade 1', '#3F94D6', 'compass'),
(4, 'Equation Builders', 'Grade 2', '#3F65D6', 'stack-2'),
(5, 'Logic Leaders', 'Grade 3', '#4A3FD6', 'bulb'),
(6, 'Problem Solvers', 'Grade 4', '#793FD6', 'puzzle'),
(7, 'Math Mavericks', 'Grade 5', '#A83FD6', 'star'),
(8, 'Junior Analysts', 'JSS 1', '#D63FD4', 'chart-bar'),
(9, 'Algebra Masters', 'JSS 2', '#D63FA5', 'sum'),
(10, 'Olympiad Challengers', 'JSS 3', '#D63F75', 'trophy'),
(11, 'Elite Mathematicians', 'SS1', '#D63F46', 'school'),
(12, 'Math Titans', 'SS2', '#D6683F', 'crown'),
(13, 'Grand Olympians', 'SS3', '#D6973F', 'award');

-- Insert admin credentials (password: admin123)
-- Note: In production, use bcryptjs to generate this hash
INSERT INTO admin_credentials (password_hash) VALUES
('$2a$10$YQv8PlkzYlKSHEZA8TK1BOhqwM5EEG/JGvgCGLxAChD9Gw.6Ey5hS'); -- This is a placeholder bcrypt hash

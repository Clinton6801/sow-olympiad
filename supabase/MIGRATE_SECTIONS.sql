-- ============================================================================
-- MIGRATE SECTIONS - Replace old sections with new ones
-- Run this if you already have old sections in the database
-- ============================================================================

-- Step 1: Delete old sections (cascades to related data)
DELETE FROM sections;

-- Step 2: Reset the sequence (if using serial IDs - not needed for UUIDs)
-- PostgreSQL UUID primary keys don't need sequence reset

-- Step 3: Insert new sections
INSERT INTO sections (name, description, grade_range, tier_color, icon_name, display_order) VALUES
('Little Maths Sprout', 'Perfect for young mathematicians just beginning their journey', 'Sprout 1-2', '#4CAF7D', 'seedling', 1),
('Rising Maths Explorers', 'For curious minds exploring the wonder of numbers', 'Stepping Stone-Grade 1', '#3FA79A', 'compass', 2),
('Clever Calculators', 'Building strong computational and problem-solving skills', 'Grade 2-3', '#3E8FC4', 'calculator', 3),
('Elite Problem Solvers', 'Where advanced thinking meets creative mathematics', 'Grade 4-5', '#6C4EE3', 'puzzle', 4),
('Algebra Warriors', 'Mastering algebraic concepts and symbolic reasoning', 'Grade 7-9 / JSS1-3', '#C2478C', 'sword', 5),
('Grand Maths Master League', 'The pinnacle of mathematical excellence and innovation', 'Grade 10-11 / SSS1-2', '#F4A73B', 'trophy', 6);

-- Step 4: Verify new sections
SELECT count(*) as section_count FROM sections;
SELECT name, grade_range, tier_color, icon_name FROM sections ORDER BY display_order;

-- ============================================================================
-- MIGRATION COMPLETE
-- All old sections deleted, new sections inserted
-- Questions table will need to be repopulated after this
-- ============================================================================

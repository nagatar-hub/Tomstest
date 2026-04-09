-- quiz_session の franchise 制約を緩和（'all' 対応）
ALTER TABLE quiz_session DROP CONSTRAINT IF EXISTS quiz_session_franchise_check;
ALTER TABLE quiz_session ADD CONSTRAINT quiz_session_franchise_check
  CHECK (franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!', 'all'));

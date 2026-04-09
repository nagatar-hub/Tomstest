-- スコア +1 のアトミック更新
CREATE OR REPLACE FUNCTION increment_quiz_score(sid UUID)
RETURNS void AS $$
  UPDATE quiz_session
  SET score = score + 1
  WHERE id = sid;
$$ LANGUAGE sql;

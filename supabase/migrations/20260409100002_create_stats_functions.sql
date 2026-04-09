-- 間違えやすい問題ランキング
CREATE OR REPLACE FUNCTION get_hard_cards(lim INTEGER DEFAULT 20)
RETURNS TABLE (
  quiz_card_id UUID,
  card_name TEXT,
  franchise TEXT,
  price INTEGER,
  total_attempts BIGINT,
  incorrect_count BIGINT,
  error_rate NUMERIC
) AS $$
  SELECT
    a.quiz_card_id,
    c.card_name,
    c.franchise,
    c.price,
    COUNT(*) AS total_attempts,
    COUNT(*) FILTER (WHERE NOT a.is_correct) AS incorrect_count,
    ROUND(
      COUNT(*) FILTER (WHERE NOT a.is_correct)::NUMERIC / GREATEST(COUNT(*), 1) * 100,
      1
    ) AS error_rate
  FROM quiz_answer a
  JOIN quiz_card c ON c.id = a.quiz_card_id
  GROUP BY a.quiz_card_id, c.card_name, c.franchise, c.price
  HAVING COUNT(*) >= 3
  ORDER BY error_rate DESC, total_attempts DESC
  LIMIT lim;
$$ LANGUAGE sql;

-- 全体正答率
CREATE OR REPLACE FUNCTION get_overall_accuracy()
RETURNS TABLE (
  total_answers BIGINT,
  correct_answers BIGINT,
  accuracy NUMERIC
) AS $$
  SELECT
    COUNT(*) AS total_answers,
    COUNT(*) FILTER (WHERE is_correct) AS correct_answers,
    ROUND(
      COUNT(*) FILTER (WHERE is_correct)::NUMERIC / GREATEST(COUNT(*), 1) * 100,
      1
    ) AS accuracy
  FROM quiz_answer;
$$ LANGUAGE sql;

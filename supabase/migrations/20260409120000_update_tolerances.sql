-- 旧データ削除
DELETE FROM tolerance;

-- 新しい価格帯（4区分）
-- ノーマル
INSERT INTO tolerance (difficulty, price_min, price_max, tolerance_amount) VALUES
  ('normal', 0, 9999, 200),
  ('normal', 10000, 99999, 1000),
  ('normal', 100000, 999999, 5000),
  ('normal', 1000000, 99999999, 20000);

-- むずかしい
INSERT INTO tolerance (difficulty, price_min, price_max, tolerance_amount) VALUES
  ('hard', 0, 9999, 100),
  ('hard', 10000, 99999, 500),
  ('hard', 100000, 999999, 2000),
  ('hard', 1000000, 99999999, 10000);

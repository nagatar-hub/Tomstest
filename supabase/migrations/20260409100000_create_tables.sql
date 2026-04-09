-- ============================================================
-- Tomstest: 相場テストアプリ テーブル定義
-- Harakaと同じSupabaseプロジェクトに作成
-- ============================================================

-- 問題プール（KECAKシートから同期）
CREATE TABLE IF NOT EXISTS quiz_card (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise   TEXT NOT NULL CHECK (franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!')),
  card_name   TEXT NOT NULL,
  grade       TEXT,
  list_no     TEXT,
  rarity      TEXT,
  image_url   TEXT,
  price       INTEGER NOT NULL CHECK (price > 0),
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 同じカード+グレードの重複を防止
  UNIQUE (franchise, card_name, grade)
);

-- ユーザー（スタッフ + 管理者）
CREATE TABLE IF NOT EXISTS quiz_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 受験セッション
CREATE TABLE IF NOT EXISTS quiz_session (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES quiz_user(id),
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  franchise       TEXT NOT NULL CHECK (franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  score           INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

-- 各回答
CREATE TABLE IF NOT EXISTS quiz_answer (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES quiz_session(id) ON DELETE CASCADE,
  quiz_card_id   UUID NOT NULL REFERENCES quiz_card(id),
  correct_price  INTEGER NOT NULL,
  answered_value INTEGER,
  is_correct     BOOLEAN NOT NULL DEFAULT false
);

-- 許容範囲設定（管理画面から変更可能）
CREATE TABLE IF NOT EXISTS tolerance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  price_min        INTEGER NOT NULL DEFAULT 0,
  price_max        INTEGER NOT NULL,
  tolerance_amount INTEGER NOT NULL,

  -- 難易度×価格帯のユニーク
  UNIQUE (difficulty, price_min, price_max)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_quiz_card_franchise ON quiz_card(franchise);
CREATE INDEX IF NOT EXISTS idx_quiz_card_price ON quiz_card(price);
CREATE INDEX IF NOT EXISTS idx_quiz_session_user ON quiz_session(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_session ON quiz_answer(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_card ON quiz_answer(quiz_card_id);

-- デフォルト許容範囲（ノーマル）
INSERT INTO tolerance (difficulty, price_min, price_max, tolerance_amount) VALUES
  ('normal', 0, 1000, 200),
  ('normal', 1001, 5000, 500),
  ('normal', 5001, 10000, 1000),
  ('normal', 10001, 999999, 2000)
ON CONFLICT DO NOTHING;

-- デフォルト許容範囲（むずかしい）
INSERT INTO tolerance (difficulty, price_min, price_max, tolerance_amount) VALUES
  ('hard', 0, 1000, 100),
  ('hard', 1001, 5000, 200),
  ('hard', 5001, 10000, 500),
  ('hard', 10001, 999999, 1000)
ON CONFLICT DO NOTHING;

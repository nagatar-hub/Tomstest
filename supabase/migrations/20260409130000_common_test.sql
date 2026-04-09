-- ============================================================
-- 共通テスト機能
-- ============================================================

-- 共通テスト定義
CREATE TABLE IF NOT EXISTS common_test (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  franchise    TEXT CHECK (franchise IS NULL OR franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID NOT NULL REFERENCES quiz_user(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 共通テストの問題
-- quiz_card_id がある場合は価格あてクイズ
-- 将来: custom_* フィールドでカスタム問題にも対応
CREATE TABLE IF NOT EXISTS common_test_question (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_test_id       UUID NOT NULL REFERENCES common_test(id) ON DELETE CASCADE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  question_type        TEXT NOT NULL DEFAULT 'choice' CHECK (question_type IN ('choice', 'numeric')),

  -- 価格あてクイズ用
  quiz_card_id         UUID REFERENCES quiz_card(id),

  -- カスタム問題用（将来拡張）
  custom_image_url     TEXT,
  custom_question_text TEXT,
  custom_answer        TEXT,
  custom_choices       JSONB
);

-- quiz_session に共通テスト紐付け（nullなら通常ランダムテスト）
ALTER TABLE quiz_session ADD COLUMN IF NOT EXISTS common_test_id UUID REFERENCES common_test(id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_common_test_published ON common_test(is_published);
CREATE INDEX IF NOT EXISTS idx_common_test_question_test ON common_test_question(common_test_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_session_common_test ON quiz_session(common_test_id);

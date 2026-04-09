-- ============================================================
-- 個別登録カード・問題DB・お知らせ
-- ============================================================

-- 個別登録カード（手動で画像+名前を登録した商品）
CREATE TABLE IF NOT EXISTS custom_card (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise   TEXT NOT NULL CHECK (franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!')),
  card_name   TEXT NOT NULL,
  image_url   TEXT,
  price       INTEGER,
  created_by  UUID NOT NULL REFERENCES quiz_user(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_card_franchise ON custom_card(franchise);

-- 問題DB（再利用可能な問題バンク）
CREATE TABLE IF NOT EXISTS question_bank (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise         TEXT NOT NULL CHECK (franchise IN ('Pokemon', 'ONE PIECE', 'YU-GI-OH!')),

  -- 対象（どちらか一方）
  quiz_card_id      UUID REFERENCES quiz_card(id),
  custom_card_id    UUID REFERENCES custom_card(id),

  -- 問題設定
  question_type     TEXT NOT NULL DEFAULT 'choice' CHECK (question_type IN ('choice', 'numeric', 'text')),
  question_text     TEXT,
  custom_answer     TEXT,
  custom_choices    JSONB,

  -- メタ
  created_by        UUID NOT NULL REFERENCES quiz_user(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ  -- 論理削除用（nullなら有効）
);

CREATE INDEX IF NOT EXISTS idx_question_bank_franchise ON question_bank(franchise);
CREATE INDEX IF NOT EXISTS idx_question_bank_active ON question_bank(franchise) WHERE deleted_at IS NULL;

-- common_test_question に問題DB参照を追加
ALTER TABLE common_test_question ADD COLUMN IF NOT EXISTS question_bank_id UUID REFERENCES question_bank(id);
-- 個別登録カード参照も追加
ALTER TABLE common_test_question ADD COLUMN IF NOT EXISTS custom_card_id UUID REFERENCES custom_card(id);

-- お知らせ
CREATE TABLE IF NOT EXISTS announcement (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID NOT NULL REFERENCES quiz_user(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcement_created ON announcement(created_at DESC);

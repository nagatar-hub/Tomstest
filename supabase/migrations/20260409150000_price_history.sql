-- 価格履歴（sync時に変動があれば記録）
CREATE TABLE IF NOT EXISTS quiz_card_price_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_card_id UUID NOT NULL REFERENCES quiz_card(id) ON DELETE CASCADE,
  price        INTEGER NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_card ON quiz_card_price_history(quiz_card_id, recorded_at);

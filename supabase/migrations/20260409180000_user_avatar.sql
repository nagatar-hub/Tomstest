-- ユーザーにプロフィール画像URLを追加
ALTER TABLE quiz_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;

# Tomstest 仕様書 v1.0

> 最終更新: 2026-04-09
> ステータス: 初版リリース

---

## 1. プロジェクト概要

### 1.1 目的
トレーディングカード買取事業のスタッフが、商品の買取相場を正確に記憶しているかをテストするWebアプリケーション。

### 1.2 対象ユーザー
| ロール | 対象 | 用途 |
|--------|------|------|
| **スタッフ** | 買取店舗のスタッフ（10名以上想定） | テスト受験、成績確認、復習 |
| **管理者** | 店舗責任者・教育担当 | テスト作成、統計分析、スタッフ管理 |

### 1.3 対象商材（フランチャイズ）
| 内部名 | 日本語名 | KECAKシート名 |
|--------|---------|--------------|
| `Pokemon` | ポケモン | ポケモン |
| `ONE PIECE` | ワンピース | ワンピース |
| `YU-GI-OH!` | 遊戯王 | 遊戯王 |

---

## 2. 技術スタック

### 2.1 フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js (App Router) | 16.2.3 | フレームワーク |
| React | 19.2.4 | UIライブラリ |
| TypeScript | ^5 | 型安全 |
| Tailwind CSS | v4 | スタイリング |
| shadcn/ui | 4.2.0 | UIコンポーネント |
| Recharts | 3.8.1 | グラフ描画 |
| Lucide React | 1.8.0 | アイコン |

### 2.2 バックエンド・インフラ
| 技術 | 用途 |
|------|------|
| Vercel | ホスティング・Functions・Cron |
| Supabase (PostgreSQL) | データベース・Storage |
| Google Sheets API | KECAKシートからのデータ取得 |
| Google OAuth 2.0 | Sheets APIアクセス認証 |

### 2.3 リージョン
| サービス | リージョン |
|---------|-----------|
| Vercel Functions | `hnd1`（東京） |
| Supabase | Northeast Asia (Tokyo) |

### 2.4 認証方式
- SHA-256ハッシュによる簡易パスワード認証
- セッション管理: ブラウザ `sessionStorage`
- 外部認証ライブラリ不使用

---

## 3. データソース

### 3.1 KECAKスプレッドシート
| 項目 | 値 |
|------|-----|
| スプレッドシートID | `1XZypJOZZppxZMckPuRoJDaXWxLhOdwQQhv8ujE4DBFo` |
| 所有者 | パートナー企業（oripark.raox.akb@gmail.com） |
| シート数 | 3（ポケモン / ワンピース / 遊戯王） |

### 3.2 カラムマッピング

#### Pokemon / ONE PIECE
| 列 | インデックス | 内容 |
|------|-------------|------|
| A | 0 | card_name |
| B | 1 | grade |
| C | 2 | list_no |
| D | 3 | image_url |
| E | 4 | demand |
| F | 5 | kecak_price（買取価格） |

#### YU-GI-OH!
| 列 | インデックス | 内容 |
|------|-------------|------|
| A | 0 | card_name |
| B | 1 | grade |
| D | 3 | list_no |
| E | 4 | rarity |
| F | 5 | image_url |
| G | 6 | demand |
| H | 7 | kecak_price（買取価格） |

### 3.3 データ同期
- **頻度**: 毎日11:30 JST（Vercel Cron: `30 2 * * * UTC`）
- **方式**: Google Sheets API → パース → quiz_card テーブルに upsert
- **重複排除**: `franchise + card_name + grade` をユニークキーとして後勝ち
- **価格履歴**: 価格変動があれば `quiz_card_price_history` に自動記録

---

## 4. データベース設計

### 4.1 テーブル一覧
| テーブル | 行数目安 | 説明 |
|---------|---------|------|
| `quiz_card` | ~836 | 問題プール（KECAKシートから同期） |
| `quiz_card_price_history` | 増加 | 価格変動履歴（sync時に記録） |
| `quiz_user` | ~10+ | ユーザー（スタッフ + 管理者） |
| `quiz_session` | 増加 | 受験セッション |
| `quiz_answer` | 増加 | 各回答レコード |
| `tolerance` | 8 | 許容範囲設定（ノーマル4 + むずかしい4） |
| `common_test` | 増加 | 共通テスト定義 |
| `common_test_question` | 増加 | 共通テストの問題リスト |
| `custom_card` | 増加 | 個別登録カード（手動登録） |
| `question_bank` | 増加 | 問題DB（再利用可能な問題バンク） |
| `announcement` | 増加 | お知らせ |

### 4.2 主要テーブル詳細

#### quiz_card（問題プール）
```sql
id          UUID PRIMARY KEY
franchise   TEXT NOT NULL ('Pokemon'|'ONE PIECE'|'YU-GI-OH!')
card_name   TEXT NOT NULL
grade       TEXT
list_no     TEXT
rarity      TEXT
image_url   TEXT
price       INTEGER NOT NULL (> 0)
synced_at   TIMESTAMPTZ
UNIQUE (franchise, card_name, grade)
```

#### quiz_user（ユーザー）
```sql
id            UUID PRIMARY KEY
name          TEXT NOT NULL UNIQUE
password_hash TEXT NOT NULL  -- SHA-256
role          TEXT NOT NULL ('staff'|'admin')
created_at    TIMESTAMPTZ
```

#### quiz_session（受験セッション）
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES quiz_user
difficulty      TEXT ('easy'|'normal'|'hard')
franchise       TEXT ('Pokemon'|'ONE PIECE'|'YU-GI-OH!'|'all')
total_questions INTEGER
score           INTEGER
started_at      TIMESTAMPTZ
finished_at     TIMESTAMPTZ
common_test_id  UUID REFERENCES common_test (NULLなら通常テスト)
```

#### quiz_answer（回答レコード）
```sql
id             UUID PRIMARY KEY
session_id     UUID REFERENCES quiz_session ON DELETE CASCADE
quiz_card_id   UUID REFERENCES quiz_card
correct_price  INTEGER
answered_value INTEGER
is_correct     BOOLEAN
```

#### tolerance（許容範囲設定）
```sql
id               UUID PRIMARY KEY
difficulty       TEXT ('easy'|'normal'|'hard')
price_min        INTEGER
price_max        INTEGER
tolerance_amount INTEGER
UNIQUE (difficulty, price_min, price_max)
```

#### common_test（共通テスト）
```sql
id           UUID PRIMARY KEY
title        TEXT NOT NULL
franchise    TEXT (NULLなら全商材混合)
is_published BOOLEAN DEFAULT false
created_by   UUID REFERENCES quiz_user
created_at   TIMESTAMPTZ
```

#### common_test_question（共通テスト問題）
```sql
id               UUID PRIMARY KEY
common_test_id   UUID REFERENCES common_test ON DELETE CASCADE
sort_order       INTEGER
question_type    TEXT ('choice'|'numeric')
quiz_card_id     UUID REFERENCES quiz_card
custom_card_id   UUID REFERENCES custom_card
question_bank_id UUID REFERENCES question_bank
custom_image_url TEXT      -- 将来拡張用
custom_question_text TEXT  -- 将来拡張用
custom_answer    TEXT      -- 将来拡張用
custom_choices   JSONB     -- 将来拡張用
```

#### custom_card（個別登録カード）
```sql
id         UUID PRIMARY KEY
franchise  TEXT NOT NULL
card_name  TEXT NOT NULL
image_url  TEXT          -- Supabase Storage (custom-cards バケット)
price      INTEGER
created_by UUID REFERENCES quiz_user
created_at TIMESTAMPTZ
```

#### question_bank（問題DB）
```sql
id               UUID PRIMARY KEY
franchise        TEXT NOT NULL
quiz_card_id     UUID REFERENCES quiz_card     -- リスト選択
custom_card_id   UUID REFERENCES custom_card   -- 個別登録カード
question_type    TEXT ('choice'|'numeric'|'text')
question_text    TEXT       -- カスタム問題文
custom_answer    TEXT       -- 記述式の正解
custom_choices   JSONB      -- カスタム4択
created_by       UUID REFERENCES quiz_user
created_at       TIMESTAMPTZ
deleted_at       TIMESTAMPTZ  -- 論理削除（NULLなら有効）
```

#### announcement（お知らせ）
```sql
id         UUID PRIMARY KEY
title      TEXT NOT NULL
body       TEXT
is_pinned  BOOLEAN DEFAULT false
created_by UUID REFERENCES quiz_user
created_at TIMESTAMPTZ
```

### 4.3 DB関数
| 関数 | 説明 |
|------|------|
| `increment_quiz_score(sid UUID)` | セッションのスコアを+1（アトミック更新） |
| `get_hard_cards(lim INT)` | 間違えやすい問題ランキング（3回以上出題、不正解率降順） |
| `get_overall_accuracy()` | 全体正答率（総回答数、正解数、正答率%） |

---

## 5. 機能仕様

### 5.1 認証・ユーザー管理

#### ログイン（/）
- 名前 + パスワードでログイン
- SHA-256ハッシュでパスワード照合
- admin → /admin、staff → /exam にリダイレクト

#### 新規登録（/register）
- 名前 + パスワード + 確認で自己登録
- roleはstaff固定
- 登録後そのまま /exam へ遷移

#### ユーザー管理（/admin/users）
- 管理者がユーザーを手動登録（role選択可能）
- スタッフ登録リンクのコピー機能

---

### 5.2 テスト機能

#### 5.2.1 難易度システム
| 難易度 | 回答形式 | 正誤判定 |
|--------|---------|---------|
| **かんたん** | 4択選択 | 選択一致 |
| **ノーマル** | 数値入力 | 正解との差が許容範囲内 |
| **むずかしい** | 数値入力 | 許容範囲がノーマルより狭い |

#### 5.2.2 許容範囲（デフォルト値、管理画面から変更可能）
| 価格帯 | ノーマル | むずかしい |
|--------|---------|-----------|
| 0〜9,999円 | ±200円 | ±100円 |
| 10,000〜99,999円 | ±1,000円 | ±500円 |
| 100,000〜999,999円 | ±5,000円 | ±2,000円 |
| 1,000,000円〜 | ±20,000円 | ±10,000円 |

#### 5.2.3 4択生成ロジック
- ノーマル難易度の許容範囲（toleranceAmount）をDB（toleranceテーブル）から取得
- ダミー選択肢 = 正解 ± (n × toleranceAmount)、n = 1〜5のランダム整数
- 許容範囲設定画面で値を変えれば4択の幅も自動で変わる

#### 5.2.4 通常テスト（/exam → /exam/play）
| モード | 出題数 | 説明 |
|--------|--------|------|
| **10問テスト** | 10問 | ランダム10問、結果表示 |
| **エンドレス** | 全問 | 全カード出題、タイマー付き、途中終了可 |

- 商材選択: ポケモン / ワンピース / 遊戯王 / **全商材混合**
- 難易度選択: かんたん / ノーマル / むずかしい

#### 5.2.5 共通テスト
管理者が作成した固定問題セットを全スタッフに配布。

**作成方法:**
| モード | 説明 |
|--------|------|
| **ランダム生成** | 出題数（10/15/20/30）と形式（4択/筆記）を指定 → あとから編集可 |
| **0から作る** | 空で作成 → カード検索して手動追加 |

**テスト編集画面:**
- 左パネル: 登録済み問題一覧（画像・カード名・価格表示）
- 右パネル: カード検索（商材フィルタ + 名前検索 → チェックで一括追加）
- 問題ごとに4択⇔筆記の切替
- 公開 / 非公開の切替

**スタッフ受験:**
- テスト開始画面に「通常テスト」「共通テスト」タブ
- 公開中の共通テストが一覧表示される

#### 5.2.6 復習モード
- 過去に間違えたカードのみで出題
- 最新sync価格準拠
- 成績履歴画面のオレンジ「復習モード」ボタンから開始

#### 5.2.7 模擬テスト（/admin/trial）
- 管理者がテスト体験できる画面
- 商材・難易度選択 → テスト → 結果表示
- データは通常テストと同じくDBに記録

---

### 5.3 成績・統計

#### 5.3.1 スタッフ向け（/exam/history）
| タブ | 内容 |
|------|------|
| テスト履歴 | 各セッションのスコア・正答率・所要時間 |
| カード別成績 | カードごとの正答率（低い順にソート）→ タップでカード詳細へ |

#### 5.3.2 管理者向け（/admin ダッシュボード）
| セクション | 内容 |
|-----------|------|
| サマリーカード | 全体正答率・総回答数・受験回数 |
| 受験履歴タブ | 全スタッフの受験一覧（名前・商材・難易度・スコア・正答率・日時） |
| 間違えやすい問題タブ | 不正解率TOP20（3回以上出題されたカードが対象） |

#### 5.3.3 カード詳細（/cards/[id]）
- カード情報（画像・名前・グレード・現在価格）
- 正答率サマリー（出題回数・正解数・正答率）
- **価格推移グラフ**（recharts折れ線グラフ、sync時の変動を記録）
- 回答履歴（ユーザー名・回答値・正誤・日時）
- **スタッフ・管理者どちらからもアクセス可能**

---

### 5.4 問題DB・カスタム問題

#### 5.4.1 個別登録カード（/admin/custom-cards）
- 画像アップロード + カード名 + 価格で手動登録
- 商材タブで管理
- 画像は Supabase Storage `custom-cards` バケットに保存
- 登録したカードは問題DB作成時に対象として選択可能

#### 5.4.2 問題DB（/admin/question-bank）
再利用可能な問題バンク。

**対象カードの指定方法:**
| 方法 | 説明 |
|------|------|
| リスト選択 | 既存quiz_card（KECAKシート由来）から検索・選択 |
| 個別登録カード | 手動登録したcustom_cardから選択 |

**問題形式:**
| 形式 | 説明 |
|------|------|
| 4択（choice） | 自動生成 or カスタム選択肢 |
| 筆記・数値（numeric） | 数値入力、許容範囲で判定 |
| 記述（text） | テキスト入力、正解テキスト一致で判定 |

**削除フロー:**
1. 削除ボタン → ダイアログ表示
2. 「スタッフの回答履歴も削除する」チェック
   - チェックなし → 論理削除（`deleted_at`をセット、履歴は残る）
   - チェックあり → 物理削除（関連する回答データも消える）
3. お知らせ投稿（任意）: タイトル + 本文を入力して同時投稿

---

### 5.5 お知らせ機能

#### 管理者（/admin/announcements）
- タイトル + 本文で投稿
- ピン留め（固定表示）設定
- 問題削除時のダイアログからも投稿可能

#### スタッフ（/exam 画面上部）
- 最新5件のお知らせをバナー表示
- ピン留めされたお知らせは黄色背景で強調

---

## 6. 画面一覧

### 6.1 パブリック（認証不要）
| パス | 画面名 | 説明 |
|------|--------|------|
| `/` | ログイン | 名前+パスワード認証 |
| `/register` | 新規登録 | スタッフ自己登録 |

### 6.2 スタッフ向け
| パス | 画面名 | 説明 |
|------|--------|------|
| `/exam` | テスト開始 | モード・商材・難易度選択 + お知らせ表示 |
| `/exam/play` | 出題画面 | 問題表示・回答入力・フィードバック・タイマー |
| `/exam/result` | 結果画面 | スコア・グレード・所要時間・回答一覧 |
| `/exam/history` | 成績履歴 | テスト単位+カード単位の成績 + 復習モードボタン |
| `/cards/[id]` | カード詳細 | カード情報・価格推移グラフ・回答履歴 |

### 6.3 管理者向け（サイドバーナビ付き）
| パス | 画面名 | サイドバー |
|------|--------|-----------|
| `/admin` | ダッシュボード | 📊 |
| `/admin/trial` | 模擬テスト | 🎯 |
| `/admin/common-tests` | 共通テスト一覧 | 📝 |
| `/admin/common-tests/new` | 共通テスト作成 | - |
| `/admin/common-tests/[id]` | 共通テスト編集 | - |
| `/admin/question-bank` | 問題DB一覧 | 📚 |
| `/admin/question-bank/new` | 問題DB作成 | - |
| `/admin/question-bank/[id]` | 問題DB編集 | - |
| `/admin/custom-cards` | 個別登録カード | 🃏 |
| `/admin/announcements` | お知らせ管理 | 📢 |
| `/admin/settings` | 許容範囲設定 | ⚙️ |
| `/admin/users` | ユーザー管理 | 👥 |

---

## 7. API一覧

### 7.1 認証
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/register` | ユーザー登録 |

### 7.2 テスト受験
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/exam/start` | 通常テスト開始（mode: normal/endless, franchise: 各商材/all） |
| POST | `/api/exam/common/start` | 共通テスト開始 |
| POST | `/api/exam/answer` | 回答送信・正誤判定 |
| POST | `/api/exam/finish` | テスト終了・結果取得 |
| GET | `/api/exam/common-tests` | 公開中の共通テスト一覧 |
| GET | `/api/exam/history?user_id=` | 成績履歴（テスト単位+カード単位） |
| POST | `/api/exam/review` | 復習モード開始 |

### 7.3 カード情報
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/cards/[id]` | カード詳細+価格履歴+回答履歴 |
| GET | `/api/admin/cards?franchise=&search=` | カード検索 |

### 7.4 管理（統計・設定）
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/admin/stats` | ダッシュボード統計 |
| GET/PUT | `/api/admin/tolerances` | 許容範囲設定 |

### 7.5 管理（共通テスト）
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/admin/common-tests` | 一覧・作成 |
| GET/PATCH/DELETE | `/api/admin/common-tests/[id]` | 詳細・更新・削除 |
| POST/PUT/DELETE | `/api/admin/common-tests/[id]/questions` | 問題追加・更新・削除 |
| POST | `/api/admin/common-tests/[id]/random` | ランダム問題追加 |

### 7.6 管理（問題DB・カスタムカード）
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/admin/question-bank` | 問題DB一覧・作成 |
| GET/PATCH/DELETE | `/api/admin/question-bank/[id]` | 問題詳細・編集・削除 |
| GET/POST | `/api/admin/custom-cards` | 個別登録カード一覧・作成 |
| PATCH/DELETE | `/api/admin/custom-cards/[id]` | カード編集・削除 |

### 7.7 お知らせ
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/announcements` | 一覧・投稿 |

### 7.8 データ同期
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/sync` | KECAKシート→quiz_card同期（Cron: 毎日11:30 JST） |

---

## 8. 環境変数

### 8.1 必須
| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `KECAK_GOOGLE_REFRESH_TOKEN` | KECAK用 Google OAuth Refresh Token |
| `KECAK_SPREADSHEET_ID` | KECAKスプレッドシートID |
| `CRON_SECRET` | Vercel Cron認証用シークレット |

### 8.2 オプション
| 変数名 | 説明 |
|--------|------|
| `GOOGLE_REFRESH_TOKEN` | メインアカウント用 Refresh Token（KECAKのフォールバック） |

---

## 9. デプロイ構成

### 9.1 Vercel
| 項目 | 値 |
|------|-----|
| プロジェクト名 | `tomstest` |
| チーム | `tomstock-s` |
| リポジトリ | `nagatar-hub/Tomstest` |
| Functions リージョン | `hnd1`（東京） |
| Cron | `30 2 * * *`（毎日11:30 JST） |
| 本番URL | https://tomstest.vercel.app |

### 9.2 Supabase
| 項目 | 値 |
|------|-----|
| プロジェクト名 | `gacha-admin-prod`（Harakaと共有） |
| Reference ID | `abyecthqjjssegwazhwm` |
| リージョン | Northeast Asia (Tokyo) |
| Storage バケット | `custom-cards`（公開） |

### 9.3 外部連携
| サービス | 用途 |
|---------|------|
| Google Sheets API | KECAKシートからカードデータ取得 |
| Google OAuth 2.0 | Sheets APIアクセス認証（refresh token方式） |

---

## 10. セキュリティ

### 10.1 認証
- パスワードは SHA-256 ハッシュで保存（平文保存なし）
- セッション管理はブラウザ sessionStorage（タブを閉じると消える）
- 管理者画面はクライアント側でroleチェック

### 10.2 API
- Sync APIは `CRON_SECRET` による Bearer認証
- 管理APIは現状クライアント側の認証チェックのみ（将来的にサーバーサイド認証を追加推奨）
- Supabase Service Role Keyはサーバーサイドのみで使用

### 10.3 データ
- `.env.local` は `.gitignore` に含まれる
- Google OAuth認証情報は環境変数またはSecret Managerで管理

---

## 11. 今後の拡張予定

### 11.1 確定
- [ ] 残りの画面をshadcn/uiコンポーネントで統一
- [ ] 問題DBの問題を共通テストに呼び出す機能

### 11.2 検討中
- [ ] カスタム問題（画像アップロード+記述式）の出題対応
- [ ] サーバーサイドの管理者認証ミドルウェア
- [ ] スタッフ個人別のダッシュボード
- [ ] テスト結果のCSVエクスポート
- [ ] Discord/Slack通知連携

---

## 12. ファイル構成

```
tomstest/
├── docs/
│   └── SPECIFICATION.md          ← この仕様書
├── public/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← ログイン
│   │   ├── register/page.tsx     ← 新規登録
│   │   ├── exam/
│   │   │   ├── page.tsx          ← テスト開始
│   │   │   ├── play/page.tsx     ← 出題画面
│   │   │   ├── result/page.tsx   ← 結果画面
│   │   │   └── history/page.tsx  ← 成績履歴
│   │   ├── cards/[id]/page.tsx   ← カード詳細
│   │   ├── admin/
│   │   │   ├── layout.tsx        ← サイドバーレイアウト
│   │   │   ├── page.tsx          ← ダッシュボード
│   │   │   ├── trial/page.tsx    ← 模擬テスト
│   │   │   ├── common-tests/     ← 共通テスト管理
│   │   │   ├── question-bank/    ← 問題DB管理
│   │   │   ├── custom-cards/     ← 個別登録カード
│   │   │   ├── announcements/    ← お知らせ管理
│   │   │   ├── settings/         ← 許容範囲設定
│   │   │   └── users/            ← ユーザー管理
│   │   ├── api/                  ← 全APIルート（23エンドポイント）
│   │   ├── globals.css           ← テーマ定義
│   │   └── layout.tsx            ← ルートレイアウト
│   ├── components/
│   │   ├── admin-layout.tsx      ← サイドバーナビ
│   │   └── ui/                   ← shadcn/ui コンポーネント (11個)
│   └── lib/
│       ├── types.ts              ← 型定義・定数
│       ├── quiz-logic.ts         ← 出題・正誤判定ロジック
│       ├── supabase-server.ts    ← Supabaseクライアント
│       ├── auth.ts               ← Google OAuth認証
│       ├── google-sheets.ts      ← Sheets API
│       ├── fetch-with-retry.ts   ← リトライ付きfetch
│       ├── kecak-parser.ts       ← KECAKシートパーサー
│       └── utils.ts              ← ユーティリティ
├── supabase/
│   ├── config.toml
│   └── migrations/               ← 7マイグレーションファイル
├── vercel.json                   ← リージョン + Cron設定
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## 13. 統計

| 項目 | 数値 |
|------|------|
| 画面数 | 19ページ |
| APIエンドポイント数 | 23 |
| DBテーブル数 | 11 |
| DB関数数 | 3 |
| コンポーネント数 | 12（1カスタム + 11 shadcn） |
| Libファイル数 | 8 |
| 問題データ数 | 836件（Pokemon 499 / ONE PIECE 108 / YU-GI-OH! 229） |
| 総コード行数 | 約7,500行 |

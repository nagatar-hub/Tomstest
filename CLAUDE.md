# CLAUDE.md - Tomstest（相場テストアプリ）

## 概要
KECAKスプレッドシートのカード買取価格データを使ったスタッフ向け相場暗記テストアプリ。
Haraka-Webappとは独立プロジェクト。

## 技術スタック
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase（Harakaと同じプロジェクト: spectre-tomstocks-20260227 に相乗り）
- Google Sheets API（KECAK シートから問題データ取得）
- Vercel にデプロイ

## 認証構成
- KECAKシートへのアクセスには Haraka と同じ OAuth 認証情報を使用
- 環境変数: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, KECAK_GOOGLE_REFRESH_TOKEN, KECAK_SPREADSHEET_ID

## データソース
- KECAKスプレッドシート（ID: 1XZypJOZZppxZMckPuRoJDaXWxLhOdwQQhv8ujE4DBFo）
- シート: ポケモン, ワンピース, 遊戯王
- 毎日11:30に自動sync（Vercel Cron）

## 難易度
- かんたん: 4択（パターンは別途定義）
- ノーマル: 数値入力（価格帯ごとの±許容範囲）
- むずかしい: 数値入力（許容範囲を狭める）
- 許容範囲は管理画面から設定可能

## コミュニケーション
- ユーザーには必ず丁寧語（です・ます調）で話すこと

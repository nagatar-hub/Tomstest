// ---------------------------------------------------------------------------
// フランチャイズ
// ---------------------------------------------------------------------------

export const FRANCHISES = ['Pokemon', 'ONE PIECE', 'YU-GI-OH!'] as const;
export type Franchise = (typeof FRANCHISES)[number];

export const FRANCHISE_JA: Record<Franchise, string> = {
  Pokemon: 'ポケモン',
  'ONE PIECE': 'ワンピース',
  'YU-GI-OH!': '遊戯王',
};

export const KECAK_SHEET_MAP: Record<Franchise, string> = {
  Pokemon: 'ポケモン',
  'ONE PIECE': 'ワンピース',
  'YU-GI-OH!': '遊戯王',
};

// ---------------------------------------------------------------------------
// 難易度
// ---------------------------------------------------------------------------

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_JA: Record<Difficulty, string> = {
  easy: 'かんたん',
  normal: 'ノーマル',
  hard: 'むずかしい',
};

// ---------------------------------------------------------------------------
// DB 行型
// ---------------------------------------------------------------------------

export interface QuizCard {
  id: string;
  franchise: Franchise;
  card_name: string;
  grade: string | null;
  list_no: string | null;
  rarity: string | null;
  image_url: string | null;
  price: number;
  synced_at: string;
}

export interface QuizUser {
  id: string;
  name: string;
  password_hash: string;
  role: 'staff' | 'admin';
  created_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  difficulty: Difficulty;
  franchise: Franchise;
  total_questions: number;
  score: number;
  started_at: string;
  finished_at: string | null;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  quiz_card_id: string;
  correct_price: number;
  answered_value: number | null;
  is_correct: boolean;
}

export interface Tolerance {
  id: string;
  difficulty: Difficulty;
  price_min: number;
  price_max: number;
  tolerance_amount: number;
}

// ---------------------------------------------------------------------------
// API / フロント共通
// ---------------------------------------------------------------------------

/** 出題1問分 */
export interface Question {
  quiz_card_id: string;
  card_name: string;
  grade: string | null;
  image_url: string | null;
  franchise: Franchise;
  /** かんたんモード用の選択肢（4つ） */
  choices?: number[];
}

/** 受験結果 */
export interface ExamResult {
  session_id: string;
  score: number;
  total: number;
  answers: {
    card_name: string;
    correct_price: number;
    answered_value: number | null;
    is_correct: boolean;
  }[];
}

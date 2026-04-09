/**
 * クイズ出題・正誤判定ロジック
 */

import type { Difficulty, QuizCard, Tolerance } from './types';

/**
 * 許容範囲テーブルから該当する許容額を取得
 */
export function getToleranceAmount(
  tolerances: Tolerance[],
  difficulty: Difficulty,
  price: number,
): number {
  const match = tolerances.find(
    (t) => t.difficulty === difficulty && price >= t.price_min && price <= t.price_max,
  );
  return match?.tolerance_amount ?? 0;
}

/**
 * 数値入力の正誤判定（ノーマル / むずかしい）
 */
export function judgeNumericAnswer(
  correctPrice: number,
  answeredValue: number,
  toleranceAmount: number,
): boolean {
  return Math.abs(correctPrice - answeredValue) <= toleranceAmount;
}

/**
 * かんたんモード用の4択生成
 * 正解 + ダミー3つ。ダミーは正解の ±20%〜±60% の範囲でランダム生成
 */
export function generateChoices(correctPrice: number): number[] {
  const choices = new Set<number>();
  choices.add(correctPrice);

  while (choices.size < 4) {
    // ±20%〜±60% のランダム係数
    const factor = 0.2 + Math.random() * 0.4;
    const sign = Math.random() < 0.5 ? -1 : 1;
    let dummy = Math.round(correctPrice * (1 + sign * factor));

    // 100円単位に丸める（価格の自然さ）
    dummy = Math.round(dummy / 100) * 100;

    // 0以下や正解と同じにならないように
    if (dummy > 0 && dummy !== correctPrice) {
      choices.add(dummy);
    }
  }

  // シャッフル
  return [...choices].sort(() => Math.random() - 0.5);
}

/**
 * 問題プールからランダムに出題分を抽出
 */
export function pickQuestions(cards: QuizCard[], count: number): QuizCard[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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
 * 4択生成（許容範囲設定を参照）
 *
 * toleranceAmount（ノーマルの許容範囲）を刻み単位として、
 * ±(1〜5) × toleranceAmount のダミー3つを生成。
 *
 * 例: 正解50,000円、toleranceAmount=2,000円の場合
 *   ダミー候補: ±2,000 / ±4,000 / ±6,000 / ±8,000 / ±10,000
 *   → そこから3つランダムに選んでシャッフル
 */
export function generateChoices(
  correctPrice: number,
  toleranceAmount?: number,
): number[] {
  // tolerance未指定時のフォールバック（旧ロジック互換）
  if (!toleranceAmount || toleranceAmount <= 0) {
    return generateChoicesFallback(correctPrice);
  }

  const step = toleranceAmount;

  // n=1〜5 の全候補を生成（+側と-側）
  const candidates: number[] = [];
  for (let n = 1; n <= 5; n++) {
    const plus = correctPrice + step * n;
    const minus = correctPrice - step * n;
    candidates.push(plus);
    if (minus > 0) candidates.push(minus);
  }

  // シャッフルして3つ選ぶ
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const dummies = shuffled.slice(0, 3);

  // 正解 + ダミー3つをシャッフル
  return [correctPrice, ...dummies].sort(() => Math.random() - 0.5);
}

/** toleranceが取れないときのフォールバック */
function generateChoicesFallback(correctPrice: number): number[] {
  const choices = new Set<number>();
  choices.add(correctPrice);
  while (choices.size < 4) {
    const factor = 0.2 + Math.random() * 0.4;
    const sign = Math.random() < 0.5 ? -1 : 1;
    const dummy = Math.round(correctPrice * (1 + sign * factor));
    if (dummy > 0 && dummy !== correctPrice) choices.add(dummy);
  }
  return [...choices].sort(() => Math.random() - 0.5);
}

/**
 * 問題プールからランダムに出題分を抽出
 */
export function pickQuestions(cards: QuizCard[], count: number): QuizCard[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

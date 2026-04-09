/**
 * POST /api/exam/answer
 *
 * 1問回答を送信 → 正誤判定 → quiz_answer に保存
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getToleranceAmount, judgeNumericAnswer } from '@/lib/quiz-logic';
import type { Difficulty, Tolerance } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, quiz_card_id, answered_value } = body as {
      session_id: string;
      quiz_card_id: string;
      answered_value: number;
    };

    if (!session_id || !quiz_card_id || answered_value == null) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // セッション取得
    const { data: session, error: sessErr } = await supabase
      .from('quiz_session')
      .select('difficulty')
      .eq('id', session_id)
      .single();
    if (sessErr || !session) {
      return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 });
    }

    // 正解価格取得
    const { data: card, error: cardErr } = await supabase
      .from('quiz_card')
      .select('price')
      .eq('id', quiz_card_id)
      .single();
    if (cardErr || !card) {
      return NextResponse.json({ error: 'カードが見つかりません' }, { status: 404 });
    }

    const difficulty = session.difficulty as Difficulty;
    const correctPrice = card.price;

    let isCorrect: boolean;

    if (difficulty === 'easy') {
      // 4択: 完全一致
      isCorrect = answered_value === correctPrice;
    } else {
      // ノーマル / むずかしい: 許容範囲内か
      const { data: tolerances } = await supabase
        .from('tolerance')
        .select('*')
        .eq('difficulty', difficulty);

      const toleranceAmount = getToleranceAmount(
        (tolerances ?? []) as Tolerance[],
        difficulty,
        correctPrice,
      );
      isCorrect = judgeNumericAnswer(correctPrice, answered_value, toleranceAmount);
    }

    // 回答保存
    const { error: ansErr } = await supabase.from('quiz_answer').insert({
      session_id,
      quiz_card_id,
      correct_price: correctPrice,
      answered_value,
      is_correct: isCorrect,
    });
    if (ansErr) throw ansErr;

    // 正解ならスコア加算
    if (isCorrect) {
      await supabase.rpc('increment_quiz_score', { sid: session_id });
    }

    return NextResponse.json({
      is_correct: isCorrect,
      correct_price: correctPrice,
    });
  } catch (err) {
    console.error('[exam/answer]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

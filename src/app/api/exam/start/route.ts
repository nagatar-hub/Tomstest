/**
 * POST /api/exam/start
 *
 * 受験開始: ユーザー認証 → セッション作成 → 出題生成
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { pickQuestions, generateChoices, getToleranceAmount } from '@/lib/quiz-logic';
import type { Difficulty, Franchise, QuizCard, Question, Tolerance } from '@/lib/types';

const QUESTION_COUNT = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, franchise, difficulty } = body as {
      user_id: string;
      franchise: Franchise;
      difficulty: Difficulty;
    };

    if (!user_id || !franchise || !difficulty) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 問題プール取得
    const { data: cards, error: cardsErr } = await supabase
      .from('quiz_card')
      .select('*')
      .eq('franchise', franchise)
      .gt('price', 0);

    if (cardsErr) throw cardsErr;
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: '問題データがありません。Syncを実行してください。' }, { status: 404 });
    }

    // ランダム抽出
    const selected = pickQuestions(cards as QuizCard[], QUESTION_COUNT);

    // セッション作成
    const { data: session, error: sessionErr } = await supabase
      .from('quiz_session')
      .insert({
        user_id,
        difficulty,
        franchise,
        total_questions: selected.length,
        score: 0,
      })
      .select('id')
      .single();

    if (sessionErr) throw sessionErr;

    // 4択用: ノーマルの許容範囲を取得（刻み単位として使用）
    let tolerances: Tolerance[] = [];
    if (difficulty === 'easy') {
      const { data } = await supabase
        .from('tolerance')
        .select('*')
        .eq('difficulty', 'normal');
      tolerances = (data ?? []) as Tolerance[];
    }

    // 出題データ構築
    const questions: Question[] = selected.map((card) => {
      const toleranceAmount = difficulty === 'easy'
        ? getToleranceAmount(tolerances, 'normal', card.price)
        : 0;
      return {
        quiz_card_id: card.id,
        card_name: card.card_name,
        grade: card.grade,
        image_url: card.image_url,
        franchise: card.franchise as Franchise,
        ...(difficulty === 'easy' ? { choices: generateChoices(card.price, toleranceAmount) } : {}),
      };
    });

    return NextResponse.json({
      session_id: session.id,
      questions,
    });
  } catch (err) {
    console.error('[exam/start]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

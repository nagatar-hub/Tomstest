/**
 * POST /api/exam/start
 *
 * 受験開始: ユーザー認証 → セッション作成 → 出題生成
 * mode: 'normal'(デフォルト10問) or 'endless'(全問)
 * franchise: 商材指定 or 'all'(全商材混合)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { pickQuestions, generateChoices, getToleranceAmount } from '@/lib/quiz-logic';
import type { Difficulty, Franchise, QuizCard, Question, Tolerance } from '@/lib/types';

const QUESTION_COUNT = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, franchise, difficulty, mode = 'normal' } = body as {
      user_id: string;
      franchise: Franchise | 'all';
      difficulty: Difficulty;
      mode?: 'normal' | 'endless';
    };

    if (!user_id || !franchise || !difficulty) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 問題プール取得
    let query = supabase.from('quiz_card').select('*').gt('price', 0);
    if (franchise !== 'all') {
      query = query.eq('franchise', franchise);
    }

    const { data: cards, error: cardsErr } = await query;
    if (cardsErr) throw cardsErr;
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: '問題データがありません。Syncを実行してください。' }, { status: 404 });
    }

    // 抽出
    const count = mode === 'endless' ? cards.length : QUESTION_COUNT;
    const selected = pickQuestions(cards as QuizCard[], count);

    // セッション作成
    const { data: session, error: sessionErr } = await supabase
      .from('quiz_session')
      .insert({
        user_id,
        difficulty,
        franchise: franchise === 'all' ? 'Pokemon' : franchise, // DB制約用
        total_questions: selected.length,
        score: 0,
      })
      .select('id')
      .single();
    if (sessionErr) throw sessionErr;

    // 4択用: ノーマルの許容範囲
    let tolerances: Tolerance[] = [];
    if (difficulty === 'easy') {
      const { data } = await supabase.from('tolerance').select('*').eq('difficulty', 'normal');
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
      mode,
    });
  } catch (err) {
    console.error('[exam/start]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

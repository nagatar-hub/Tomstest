/**
 * POST /api/exam/review
 *
 * 復習モード: 過去に間違えたカードのみで出題（最新価格準拠）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { generateChoices, getToleranceAmount } from '@/lib/quiz-logic';
import type { Franchise, Question, Tolerance } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { user_id, difficulty = 'easy' } = (await request.json()) as {
      user_id: string;
      difficulty?: string;
    };

    if (!user_id) return NextResponse.json({ error: 'user_id必須' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // 過去に間違えたカードIDを取得（重複排除）
    const { data: wrongAnswers } = await supabase
      .from('quiz_answer')
      .select('quiz_card_id, quiz_session:session_id(user_id)')
      .eq('is_correct', false)
      .eq('quiz_session.user_id', user_id);

    const wrongCardIds = [...new Set(
      (wrongAnswers ?? [])
        .filter((a) => (a.quiz_session as unknown as Record<string, unknown>)?.user_id === user_id)
        .map((a) => a.quiz_card_id),
    )];

    if (wrongCardIds.length === 0) {
      return NextResponse.json({ error: '間違えた問題がありません。素晴らしい！' }, { status: 404 });
    }

    // 最新価格でカード取得
    const { data: cards } = await supabase
      .from('quiz_card')
      .select('id, card_name, grade, franchise, price, image_url')
      .in('id', wrongCardIds)
      .gt('price', 0);

    if (!cards?.length) {
      return NextResponse.json({ error: '復習カードが見つかりません' }, { status: 404 });
    }

    // シャッフル
    const shuffled = cards.sort(() => Math.random() - 0.5);

    // セッション作成
    const { data: session, error: sessErr } = await supabase
      .from('quiz_session')
      .insert({
        user_id,
        difficulty,
        franchise: 'all',
        total_questions: shuffled.length,
        score: 0,
      })
      .select('id')
      .single();
    if (sessErr) throw sessErr;

    // tolerance取得
    const { data: tolData } = await supabase.from('tolerance').select('*').eq('difficulty', 'normal');
    const tolerances = (tolData ?? []) as Tolerance[];

    const questions: Question[] = shuffled.map((card) => {
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
      mode: 'review',
    });
  } catch (err) {
    console.error('[exam/review]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/exam/finish
 *
 * 受験完了: セッションを完了状態にし、結果を返す
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { session_id } = (await request.json()) as { session_id: string };

    if (!session_id) {
      return NextResponse.json({ error: 'session_id が必要です' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // セッション完了
    const { data: session, error: sessErr } = await supabase
      .from('quiz_session')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', session_id)
      .select('score, total_questions')
      .single();
    if (sessErr) throw sessErr;

    // 全回答取得
    const { data: answers, error: ansErr } = await supabase
      .from('quiz_answer')
      .select('quiz_card_id, correct_price, answered_value, is_correct, quiz_card:quiz_card_id(card_name)')
      .eq('session_id', session_id);
    if (ansErr) throw ansErr;

    return NextResponse.json({
      session_id,
      score: session.score,
      total: session.total_questions,
      answers: (answers ?? []).map((a: Record<string, unknown>) => ({
        card_name: (a.quiz_card as Record<string, unknown>)?.card_name ?? '',
        correct_price: a.correct_price,
        answered_value: a.answered_value,
        is_correct: a.is_correct,
      })),
    });
  } catch (err) {
    console.error('[exam/finish]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cards/[id]
 *
 * カード詳細 + 価格履歴 + 正答率
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // カード情報
    const { data: card, error: cardErr } = await supabase
      .from('quiz_card')
      .select('*')
      .eq('id', id)
      .single();
    if (cardErr) throw cardErr;

    // 価格履歴
    const { data: priceHistory } = await supabase
      .from('quiz_card_price_history')
      .select('price, recorded_at')
      .eq('quiz_card_id', id)
      .order('recorded_at');

    // 回答履歴
    const { data: answers } = await supabase
      .from('quiz_answer')
      .select('correct_price, answered_value, is_correct, quiz_session:session_id(user_id, finished_at, quiz_user:user_id(name))')
      .eq('quiz_card_id', id)
      .order('quiz_session(finished_at)', { ascending: false })
      .limit(50);

    // 正答率集計
    const total = (answers ?? []).length;
    const correct = (answers ?? []).filter((a) => a.is_correct).length;

    return NextResponse.json({
      card,
      price_history: priceHistory ?? [],
      answers: (answers ?? []).map((a) => {
        const session = a.quiz_session as unknown as Record<string, unknown>;
        const user = session?.quiz_user as Record<string, unknown> | undefined;
        return {
          correct_price: a.correct_price,
          answered_value: a.answered_value,
          is_correct: a.is_correct,
          user_name: user?.name ?? '',
          finished_at: session?.finished_at ?? '',
        };
      }),
      stats: { total, correct, accuracy: total ? Math.round((correct / total) * 100) : 0 },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

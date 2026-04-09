/**
 * GET /api/exam/history?user_id=xxx
 *
 * ユーザーの成績履歴（テスト単位 + カード単位）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id必須' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // テスト単位の履歴
    const { data: sessions } = await supabase
      .from('quiz_session')
      .select('id, difficulty, franchise, total_questions, score, started_at, finished_at, common_test_id')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(50);

    // カード単位の成績（間違えたカード）
    const { data: cardStats } = await supabase
      .from('quiz_answer')
      .select('quiz_card_id, correct_price, answered_value, is_correct, quiz_card:quiz_card_id(card_name, grade, franchise, price, image_url), quiz_session:session_id(user_id, finished_at)')
      .not('quiz_session.finished_at', 'is', null)
      .eq('quiz_session.user_id', userId)
      .order('quiz_card_id');

    // カードごとに集計
    const cardMap = new Map<string, {
      quiz_card_id: string;
      card_name: string;
      grade: string | null;
      franchise: string;
      price: number;
      image_url: string | null;
      total: number;
      correct: number;
      last_wrong_at: string | null;
    }>();

    for (const a of cardStats ?? []) {
      const card = a.quiz_card as unknown as Record<string, unknown>;
      const session = a.quiz_session as unknown as Record<string, unknown>;
      if (!card || !session) continue;

      const id = a.quiz_card_id;
      const existing = cardMap.get(id) ?? {
        quiz_card_id: id,
        card_name: card.card_name as string,
        grade: card.grade as string | null,
        franchise: card.franchise as string,
        price: card.price as number,
        image_url: card.image_url as string | null,
        total: 0,
        correct: 0,
        last_wrong_at: null,
      };
      existing.total++;
      if (a.is_correct) existing.correct++;
      else existing.last_wrong_at = session.finished_at as string;
      cardMap.set(id, existing);
    }

    const cardResults = [...cardMap.values()]
      .map((c) => ({ ...c, accuracy: Math.round((c.correct / c.total) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy); // 正答率低い順

    return NextResponse.json({ sessions: sessions ?? [], card_stats: cardResults });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

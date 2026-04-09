/**
 * POST /api/admin/common-tests/[id]/random
 *
 * 指定数のカードをランダムに選んで問題として追加
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { count, franchise, question_type = 'choice' } = (await request.json()) as {
      count: number;
      franchise: string | null;
      question_type?: string;
    };

    const supabase = getSupabaseAdmin();

    // カード取得（全件取ってシャッフル）
    let query = supabase
      .from('quiz_card')
      .select('id')
      .gt('price', 0);

    if (franchise) {
      query = query.eq('franchise', franchise);
    }

    const { data: cards, error: cardsErr } = await query;
    if (cardsErr) throw cardsErr;

    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: '対象カードがありません' }, { status: 404 });
    }

    // シャッフルして指定数抽出
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // 問題として追加
    const rows = selected.map((c, i) => ({
      common_test_id: id,
      quiz_card_id: c.id,
      question_type,
      sort_order: i,
    }));

    const { error } = await supabase.from('common_test_question').insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, added: rows.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

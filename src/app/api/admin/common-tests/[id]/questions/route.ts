/**
 * POST   /api/admin/common-tests/[id]/questions  — 問題追加
 * PUT    /api/admin/common-tests/[id]/questions  — 問題一括更新（並び順・形式）
 * DELETE /api/admin/common-tests/[id]/questions  — 問題削除
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quiz_card_ids, question_type = 'choice' } = body as {
      quiz_card_ids: string[];
      question_type?: string;
    };

    if (!quiz_card_ids?.length) {
      return NextResponse.json({ error: 'カードを選択してください' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 既存の最大sort_order取得
    const { data: existing } = await supabase
      .from('common_test_question')
      .select('sort_order')
      .eq('common_test_id', id)
      .order('sort_order', { ascending: false })
      .limit(1);

    let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const rows = quiz_card_ids.map((cardId) => ({
      common_test_id: id,
      quiz_card_id: cardId,
      question_type,
      sort_order: nextOrder++,
    }));

    const { error } = await supabase.from('common_test_question').insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, added: rows.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = body as { question_id: string; question_type?: string; sort_order?: number }[];

    const supabase = getSupabaseAdmin();

    for (const u of updates) {
      const patch: Record<string, unknown> = {};
      if (u.question_type !== undefined) patch.question_type = u.question_type;
      if (u.sort_order !== undefined) patch.sort_order = u.sort_order;

      const { error } = await supabase
        .from('common_test_question')
        .update(patch)
        .eq('id', u.question_id)
        .eq('common_test_id', id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { question_ids } = (await request.json()) as { question_ids: string[] };

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('common_test_question')
      .delete()
      .eq('common_test_id', id)
      .in('id', question_ids);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

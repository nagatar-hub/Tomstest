/**
 * GET    /api/admin/common-tests/[id]  — 詳細（問題リスト込み）
 * PATCH  /api/admin/common-tests/[id]  — 更新（タイトル、公開状態）
 * DELETE /api/admin/common-tests/[id]  — 削除
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

    const { data: test, error: testErr } = await supabase
      .from('common_test')
      .select('*')
      .eq('id', id)
      .single();
    if (testErr) throw testErr;

    const { data: questions, error: qErr } = await supabase
      .from('common_test_question')
      .select('*, quiz_card:quiz_card_id(card_name, grade, franchise, price, image_url)')
      .eq('common_test_id', id)
      .order('sort_order');
    if (qErr) throw qErr;

    return NextResponse.json({ ...test, questions: questions ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('common_test')
      .update(body)
      .eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from('common_test').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

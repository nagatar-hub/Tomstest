/**
 * GET    /api/admin/question-bank/[id]
 * PATCH  /api/admin/question-bank/[id]
 * DELETE /api/admin/question-bank/[id]?purge=true&announce_title=...&announce_body=...
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
    const { data, error } = await supabase
      .from('question_bank')
      .select('*, quiz_card:quiz_card_id(card_name, grade, price, image_url), custom_card:custom_card_id(card_name, price, image_url)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
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
    const { error } = await supabase.from('question_bank').update(body).eq('id', id);
    if (error) throw error;
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
    const url = new URL(request.url);
    const purge = url.searchParams.get('purge') === 'true';
    const announceTitle = url.searchParams.get('announce_title');
    const announceBody = url.searchParams.get('announce_body');
    const createdBy = url.searchParams.get('created_by');

    const supabase = getSupabaseAdmin();

    if (purge) {
      // 物理削除（関連quiz_answerも消える）
      // まず common_test_question の参照を解除
      await supabase
        .from('common_test_question')
        .delete()
        .eq('question_bank_id', id);
      const { error } = await supabase.from('question_bank').delete().eq('id', id);
      if (error) throw error;
    } else {
      // 論理削除（履歴は残る）
      const { error } = await supabase
        .from('question_bank')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }

    // お知らせ投稿（任意）
    if (announceTitle && createdBy) {
      await supabase.from('announcement').insert({
        title: announceTitle,
        body: announceBody ?? null,
        created_by: createdBy,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

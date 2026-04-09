/**
 * GET / PUT /api/admin/tolerances
 *
 * 許容範囲設定の取得・更新
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tolerance')
      .select('*')
      .order('difficulty')
      .order('price_min');

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[admin/tolerances GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id: string;
      tolerance_amount: number;
    }[];

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: '配列で送信してください' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    for (const item of body) {
      const { error } = await supabase
        .from('tolerance')
        .update({ tolerance_amount: item.tolerance_amount })
        .eq('id', item.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/tolerances PUT]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

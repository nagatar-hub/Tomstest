/**
 * GET  /api/admin/common-tests       — 一覧
 * POST /api/admin/common-tests       — 新規作成
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('common_test')
      .select('*, quiz_user:created_by(name), common_test_question(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, franchise, created_by } = body as {
      title: string;
      franchise: string | null;
      created_by: string;
    };

    if (!title || !created_by) {
      return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('common_test')
      .insert({ title, franchise: franchise || null, created_by, is_published: false })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

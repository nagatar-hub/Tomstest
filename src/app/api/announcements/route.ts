/**
 * GET  /api/announcements              — 一覧（最新20件）
 * POST /api/announcements              — 投稿（管理者のみ）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('announcement')
      .select('*, quiz_user:created_by(name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: bodyText, created_by, is_pinned = false } = body as {
      title: string;
      body?: string;
      created_by: string;
      is_pinned?: boolean;
    };

    if (!title || !created_by) {
      return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('announcement')
      .insert({ title, body: bodyText ?? null, created_by, is_pinned })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

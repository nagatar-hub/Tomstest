/**
 * GET  /api/announcements?all=true  — 全件（管理用）/ デフォルトは期間内のみ
 * POST /api/announcements           — 投稿
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const showAll = url.searchParams.get('all') === 'true';
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('announcement')
      .select('*, quiz_user:created_by(name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    // スタッフ向け: 期間内のもののみ
    if (!showAll) {
      const now = new Date().toISOString();
      query = query
        .lte('starts_at', now)
        .or(`expires_at.is.null,expires_at.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: bodyText, created_by, is_pinned = false, starts_at, expires_at } = body as {
      title: string;
      body?: string;
      created_by: string;
      is_pinned?: boolean;
      starts_at?: string;
      expires_at?: string | null;
    };

    if (!title || !created_by) {
      return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('announcement')
      .insert({
        title,
        body: bodyText ?? null,
        created_by,
        is_pinned,
        starts_at: starts_at ?? new Date().toISOString(),
        expires_at: expires_at ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/auth/login
 *
 * 簡易ログイン（名前 + パスワード）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { name, password } = (await request.json()) as {
      name: string;
      password: string;
    };

    if (!name || !password) {
      return NextResponse.json({ error: '名前とパスワードを入力してください' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from('quiz_user')
      .select('id, name, role, password_hash, avatar_url')
      .eq('name', name)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 401 });
    }

    // 簡易パスワードチェック（SHA-256 ハッシュ）
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex !== user.password_hash) {
      return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

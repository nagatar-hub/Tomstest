/**
 * POST /api/auth/register
 *
 * ユーザー登録（管理者が作成 or 初期セットアップ用）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { name, password, role = 'staff' } = (await request.json()) as {
      name: string;
      password: string;
      role?: 'staff' | 'admin';
    };

    if (!name || !password) {
      return NextResponse.json({ error: '名前とパスワードを入力してください' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上にしてください' }, { status: 400 });
    }

    // SHA-256 ハッシュ
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from('quiz_user')
      .insert({ name, password_hash: hashHex, role })
      .select('id, name, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'その名前は既に使われています' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/change-password
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { user_id, new_password } = (await request.json()) as {
      user_id: string;
      new_password: string;
    };

    if (!user_id || !new_password || new_password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上にしてください' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(new_password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('quiz_user')
      .update({ password_hash: hashHex })
      .eq('id', user_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

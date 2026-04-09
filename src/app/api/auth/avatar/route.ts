/**
 * POST /api/auth/avatar — プロフィール画像アップロード
 * multipart/form-data: user_id, image
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    const image = formData.get('image') as File | null;

    if (!userId || !image || image.size === 0) {
      return NextResponse.json({ error: '画像を選択してください' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const ext = image.name.split('.').pop() ?? 'jpg';
    const path = `${userId}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    // 既存ファイルを上書き
    await supabase.storage.from('avatars').remove([path]);
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { contentType: image.type, upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // DB更新
    const { error: dbErr } = await supabase
      .from('quiz_user')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (dbErr) throw dbErr;

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

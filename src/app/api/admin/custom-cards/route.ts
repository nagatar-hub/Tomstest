/**
 * GET  /api/admin/custom-cards?franchise=Pokemon
 * POST /api/admin/custom-cards  (multipart/form-data: image, card_name, franchise, price, created_by)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const franchise = url.searchParams.get('franchise');
    const supabase = getSupabaseAdmin();

    let query = supabase.from('custom_card').select('*').order('created_at', { ascending: false });
    if (franchise) query = query.eq('franchise', franchise);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const cardName = formData.get('card_name') as string;
    const franchise = formData.get('franchise') as string;
    const price = formData.get('price') as string;
    const createdBy = formData.get('created_by') as string;

    if (!cardName || !franchise || !createdBy) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let imageUrl: string | null = null;

    // 画像アップロード
    if (image && image.size > 0) {
      const ext = image.name.split('.').pop() ?? 'jpg';
      const path = `${franchise}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await image.arrayBuffer());

      const { error: uploadErr } = await supabase.storage
        .from('custom-cards')
        .upload(path, buffer, { contentType: image.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('custom-cards').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('custom_card')
      .insert({
        franchise,
        card_name: cardName,
        image_url: imageUrl,
        price: price ? parseInt(price, 10) : null,
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

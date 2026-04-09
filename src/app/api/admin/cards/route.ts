/**
 * GET /api/admin/cards?franchise=Pokemon&search=リザードン
 *
 * カード検索API（共通テスト作成時のカード選択用）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const franchise = url.searchParams.get('franchise');
    const search = url.searchParams.get('search') ?? '';
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('quiz_card')
      .select('id, franchise, card_name, grade, price, image_url, rarity')
      .gt('price', 0)
      .order('price', { ascending: false })
      .limit(limit);

    if (franchise) {
      query = query.eq('franchise', franchise);
    }

    if (search) {
      query = query.ilike('card_name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/exam/common-tests
 *
 * 公開中の共通テスト一覧（スタッフ向け）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('common_test')
      .select('id, title, franchise, common_test_question(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

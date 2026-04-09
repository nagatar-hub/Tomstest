/**
 * GET /api/admin/stats
 *
 * 管理画面用統計:
 * - 受験履歴一覧
 * - 間違えやすい問題ランキング
 * - 全体正答率
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 受験履歴（最新50件）
    const { data: sessions } = await supabase
      .from('quiz_session')
      .select('id, difficulty, franchise, total_questions, score, started_at, finished_at, quiz_user:user_id(name)')
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(50);

    // 間違えやすい問題 TOP20（不正解率の高い順）
    const { data: hardCards } = await supabase.rpc('get_hard_cards', { lim: 20 });

    // 全体正答率
    const { data: overall } = await supabase.rpc('get_overall_accuracy');

    return NextResponse.json({
      sessions: (sessions ?? []).map((s: Record<string, unknown>) => ({
        id: s.id,
        user_name: (s.quiz_user as Record<string, unknown>)?.name ?? '',
        difficulty: s.difficulty,
        franchise: s.franchise,
        total_questions: s.total_questions,
        score: s.score,
        accuracy: s.total_questions ? Math.round(((s.score as number) / (s.total_questions as number)) * 100) : 0,
        finished_at: s.finished_at,
      })),
      hard_cards: hardCards ?? [],
      overall_accuracy: overall ?? { total_answers: 0, correct_answers: 0, accuracy: 0 },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

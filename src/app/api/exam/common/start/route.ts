/**
 * POST /api/exam/common/start
 *
 * 共通テスト受験開始
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { generateChoices } from '@/lib/quiz-logic';
import type { Question } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { user_id, common_test_id } = (await request.json()) as {
      user_id: string;
      common_test_id: string;
    };

    if (!user_id || !common_test_id) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 共通テスト取得
    const { data: test, error: testErr } = await supabase
      .from('common_test')
      .select('id, title, franchise, is_published')
      .eq('id', common_test_id)
      .single();
    if (testErr || !test) {
      return NextResponse.json({ error: 'テストが見つかりません' }, { status: 404 });
    }
    if (!test.is_published) {
      return NextResponse.json({ error: 'このテストはまだ公開されていません' }, { status: 403 });
    }

    // 問題取得
    const { data: questions, error: qErr } = await supabase
      .from('common_test_question')
      .select('id, question_type, quiz_card_id, quiz_card:quiz_card_id(id, card_name, grade, franchise, price, image_url)')
      .eq('common_test_id', common_test_id)
      .order('sort_order');
    if (qErr) throw qErr;

    if (!questions?.length) {
      return NextResponse.json({ error: '問題が登録されていません' }, { status: 404 });
    }

    // セッション作成（共通テストは difficulty を 'normal' 固定で記録）
    const { data: session, error: sessErr } = await supabase
      .from('quiz_session')
      .insert({
        user_id,
        difficulty: 'normal',
        franchise: test.franchise ?? 'Pokemon',
        total_questions: questions.length,
        score: 0,
        common_test_id,
      })
      .select('id')
      .single();
    if (sessErr) throw sessErr;

    // 出題データ構築
    const questionData: Question[] = questions.map((q) => {
      const card = q.quiz_card as unknown as Record<string, unknown>;
      return {
        quiz_card_id: card.id as string,
        card_name: card.card_name as string,
        grade: card.grade as string | null,
        image_url: card.image_url as string | null,
        franchise: card.franchise as Question['franchise'],
        ...(q.question_type === 'choice'
          ? { choices: generateChoices(card.price as number) }
          : {}),
      };
    });

    return NextResponse.json({
      session_id: session.id,
      title: test.title,
      questions: questionData,
    });
  } catch (err) {
    console.error('[exam/common/start]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

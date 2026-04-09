/**
 * POST /api/sync
 *
 * KECAKシートからquiz_cardテーブルへデータを同期する。
 * Vercel Cron（毎日11:30）から呼び出される。
 */

import { NextResponse } from 'next/server';
import { getAccessToken, getSpreadsheetId } from '@/lib/auth';
import { fetchSheetValues } from '@/lib/google-sheets';
import { parseKecakRows } from '@/lib/kecak-parser';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { FRANCHISES, KECAK_SHEET_MAP, type Franchise } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  // Cron 認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accessToken = await getAccessToken();
    const spreadsheetId = getSpreadsheetId();
    const supabase = getSupabaseAdmin();

    let totalUpserted = 0;

    for (const franchise of FRANCHISES) {
      const sheetName = KECAK_SHEET_MAP[franchise as Franchise];
      console.log(`[sync] ${franchise} (${sheetName}) 取得中...`);

      const rows = await fetchSheetValues({
        accessToken,
        spreadsheetId,
        range: sheetName,
      });

      const parsed = parseKecakRows(rows, franchise as Franchise);

      // バッチ内の重複排除（同じ franchise+card_name+grade が複数ある場合、後勝ち）
      const deduped = [
        ...new Map(
          parsed.map((c) => [`${c.franchise}|${c.card_name}|${c.grade ?? ''}`, c]),
        ).values(),
      ];
      console.log(`[sync] ${franchise}: ${parsed.length} 件パース → ${deduped.length} 件（重複排除後）`);

      if (deduped.length === 0) continue;

      // 1000件ずつ upsert
      for (let i = 0; i < deduped.length; i += 1000) {
        const batch = deduped.slice(i, i + 1000).map((card) => ({
          franchise: card.franchise,
          card_name: card.card_name,
          grade: card.grade,
          list_no: card.list_no,
          rarity: card.rarity,
          image_url: card.image_url,
          price: card.price,
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('quiz_card')
          .upsert(batch, { onConflict: 'franchise,card_name,grade' });

        if (error) {
          console.error(`[sync] ${franchise} upsert エラー:`, error);
          throw error;
        }

        totalUpserted += batch.length;
      }
    }

    console.log(`[sync] 完了: 合計 ${totalUpserted} 件 upsert`);
    return NextResponse.json({ ok: true, totalUpserted });
  } catch (err) {
    console.error('[sync] エラー:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

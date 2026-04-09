/**
 * POST /api/sync
 *
 * KECAKシートからquiz_cardテーブルへデータを同期する。
 * Vercel Cron（毎日11:30）から呼び出される。
 * 価格変動があればquiz_card_price_historyに記録。
 */

import { NextResponse } from 'next/server';
import { getAccessToken, getSpreadsheetId } from '@/lib/auth';
import { fetchSheetValues } from '@/lib/google-sheets';
import { parseKecakRows } from '@/lib/kecak-parser';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { FRANCHISES, KECAK_SHEET_MAP, type Franchise } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accessToken = await getAccessToken();
    const spreadsheetId = getSpreadsheetId();
    const supabase = getSupabaseAdmin();

    // 既存カードの価格マップ取得（履歴記録用）
    const { data: existingCards } = await supabase
      .from('quiz_card')
      .select('id, franchise, card_name, grade, price');
    const priceMap = new Map<string, { id: string; price: number }>();
    for (const c of existingCards ?? []) {
      priceMap.set(`${c.franchise}|${c.card_name}|${c.grade ?? ''}`, { id: c.id, price: c.price });
    }

    let totalUpserted = 0;
    const priceChanges: { quiz_card_id: string; price: number }[] = [];

    for (const franchise of FRANCHISES) {
      const sheetName = KECAK_SHEET_MAP[franchise as Franchise];
      console.log(`[sync] ${franchise} (${sheetName}) 取得中...`);

      const rows = await fetchSheetValues({
        accessToken,
        spreadsheetId,
        range: sheetName,
      });

      const parsed = parseKecakRows(rows, franchise as Franchise);

      const deduped = [
        ...new Map(
          parsed.map((c) => [`${c.franchise}|${c.card_name}|${c.grade ?? ''}`, c]),
        ).values(),
      ];
      console.log(`[sync] ${franchise}: ${parsed.length} 件パース → ${deduped.length} 件（重複排除後）`);

      if (deduped.length === 0) continue;

      // 価格変動を検出
      for (const card of deduped) {
        const key = `${card.franchise}|${card.card_name}|${card.grade ?? ''}`;
        const existing = priceMap.get(key);
        if (existing && existing.price !== card.price) {
          priceChanges.push({ quiz_card_id: existing.id, price: card.price });
        }
        // 新規カードは upsert 後に初回履歴を記録
        if (!existing) {
          priceChanges.push({ quiz_card_id: '__new__' + key, price: card.price });
        }
      }

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

    // 価格履歴を記録（新規カードはIDを再取得）
    if (priceChanges.length > 0) {
      const historyRows: { quiz_card_id: string; price: number }[] = [];

      // 新規カードのID解決
      const newKeys = priceChanges
        .filter((c) => c.quiz_card_id.startsWith('__new__'))
        .map((c) => c.quiz_card_id.replace('__new__', ''));

      if (newKeys.length > 0) {
        const { data: newCards } = await supabase
          .from('quiz_card')
          .select('id, franchise, card_name, grade');
        const newIdMap = new Map<string, string>();
        for (const c of newCards ?? []) {
          newIdMap.set(`${c.franchise}|${c.card_name}|${c.grade ?? ''}`, c.id);
        }
        for (const change of priceChanges) {
          if (change.quiz_card_id.startsWith('__new__')) {
            const key = change.quiz_card_id.replace('__new__', '');
            const id = newIdMap.get(key);
            if (id) historyRows.push({ quiz_card_id: id, price: change.price });
          } else {
            historyRows.push(change);
          }
        }
      } else {
        historyRows.push(...priceChanges);
      }

      // 500件ずつ insert
      for (let i = 0; i < historyRows.length; i += 500) {
        const batch = historyRows.slice(i, i + 500);
        await supabase.from('quiz_card_price_history').insert(batch);
      }
      console.log(`[sync] 価格履歴: ${historyRows.length} 件記録`);
    }

    console.log(`[sync] 完了: 合計 ${totalUpserted} 件 upsert`);
    return NextResponse.json({ ok: true, totalUpserted, priceChanges: priceChanges.length });
  } catch (err) {
    console.error('[sync] エラー:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

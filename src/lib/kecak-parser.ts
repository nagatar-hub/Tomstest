/**
 * KECAK シートのパーサー（Haraka から移植・quiz_card 向けに簡素化）
 */

import type { Franchise } from './types';

type ColumnMapping = {
  cardName: number;
  grade: number;
  listNo: number;
  rarity: number | null;
  imageUrl: number;
  kecakPrice: number;
};

const YUGIOH_COLS: ColumnMapping = {
  cardName: 0,
  grade: 1,
  listNo: 3,
  rarity: 4,
  imageUrl: 5,
  kecakPrice: 7,
};

const POKEMON_ONEPIECE_COLS: ColumnMapping = {
  cardName: 0,
  grade: 1,
  listNo: 2,
  rarity: null,
  imageUrl: 3,
  kecakPrice: 5,
};

function getColumnMapping(franchise: Franchise): ColumnMapping {
  return franchise === 'YU-GI-OH!' ? YUGIOH_COLS : POKEMON_ONEPIECE_COLS;
}

/** NFC 正規化 */
function normalize(s: string | undefined): string {
  return (s ?? '').normalize('NFC').trim();
}

/** 通貨文字列を数値に変換。無効な場合は null */
function parsePrice(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[¥￥$,、\s]/g, '');
  if (cleaned === '') return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export interface ParsedQuizCard {
  franchise: Franchise;
  card_name: string;
  grade: string | null;
  list_no: string | null;
  rarity: string | null;
  image_url: string | null;
  price: number;
}

/**
 * KECAK シート行データを quiz_card 用にパース
 * - ヘッダ行スキップ
 * - card_name が空 or 価格が 0 以下の行はスキップ（テスト問題として使えない）
 */
export function parseKecakRows(
  rows: string[][],
  franchise: Franchise,
): ParsedQuizCard[] {
  if (rows.length === 0) return [];

  const cols = getColumnMapping(franchise);
  const dataRows = rows.slice(1); // ヘッダスキップ

  return dataRows.reduce<ParsedQuizCard[]>((acc, row) => {
    const cardName = normalize(row[cols.cardName]);
    if (!cardName) return acc;

    const price = parsePrice(row[cols.kecakPrice]);
    if (!price || price <= 0) return acc;

    acc.push({
      franchise,
      card_name: cardName,
      grade: normalize(row[cols.grade]) || null,
      list_no: normalize(row[cols.listNo]) || null,
      rarity: cols.rarity !== null ? normalize(row[cols.rarity]) || null : null,
      image_url: normalize(row[cols.imageUrl]) || null,
      price,
    });
    return acc;
  }, []);
}

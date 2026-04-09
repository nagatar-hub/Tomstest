/**
 * Google Sheets API ユーティリティ（Haraka から移植・簡素化）
 */

import { fetchWithRetry, OAuthInvalidGrantError } from './fetch-with-retry';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

interface TokenSuccessResponse {
  access_token: string;
}

interface SheetValuesResponse {
  values?: string[][];
}

interface SheetErrorResponse {
  error: { code: number; message: string };
}

/**
 * refresh token → access token
 */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  }).toString();

  const response = await fetchWithRetry(
    GOOGLE_TOKEN_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
    { maxRetries: 3, timeoutMs: 15_000 },
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    const err = data as TokenErrorResponse;
    if (err.error === 'invalid_grant') {
      throw new OAuthInvalidGrantError(
        `OAuthトークンが失効しています。再認証が必要です: ${err.error}`,
      );
    }
    throw new Error(`アクセストークン取得失敗: ${err.error} — ${err.error_description ?? ''}`);
  }

  const tokenData = data as TokenSuccessResponse;
  if (!tokenData.access_token) {
    throw new Error('レスポンスに access_token が含まれていません');
  }
  return tokenData.access_token;
}

/**
 * スプレッドシートのセル値を取得
 */
export async function fetchSheetValues(params: {
  accessToken: string;
  spreadsheetId: string;
  range: string;
}): Promise<string[][]> {
  const encodedRange = encodeURIComponent(params.range);
  const url = `${GOOGLE_SHEETS_API_BASE}/${params.spreadsheetId}/values/${encodedRange}`;

  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${params.accessToken}` },
    },
    { maxRetries: 3, timeoutMs: 30_000 },
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    const err = data as SheetErrorResponse;
    throw new Error(
      `シート値取得失敗 (HTTP ${err.error.code}): ${err.error.message}`,
    );
  }

  return (data as SheetValuesResponse).values ?? [];
}

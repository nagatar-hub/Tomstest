/**
 * KECAK シート用 OAuth 認証（Haraka パターン簡素化版）
 *
 * このアプリでは KECAK シートのみ読むため、アカウントは1つだけ。
 */

import { refreshAccessToken } from './google-sheets';

export interface OAuthCredentials {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

function getCredentials(): OAuthCredentials {
  const refreshToken = process.env.KECAK_GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken?.trim()) throw new Error('KECAK_GOOGLE_REFRESH_TOKEN が未設定です');
  if (!clientId?.trim()) throw new Error('GOOGLE_CLIENT_ID が未設定です');
  if (!clientSecret?.trim()) throw new Error('GOOGLE_CLIENT_SECRET が未設定です');

  return { refreshToken, clientId, clientSecret };
}

export function getSpreadsheetId(): string {
  const id = process.env.KECAK_SPREADSHEET_ID;
  if (!id?.trim()) throw new Error('KECAK_SPREADSHEET_ID が未設定です');
  return id;
}

export async function getAccessToken(): Promise<string> {
  return refreshAccessToken(getCredentials());
}

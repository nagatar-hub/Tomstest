/**
 * リトライ・タイムアウト付き fetch（Haraka から移植）
 */

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

export class OAuthInvalidGrantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthInvalidGrantError';
  }
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('socket hang up') ||
      msg.includes('network') ||
      msg.includes('abort')
    ) {
      return true;
    }
  }
  return false;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {},
): Promise<Response> {
  const maxRetries = config.maxRetries ?? 3;
  const baseDelayMs = config.baseDelayMs ?? 1000;
  const timeoutMs = config.timeoutMs ?? 30_000;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
        const delay = baseDelayMs * 2 ** attempt;
        console.warn(
          `[fetchWithRetry] HTTP ${response.status} (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (isRetryableError(err) && attempt < maxRetries) {
        const delay = baseDelayMs * 2 ** attempt;
        console.warn(
          `[fetchWithRetry] Network error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`,
        );
        await sleep(delay);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('fetchWithRetry: unexpected end of retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

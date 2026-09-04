export const importStaleTimeoutMs = Number(process.env.IMPORT_STALE_TIMEOUT_MS ?? 300_000);
export const importMaxAttempts = Number(process.env.IMPORT_MAX_ATTEMPTS ?? 3);
export const importRetryBaseMs = Number(process.env.IMPORT_RETRY_BASE_MS ?? 1_000);

export function retryDelayMs(attempt: number) {
  return importRetryBaseMs * (2 ** Math.max(0, attempt - 1));
}

export function isRetryable(error: unknown) {
  return error instanceof Error && !/ambiguous|invalid|missing|formula|mapping/i.test(error.message);
}

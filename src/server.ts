import { MTCAPTCHA_TOKEN_FIELDS, readVerifiedToken } from './read-token.ts';
import type { MTCaptchaVerifyResult, VerifyMTCaptchaOptions } from './types';

const CHECKTOKEN_URL = 'https://service.mtcaptcha.com/mtcv1/api/checktoken';
const CHECKTOKEN_EXPLICIT_ACL_URL = 'https://service2.mtcaptcha.com/mtcv1/api/checktoken';

export { MTCAPTCHA_TOKEN_FIELDS, readVerifiedToken };
export type { MTCaptchaVerifyResult, VerifyMTCaptchaOptions };

function assertServerContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'MTCaptcha server helpers must run on the server. Import them from "svelte-mtcaptcha/server" in your API route or backend handler.',
    );
  }
}

function failed(codes: string[]): MTCaptchaVerifyResult {
  return { success: false, fail_codes: codes };
}

function isBoundedInteger(value: number | undefined, max: number): boolean {
  if (value == null) return true;
  return Number.isInteger(value) && value >= 1 && value <= max;
}

/**
 * Checks a verified token with the MTCaptcha CheckToken API.
 * The private key never leaves the server.
 */
export async function verifyMTCaptchaToken(
  options: VerifyMTCaptchaOptions,
): Promise<MTCaptchaVerifyResult> {
  assertServerContext();

  const privateKey = options.privateKey?.trim() ?? '';
  const token = options.token?.trim() ?? '';
  const missing: string[] = [];
  if (!privateKey) missing.push('missing-input-privatekey');
  if (!token) missing.push('missing-input-token');
  if (missing.length > 0) return failed(missing);

  if (!isBoundedInteger(options.tokenExpireMiniSec, 1200)) {
    return failed(['bad-request']);
  }
  if (!isBoundedInteger(options.tokenDuplicateCallMaxCount, 20)) {
    return failed(['bad-request']);
  }

  const url = new URL(options.explicitAcl ? CHECKTOKEN_EXPLICIT_ACL_URL : CHECKTOKEN_URL);
  url.searchParams.set('privatekey', privateKey);
  url.searchParams.set('token', token);
  if (options.tokenExpireMiniSec != null) {
    url.searchParams.set('tokenExpireMiniSec', String(options.tokenExpireMiniSec));
  }
  if (options.tokenDuplicateCallMaxCount != null) {
    url.searchParams.set('tokenDuplicateCallMaxCount', String(options.tokenDuplicateCallMaxCount));
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'error',
    });
    if (!response.ok) return failed(['bad-request']);
    return (await response.json()) as MTCaptchaVerifyResult;
  } catch {
    return failed(['bad-request']);
  }
}

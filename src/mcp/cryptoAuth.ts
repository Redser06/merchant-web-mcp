/**
 * Cryptographic Authentication & HMAC Signing for Merchant Web MCP Checkout Sessions.
 * Uses the standard Web Crypto API (SubtleCrypto) for genuine SHA-256 HMAC tokens.
 */

export interface CheckoutSignaturePayload {
  cartId: string;
  total: number;
  currency: string;
  expiresAt: number; // Unix epoch ms
}

export interface SignedCheckoutResult {
  cartId: string;
  total: number;
  currency: string;
  expiresAt: number;
  signatureHex: string;
  canonicalMessage: string;
  checkoutUrl: string;
  isVerified: boolean;
}

/** Node, Bun, and Workers. Vite client bundles must use the VITE_ prefixed name. */
export const HMAC_SECRET_ENV = 'MERCHANT_HMAC_SECRET';
export const HMAC_SECRET_VITE_ENV = 'VITE_MERCHANT_HMAC_SECRET';

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function readProcessEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return nonEmpty(proc?.env?.[name]);
}

function readViteEnv(): string | undefined {
  // Vite only inlines static import.meta.env.VITE_* access into the client bundle.
  try {
    return nonEmpty(import.meta.env.VITE_MERCHANT_HMAC_SECRET);
  } catch {
    return undefined;
  }
}

/**
 * Explicit secret wins. Otherwise the env var is required; there is no built-in default.
 */
export function resolveHmacSecret(secretKey?: string): string {
  const provided = nonEmpty(secretKey);
  if (provided) return provided;

  const fromEnv = readProcessEnv(HMAC_SECRET_ENV)
    ?? readProcessEnv(HMAC_SECRET_VITE_ENV)
    ?? readViteEnv();

  if (!fromEnv) {
    throw new Error(
      `HMAC secret is unset. Set the ${HMAC_SECRET_ENV} environment variable (Vite client: ${HMAC_SECRET_VITE_ENV}) before signing or verifying a checkout session.`
    );
  }

  return fromEnv;
}

/**
 * Generates a real cryptographic HMAC-SHA256 signature for a checkout session.
 */
export async function signCheckoutSession(
  payload: CheckoutSignaturePayload,
  secretKey?: string,
  baseUrl: string = 'https://trailco.co.uk/checkout'
): Promise<SignedCheckoutResult> {
  const resolvedSecret = resolveHmacSecret(secretKey);
  const encoder = new TextEncoder();
  const canonicalMessage = `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(resolvedSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(canonicalMessage)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const checkoutUrl = `${baseUrl}?session=${encodeURIComponent(payload.cartId)}&amount=${payload.total.toFixed(2)}&currency=${payload.currency}&exp=${payload.expiresAt}&sig=${signatureHex}`;

  return {
    cartId: payload.cartId,
    total: payload.total,
    currency: payload.currency,
    expiresAt: payload.expiresAt,
    signatureHex,
    canonicalMessage,
    checkoutUrl,
    isVerified: true
  };
}

/**
 * Verifies that a signature matches the payload parameters.
 */
export async function verifyCheckoutSignature(
  payload: CheckoutSignaturePayload,
  signatureHex: string,
  secretKey?: string
): Promise<boolean> {
  const resolvedSecret = resolveHmacSecret(secretKey);
  try {
    const encoder = new TextEncoder();
    const canonicalMessage = `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(resolvedSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert hex string back to Uint8Array
    const match = signatureHex.match(/.{1,2}/g);
    if (!match) return false;
    const signatureBytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));

    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      encoder.encode(canonicalMessage)
    );
  } catch {
    return false;
  }
}

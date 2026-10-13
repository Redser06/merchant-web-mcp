/**
 * Server-side HMAC-SHA256 for checkout sessions.
 * Callers pass the Worker secret. This module never reads client env.
 */

export const HMAC_SECRET_ENV = 'MERCHANT_HMAC_SECRET';

export interface CheckoutSignaturePayload {
  cartId: string;
  total: number;
  currency: string;
  expiresAt: number;
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

function canonicalMessage(payload: CheckoutSignaturePayload): string {
  return `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;
}

function requireHmacSecret(secret: string | undefined): string {
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new Error(
      `HMAC secret is unset. Set the ${HMAC_SECRET_ENV} Worker secret before signing a checkout session.`
    );
  }
  return secret;
}

async function importKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  );
}

export async function signCheckoutSession(
  payload: CheckoutSignaturePayload,
  secret: string | undefined,
  baseUrl: string = 'https://trailco.co.uk/checkout'
): Promise<SignedCheckoutResult> {
  const resolvedSecret = requireHmacSecret(secret);
  const message = canonicalMessage(payload);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    await importKey(resolvedSecret, ['sign']),
    new TextEncoder().encode(message)
  );
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const checkoutUrl = `${baseUrl}?session=${encodeURIComponent(payload.cartId)}&amount=${payload.total.toFixed(2)}&currency=${payload.currency}&exp=${payload.expiresAt}&sig=${signatureHex}`;

  return {
    cartId: payload.cartId,
    total: payload.total,
    currency: payload.currency,
    expiresAt: payload.expiresAt,
    signatureHex,
    canonicalMessage: message,
    checkoutUrl,
    isVerified: true,
  };
}

/**
 * Returns false when the secret is unset or the signature does not match.
 * An unset secret is logged and does not throw.
 */
export async function verifyCheckoutSignature(
  payload: CheckoutSignaturePayload,
  signatureHex: string,
  secret: string | undefined
): Promise<boolean> {
  if (typeof secret !== 'string' || secret.trim() === '') {
    console.error(
      `HMAC secret is unset. Set the ${HMAC_SECRET_ENV} Worker secret before verifying a checkout session.`
    );
    return false;
  }

  try {
    const match = signatureHex.match(/.{1,2}/g);
    if (!match || match.length !== 32) return false;
    const signatureBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
    return await crypto.subtle.verify(
      'HMAC',
      await importKey(secret, ['verify']),
      signatureBytes,
      new TextEncoder().encode(canonicalMessage(payload))
    );
  } catch {
    return false;
  }
}

export async function createWorkerCheckout(
  secret: string | undefined,
  payload: CheckoutSignaturePayload,
  baseUrl?: string
): Promise<SignedCheckoutResult> {
  const signed = await signCheckoutSession(payload, secret, baseUrl);
  const isVerified = await verifyCheckoutSignature(payload, signed.signatureHex, secret);
  return { ...signed, isVerified };
}

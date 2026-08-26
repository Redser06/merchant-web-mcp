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

const DEFAULT_DEMO_SECRET = 'demo_secret_apex_merchant_mcp_hmac_sha256_key_2026';

/**
 * Generates a real cryptographic HMAC-SHA256 signature for a checkout session.
 */
export async function signCheckoutSession(
  payload: CheckoutSignaturePayload,
  secretKey: string = DEFAULT_DEMO_SECRET,
  baseUrl: string = 'https://trailco.co.uk/checkout'
): Promise<SignedCheckoutResult> {
  const encoder = new TextEncoder();
  const canonicalMessage = `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
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
  secretKey: string = DEFAULT_DEMO_SECRET
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const canonicalMessage = `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
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

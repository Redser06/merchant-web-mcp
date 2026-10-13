/** Cockpit handoff. This is not a signature and uses no secret. */

export const DEMO_ONLY_SIGNATURE = 'DEMO ONLY - not signed';

export interface DemoCheckoutPayload {
  cartId: string;
  total: number;
  currency: string;
  expiresAt: number;
}

export interface DemoCheckoutResult {
  cartId: string;
  total: number;
  currency: string;
  expiresAt: number;
  signature: string;
  canonicalMessage: string;
  checkoutUrl: string;
  isVerified: false;
}

export function demoSignCheckout(
  payload: DemoCheckoutPayload,
  baseUrl: string = 'https://trailco.co.uk/checkout'
): DemoCheckoutResult {
  const canonicalMessage = `cart_id:${payload.cartId}|total:${payload.total.toFixed(2)}|currency:${payload.currency}|exp:${payload.expiresAt}`;
  const checkoutUrl = `${baseUrl}?session=${encodeURIComponent(payload.cartId)}&amount=${payload.total.toFixed(2)}&currency=${payload.currency}&exp=${payload.expiresAt}&sig=${encodeURIComponent(DEMO_ONLY_SIGNATURE)}`;

  return {
    cartId: payload.cartId,
    total: payload.total,
    currency: payload.currency,
    expiresAt: payload.expiresAt,
    signature: DEMO_ONLY_SIGNATURE,
    canonicalMessage,
    checkoutUrl,
    isVerified: false,
  };
}

import { describe, expect, it } from 'bun:test';
import {
  createWorkerCheckout,
  signCheckoutSession,
  verifyCheckoutSignature,
} from '../server-examples/checkoutHmac';

const payload = {
  cartId: 'cart_worker',
  total: 89,
  currency: 'GBP',
  expiresAt: 1_700_000_000_000,
};

describe('worker checkout HMAC', () => {
  it('signs and verifies with the worker secret', async () => {
    const secret = 'worker-test-hmac-key';
    const signed = await createWorkerCheckout(secret, payload);

    expect(signed.isVerified).toBe(true);
    expect(signed.signatureHex).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyCheckoutSignature(payload, signed.signatureHex, secret)).toBe(true);
    expect(await verifyCheckoutSignature({ ...payload, total: 1 }, signed.signatureHex, secret)).toBe(false);
  });

  it('fails closed when the worker HMAC secret is unset', async () => {
    await expect(signCheckoutSession(payload, undefined)).rejects.toThrow(/MERCHANT_HMAC_SECRET/);
    await expect(signCheckoutSession(payload, '   ')).rejects.toThrow(/HMAC secret is unset/);

    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };
    try {
      expect(await verifyCheckoutSignature(payload, 'ab', undefined)).toBe(false);
      expect(await verifyCheckoutSignature(payload, 'ab', '   ')).toBe(false);
    } finally {
      console.error = original;
    }

    expect(errors.join(' ')).toContain('MERCHANT_HMAC_SECRET');
  });
});

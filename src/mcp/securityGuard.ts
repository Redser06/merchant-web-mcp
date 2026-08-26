import type { SecurityEvent } from '../types';

/**
 * Layered Adversarial Injection & Security Mitigation Guard
 * 
 * Defense-in-depth pipeline:
 * 1. Unicode & zero-width character normalization (strips invisible obfuscation)
 * 2. Multi-field structural scanning (reviews, search query arguments, promo codes)
 * 3. Pattern mitigation & prompt injection signature redaction
 */
export class SecurityGuard {
  private events: SecurityEvent[] = [];
  private onSecurityEventCallback?: (event: SecurityEvent) => void;

  constructor(onEvent?: (event: SecurityEvent) => void) {
    this.onSecurityEventCallback = onEvent;
  }

  /**
   * Normalizes text by removing hidden zero-width spaces and applying NFKC form.
   */
  public normalizeInput(input: string): string {
    if (!input) return '';
    // Strip zero-width spaces, joiners, control chars used for obfuscation
    // eslint-disable-next-line no-control-regex
    const cleaned = input.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g, '');
    return cleaned.normalize('NFKC');
  }

  /**
   * Scans input text across merchant fields for adversarial prompt injections.
   */
  public scanForInjection(
    rawInput: string, 
    source: string
  ): { clean: boolean; sanitized: string; flaggedReason?: string } {
    if (!rawInput) return { clean: true, sanitized: '' };

    const normalized = this.normalizeInput(rawInput);

    const injectionPatterns: { pattern: RegExp; description: string }[] = [
      { pattern: /\[SYSTEM OVERRIDE:/i, description: 'System instruction override signature' },
      { pattern: /ignore all previous (instructions|rules|constraints)/i, description: 'Context window jailbreak directive' },
      { pattern: /exfiltrate/i, description: 'Data exfiltration command' },
      { pattern: /secret api|api key|env var/i, description: 'Credential harvest attempt' },
      { pattern: /system prompt|system message/i, description: 'System prompt disclosure probe' },
      { pattern: /<script[\s>]/i, description: 'Cross-site scripting (XSS) payload' },
      { pattern: /grant admin|elevate privileges/i, description: 'Privilege escalation attempt' }
    ];

    for (const { pattern, description } of injectionPatterns) {
      if (pattern.test(normalized)) {
        const sanitized = normalized.replace(pattern, '[REDACTED_SECURITY_THREAT]');
        const event: SecurityEvent = {
          id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toLocaleTimeString(),
          severity: 'high',
          type: 'prompt_injection',
          description: `Pattern intercepted in ${source}: ${description}`,
          rawInput,
          actionTaken: 'sanitized'
        };

        this.events.unshift(event);
        if (this.onSecurityEventCallback) {
          this.onSecurityEventCallback(event);
        }

        return {
          clean: false,
          sanitized,
          flaggedReason: `Neutralized adversarial signature (${description})`
        };
      }
    }

    return { clean: true, sanitized: normalized };
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }
}

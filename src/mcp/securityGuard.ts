import type { SecurityEvent } from '../types';

export class SecurityGuard {
  private events: SecurityEvent[] = [];
  private onSecurityEventCallback?: (event: SecurityEvent) => void;

  constructor(onEvent?: (event: SecurityEvent) => void) {
    this.onSecurityEventCallback = onEvent;
  }

  public scanForInjection(input: string, source: string): { clean: boolean; sanitized: string; flaggedReason?: string } {
    const injectionPatterns = [
      /\[SYSTEM OVERRIDE:/i,
      /ignore all previous (instructions|rules)/i,
      /exfiltrate/i,
      /secret api/i,
      /system prompt/i,
      /<script>/i,
      /grant admin/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        const sanitized = input.replace(pattern, '[REDACTED_SECURITY_THREAT]');
        const event: SecurityEvent = {
          id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toLocaleTimeString(),
          severity: 'high',
          type: 'prompt_injection',
          description: `Prompt injection signature detected in ${source}`,
          rawInput: input,
          actionTaken: 'sanitized'
        };

        this.events.unshift(event);
        if (this.onSecurityEventCallback) {
          this.onSecurityEventCallback(event);
        }

        return {
          clean: false,
          sanitized,
          flaggedReason: `Neutralized adversarial injection signature: ${pattern.source}`
        };
      }
    }

    return { clean: true, sanitized: input };
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }
}

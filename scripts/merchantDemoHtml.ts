import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Single source for the projector demo. Dev and build publish the paths below. */
export const DEMO_HTML_SOURCE = 'demos/merchant-web-mcp-demo-v2.html';

export const DEMO_HTML_PUBLISH_PATHS = [
  'demos/merchant-web-mcp-demo-v2.html',
  'merchant-web-mcp-demo-v2.html',
] as const;

export function merchantDemoHtmlPath(repoRoot: string): string {
  return resolve(repoRoot, DEMO_HTML_SOURCE);
}

export function readMerchantDemoHtml(repoRoot: string): Buffer {
  return readFileSync(merchantDemoHtmlPath(repoRoot));
}

/** Returns the publish-relative path when the request targets a demo URL. */
export function demoRequestPath(url: string | undefined): string | null {
  if (!url) return null;
  const pathname = url.split('?')[0]?.split('#')[0] ?? '';
  const rel = pathname.replace(/^\/+/, '');
  return (DEMO_HTML_PUBLISH_PATHS as readonly string[]).includes(rel) ? rel : null;
}

/** Copies the single demo source onto each public path inside outDir. */
export function publishMerchantDemoHtml(outDir: string, repoRoot: string): string[] {
  const source = merchantDemoHtmlPath(repoRoot);
  const written: string[] = [];
  for (const rel of DEMO_HTML_PUBLISH_PATHS) {
    const dest = resolve(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(source, dest);
    written.push(dest);
  }
  return written;
}

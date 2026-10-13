import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  DEMO_HTML_PUBLISH_PATHS,
  DEMO_HTML_SOURCE,
  demoRequestPath,
  publishMerchantDemoHtml,
} from '../scripts/merchantDemoHtml';

const repoRoot = join(import.meta.dir, '..');

function findDemoHtmlFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findDemoHtmlFiles(full, found);
    else if (entry.name === 'merchant-web-mcp-demo-v2.html') found.push(full);
  }
  return found;
}

describe('merchant demo HTML source', () => {
  it('keeps a single demo HTML source and publishes it from the Vite build', () => {
    const copies = findDemoHtmlFiles(repoRoot).map((file) => relative(repoRoot, file));
    expect(copies).toEqual([DEMO_HTML_SOURCE]);
    expect(existsSync(join(repoRoot, 'public/demos/merchant-web-mcp-demo-v2.html'))).toBe(false);
    expect(existsSync(join(repoRoot, 'public/merchant-web-mcp-demo-v2.html'))).toBe(false);

    const viteConfig = readFileSync(join(repoRoot, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('publishMerchantDemoHtml');
    expect(viteConfig).toContain('configureServer');
    expect(viteConfig).toContain('configurePreviewServer');

    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    expect(readme).toContain(DEMO_HTML_SOURCE);
    expect(readme).not.toContain('public/demos/merchant-web-mcp-demo-v2.html');
    expect(readme).not.toContain('public/merchant-web-mcp-demo-v2.html');

    const outDir = mkdtempSync(join(tmpdir(), 'merchant-demo-'));
    try {
      const written = publishMerchantDemoHtml(outDir, repoRoot);
      const source = readFileSync(join(repoRoot, DEMO_HTML_SOURCE));
      expect(written).toHaveLength(DEMO_HTML_PUBLISH_PATHS.length);
      for (const rel of DEMO_HTML_PUBLISH_PATHS) {
        expect(readFileSync(join(outDir, rel)).equals(source)).toBe(true);
      }
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves the published demo paths from the single source', () => {
    expect(demoRequestPath('/demos/merchant-web-mcp-demo-v2.html')).toBe(
      'demos/merchant-web-mcp-demo-v2.html',
    );
    expect(demoRequestPath('/merchant-web-mcp-demo-v2.html?slide=1#deck')).toBe(
      'merchant-web-mcp-demo-v2.html',
    );
    expect(demoRequestPath('/index.html')).toBeNull();
    expect(demoRequestPath(undefined)).toBeNull();
  });
});

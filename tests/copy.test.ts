import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

function visible(html: string): string {
  return html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ');
}

describe('visible copy', () => {
  for (const f of htmlFiles('dist')) {
    const text = visible(readFileSync(f, 'utf8'));
    it(`${f} has no dashes, exclamation marks or the plain spelling`, () => {
      expect(text).not.toMatch(/[—–]/);
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\bMoyi\b/);
    });
  }

  for (const f of htmlFiles('dist')) {
    const html = readFileSync(f, 'utf8');
    const values = [...html.matchAll(/\s(?:aria-label|alt|data-label-[a-z]+)="([^"]*)"/g)].map((m) => m[1]!);
    it(`${f} has clean aria-label, alt and data-label values`, () => {
      for (const v of values) {
        expect(v).not.toMatch(/[—–]/);
        expect(v).not.toContain('!');
        expect(v).not.toMatch(/\bMoyi\b/);
      }
    });
  }

  it('functional page headings', () => {
    expect(readFileSync('dist/verify.html', 'utf8')).toContain('Confirm your email');
    expect(readFileSync('dist/invite.html', 'utf8')).toContain('You&#39;re invited to a bond on Mọyì');
    expect(readFileSync('dist/reset-password.html', 'utf8')).toContain('Choose a new password');
  });
});

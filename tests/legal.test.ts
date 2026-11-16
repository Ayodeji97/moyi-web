// The legal and help pages (slice 4). The text is DRAFT until the owner approves it; these tests pin
// the facts it states against what the backend does (scratchpad legal-facts, 2026-11-16), so a later
// edit cannot quietly drift one page away from another.
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const LEGAL = ['privacy', 'terms', 'data-processing'] as const;
const HELP = ['support', 'delete-account'] as const;
const doc = (p: string) => new JSDOM(readFileSync(`dist/${p}.html`, 'utf8')).window.document;
const text = (p: string) => doc(p).querySelector('main')!.textContent!.replace(/\s+/g, ' ');

describe('legal and help pages', () => {
  for (const p of [...LEGAL, ...HELP]) {
    it(`/${p}: one h1, the DRAFT notice, the shared chrome, and the contact address`, () => {
      const d = doc(p);
      expect(d.querySelectorAll('h1')).toHaveLength(1);
      expect(d.querySelector('[data-draft]')!.textContent).toMatch(/^Draft\./);
      expect(d.querySelector('header.topbar')).not.toBeNull();
      expect(d.querySelector('footer.foot')).not.toBeNull();
      expect(d.querySelector('main a[href="mailto:hello@getmoyi.app"]')).not.toBeNull();
      expect(d.querySelector('script')).toBeNull();
    });
  }

  it('legal pages carry the version the backend records until approval, help pages none', () => {
    for (const p of LEGAL) expect(doc(p).querySelector('[data-version]')!.textContent).toBe('unpublished');
    for (const p of HELP) expect(doc(p).querySelector('[data-version]')).toBeNull();
  });

  it('every internal link on them leads to a built page', () => {
    for (const p of [...LEGAL, ...HELP]) {
      for (const a of doc(p).querySelectorAll('a[href^="/"]')) {
        const path = a.getAttribute('href')!.split('#')[0]!;
        const file = path === '/' ? 'dist/index.html' : `dist${path}.html`;
        expect(existsSync(file), `${p} links ${path}`).toBe(true);
      }
    }
  });

  it('privacy says plainly that entries are not end to end encrypted, and so does the summary', () => {
    expect(text('privacy')).toContain('not end to end encrypted');
    expect(text('data-processing')).toContain('not end to end encrypted');
  });

  it('privacy and the summary name the same processors', () => {
    const names = (p: string) => [...doc(p).querySelectorAll('main table')][0]!.querySelectorAll('tbody tr td:first-child');
    const list = (p: string) => [...names(p)].map((td) => td.textContent!.trim());
    expect(list('privacy')).toEqual(['Hetzner Online', 'Cloudflare', 'Resend', 'Google Firebase Cloud Messaging', 'Apple Push Notification service', 'Amazon Web Services']);
    expect(list('data-processing')).toEqual(list('privacy'));
  });

  it('every page that gives the backup window says 35 days', () => {
    for (const p of ['privacy', 'terms', 'data-processing', 'delete-account']) {
      const t = text(p);
      expect(t, p).toMatch(/35 days/);
      for (const sentence of t.split(/(?<=[.:])\s/)) {
        if (/backup/i.test(sentence)) expect(sentence, p).not.toMatch(/\b30 days\b/);
      }
    }
  });

  it('the reveal rule is stated as built: both written, a reveal time, or the day ending', () => {
    for (const p of ['privacy', 'terms']) {
      expect(text(p), p).toContain('at your reveal time if you set one');
      expect(text(p), p).toContain('when the day ends');
    }
  });

  it('staff access names the legal exception wherever it is stated', () => {
    for (const p of ['privacy', 'terms', 'data-processing']) expect(text(p), p).toContain('or when the law requires it');
  });

  it('privacy and terms name the controller, with no placeholder left', () => {
    for (const p of ['privacy', 'terms']) {
      expect(text(p), p).toContain('Daniel Ogunleye');
      expect(text(p), p).toContain('Rua de Pinto Bessa 471');
    }
    for (const p of [...LEGAL, ...HELP]) expect(text(p), p).not.toMatch(/\[[a-z' ,]+\]/i);
  });

  it('the CNPD is named as the authority', () => {
    expect(text('privacy')).toContain('the CNPD');
  });

  it('photo checks are disclosed as on from 1 December 2026 (owner ruling), voice notes as unchecked', () => {
    const t = text('privacy');
    expect(t).toContain('Amazon Rekognition, in Frankfurt');
    expect(t).toContain('held back until a person has looked at it');
    expect(t).toContain('Voice notes are not checked automatically');
  });

  it('retention and reply time match the owner rulings (2026-11-16)', () => {
    expect(text('privacy')).toContain('2 years');
    expect(text('privacy')).toContain('90 days');
    expect(text('privacy')).toContain('We answer within 14 days');
    expect(text('privacy')).not.toContain('one month');
    expect(text('delete-account')).toContain('for 2 years');
    expect(text('data-processing')).toMatch(/Safety records without content\s*2 years/);
  });

  it('terms cover the age floor and the governing law', () => {
    expect(text('terms')).toContain('18 or over');
    expect(text('terms')).toContain('law of Portugal');
  });

  it('deletion: 14 days in the app, the exact button words, and an email route', () => {
    const t = text('delete-account');
    expect(t).toContain('14 days later');
    for (const w of ['Delete your account', 'Delete my account', 'Keep my account', 'Export your archive first']) expect(t).toContain(w);
    expect(t).toContain('Delete my account');
  });

  it('nothing promises what is not built: no "close the box", no services that are not used', () => {
    for (const p of [...LEGAL, ...HELP]) {
      const t = text(p);
      expect(t).not.toMatch(/close the box/i);
      expect(t).not.toMatch(/Sentry|Grafana|OpenAI|Voyage/);
    }
  });

  it('on phones the table headers stay readable to screen readers (hidden visually, never display: none)', () => {
    const css = readFileSync('src/styles/doc.css', 'utf8');
    expect(css).not.toMatch(/thead \{ display: none/);
    expect(css).toMatch(/\.doc__body thead \{ position: absolute;[^}]*clip-path: inset\(50%\)/);
  });
});

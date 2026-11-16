// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { tidyMenu } from '../src/scripts/menu';

const LINKS = [['How it works', '#how'], ['Privacy', '/privacy'], ['FAQs', '/faq'], ['Support', '/support']];
const page = (p: string) => new JSDOM(readFileSync(p, 'utf8')).window.document;

describe('the phone menu, as built', () => {
  for (const [file, how] of [['dist/index.html', '#how'], ['dist/faq.html', '/#how']] as const) {
    it(`${file}: a labelled toggle holding the same four links as the nav`, () => {
      const doc = page(file);
      const menu = doc.querySelector('header.topbar details.menu')!;
      expect(menu).not.toBeNull();
      expect(menu.hasAttribute('open')).toBe(false);
      expect(menu.querySelector('summary')!.getAttribute('aria-label')).toBe('Menu');
      const want = LINKS.map(([t, h]) => [t, h === '#how' ? how : h]);
      const got = (sel: string) => [...doc.querySelectorAll(sel)].map((a) => [a.textContent!.trim(), a.getAttribute('href')]);
      expect(got('.menu__panel a')).toEqual(want);
      expect(got('header.topbar > nav a')).toEqual(want);
    });
  }
  it('is hidden above 699px and the centred nav hidden below it', () => {
    const css = readFileSync('src/styles/home.css', 'utf8');
    expect(css).toMatch(/^\.menu \{ display: none; \}/m);
    const phone = css.slice(css.indexOf('@media (max-width: 699px) {\n  .wrap'));
    expect(phone).toMatch(/\.topbar > nav \{ display: none; \}/);
    expect(phone).toMatch(/\.menu \{ display: block;/);
    expect(phone).toMatch(/\.menu summary \{[^}]*width: 48px; height: 48px;/);
  });
});

describe('tidyMenu', () => {
  const mount = () => {
    document.body.innerHTML = '<header class="topbar"><details class="menu" open><summary aria-label="Menu"></summary><nav class="menu__panel"><a href="#how">How it works</a></nav></details></header><main><p id="out">text</p></main>';
    const menu = document.querySelector<HTMLDetailsElement>('details.menu')!;
    return { menu, stop: tidyMenu(document) };
  };
  it('closes when a link in it is followed', () => {
    const { menu } = mount();
    menu.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(menu.open).toBe(false);
  });
  it('closes on Escape and returns focus to the toggle', () => {
    const { menu } = mount();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(menu.querySelector('summary'));
  });
  it('closes on a tap outside, not on a tap inside', () => {
    const { menu } = mount();
    menu.querySelector('nav')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(true);
    document.getElementById('out')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(false);
  });
  it('stop removes every listener', () => {
    const { menu, stop } = mount();
    stop();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.open).toBe(true);
  });
});

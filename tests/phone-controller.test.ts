import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Phone from '../src/components/Phone.astro';
import { phoneController } from '../src/scripts/evening/phone';
import type { View } from '../src/scripts/evening/timeline';

async function mount(view: View) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Phone, { props: { view } });
  const dom = new JSDOM(`<body>${html}</body>`);
  const root = dom.window.document.querySelector<HTMLElement>('[data-phone]')!;
  return { root, doc: dom.window.document };
}

const shown = (root: HTMLElement) =>
  [...root.querySelectorAll('.v')].filter((v) => !v.hasAttribute('hidden')).map((v) => v.getAttribute('data-view'));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('phoneController', () => {
  it('starts on the unhidden view', async () => {
    const { root } = await mount('write');
    expect(phoneController(root).view).toBe('write');
  });

  it('never shows two views while swapping, and ends on the target with its label', async () => {
    const { root } = await mount('write');
    const c = phoneController(root);
    c.set('wait');
    for (let t = 0; t <= 400; t += 10) {
      expect(shown(root).length).toBeLessThanOrEqual(1);
      vi.advanceTimersByTime(10);
    }
    expect(shown(root)).toEqual(['wait']);
    expect(root.getAttribute('aria-label')).toBe(root.dataset.labelWait);
    expect(root.querySelector('.is-in, .is-out')).toBeNull();
    expect(c.view).toBe('wait');
  });

  it('keeps the old view in place until the swap time, marked is-out', async () => {
    const { root } = await mount('write');
    phoneController(root).set('wait');
    expect(shown(root)).toEqual(['write']);
    expect(root.querySelector('[data-view="write"]')!.classList.contains('is-out')).toBe(true);
  });

  it('settles at once when set is called mid-swap', async () => {
    const { root } = await mount('write');
    const c = phoneController(root);
    c.set('today');
    vi.advanceTimersByTime(50);
    c.set('reveal');
    for (let t = 0; t <= 600; t += 10) {
      expect(shown(root).length).toBeLessThanOrEqual(1);
      vi.advanceTimersByTime(10);
    }
    expect(shown(root)).toEqual(['reveal']);
    expect(root.querySelector('.is-in, .is-out')).toBeNull();
    expect(root.getAttribute('aria-label')).toBe(root.dataset.labelReveal);
  });

  it('set with the current view does nothing', async () => {
    const { root } = await mount('write');
    phoneController(root).set('write');
    expect(root.querySelector('.is-out')).toBeNull();
    expect(shown(root)).toEqual(['write']);
  });

  it('types the sentence from data-mine', async () => {
    const { root } = await mount('write');
    const c = phoneController(root);
    const mine = root.dataset.mine!;
    const el = root.querySelector('[data-typed]')!;
    c.typed(0.5);
    expect(el.textContent).toBe(mine.slice(0, Math.round(mine.length / 2)));
    c.typed(0);
    expect(el.textContent).toBe('');
    c.typed(1);
    expect(el.textContent).toBe(mine);
    c.typed(1.4);
    expect(el.textContent).toBe(mine);
  });

  it('toggles Sending', async () => {
    const { root } = await mount('write');
    const c = phoneController(root);
    const b = root.querySelector('[data-send]')!;
    c.busy(true);
    expect(b.textContent).toBe('Sending');
    c.busy(false);
    expect(b.textContent).toBe('Send');
  });

  it('sets the clock', async () => {
    const { root } = await mount('today');
    phoneController(root).time('7:05');
    expect(root.querySelector('.clock')!.textContent).toBe('7:05');
  });

  it('fades the cards through CSSOM', async () => {
    const { root } = await mount('reveal');
    phoneController(root).cards(1, 0);
    const [c0, c1] = [0, 1].map((i) => root.querySelector<HTMLElement>(`[data-card="${i}"]`)!);
    expect(c0.style.opacity).toBe('1');
    expect(c1.style.opacity).toBe('0');
    expect(c1.style.transform).toBe('translateY(14px)');
    expect(c0.style.transform).toBe('translateY(0px)');
  });
});

describe('phone.css scoping', () => {
  const css = readFileSync('src/styles/phone.css', 'utf8');
  it('has no top-level short-class selectors', () => {
    expect(css).not.toMatch(/^\s*\.(v|st|lb|en|an|gr|pa|ec)\b/m);
  });
  it('keeps the hidden rule and fade classes', () => {
    expect(/\.dev \.v\[hidden\]\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/display:\s*none/);
    expect(css).toMatch(/\.dev \.v\.is-out[^{]*\{\s*opacity:\s*0/);
    expect(css).toMatch(/transition:\s*opacity 160ms/);
  });
});

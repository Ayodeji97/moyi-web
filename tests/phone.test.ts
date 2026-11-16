import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import Phone from '../src/components/Phone.astro';

type View = 'today' | 'write' | 'wait' | 'reveal';

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Phone, { props });
  return new JSDOM(html).window.document;
}

// The app's own strings, from docs/web-screens (the dark iPhone captures).
const PROMPT = 'What do they do that you have stopped noticing, and are glad of?';
const MINE = "You waited up so I wouldn't walk home alone.";
const THEIRS = 'You made tea before I asked.';
const WAITING = "Yours is saved. When Tunde writes theirs, you'll both see each other's.";
const labels: Record<View, string> = {
  today: `The Mọyì app. Today, not yet written. ${PROMPT}`,
  write: `The Mọyì app. Writing: ${MINE}`,
  wait: `The Mọyì app. Written. ${WAITING}`,
  reveal: `The Mọyì app. You both wrote today. From Tunde: ${THEIRS} From you: ${MINE}`,
};
const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('Phone', () => {
  for (const view of Object.keys(labels) as View[]) {
    it(`view "${view}": one visible view, role and label`, async () => {
      const doc = await render({ view });
      const all = [...doc.querySelectorAll('.v')];
      expect(all.map((v) => v.getAttribute('data-view'))).toEqual(['today', 'write', 'wait', 'reveal']);
      const shown = all.filter((v) => !v.hasAttribute('hidden'));
      expect(shown).toHaveLength(1);
      expect(shown[0].getAttribute('data-view')).toBe(view);
      const root = doc.querySelector('.dev')!;
      expect(root.getAttribute('role')).toBe('img');
      expect(root.getAttribute('aria-label')).toBe(labels[view]);
      expect(root.classList.contains('dev--centre')).toBe(true);
    });
  }

  it("carries the app's real copy in each view", async () => {
    const doc = await render({ view: 'today' });
    const v = (name: View) => doc.querySelector(`.v[data-view="${name}"]`)!;
    expect(text(v('today').querySelector('.dt'))).toBe('Monday · 16 November');
    expect(text(v('today').querySelector('.pr'))).toBe(PROMPT);
    expect(text(v('today').querySelector('.pa'))).toBe('Write');
    expect(text(v('write').querySelector('.cn'))).toBe('Cancel');
    expect(text(v('write').querySelector('.cq'))).toBe(PROMPT);
    expect(text(v('write').querySelector('[data-send]'))).toBe('Send');
    expect(text(v('wait').querySelector('.lb'))).toBe('From you');
    expect(text(v('wait').querySelector('.wr'))).toBe('Written.');
    expect(text(v('wait').querySelector('.st'))).toBe(WAITING);
    expect(text(v('reveal').querySelector('.wr'))).toBe('You both wrote today.');
    expect([...v('reveal').querySelectorAll('.lb')].map(text)).toEqual(['From Tunde', 'From you']);
    expect(text(v('reveal').querySelector('.rv .st'))).toBe('React to what Tunde wrote.');
    expect([...v('reveal').querySelectorAll('.ch li')].map(text)).toEqual([
      '❤️Heart', '🙏Thank you', '😊Smile', '🥹Moved', '🤝Me too',
    ]);
    // The section labels are set in capitals by CSS, as the app does.
    expect(readFileSync('src/styles/phone.css', 'utf8')).toMatch(/\.dev \.lb \{[^}]*text-transform: uppercase/);
  });

  it("mirrors on Tunde's phone: his card is from you, hers from Amara", async () => {
    const doc = await render({ view: 'reveal', partner: 'Amara', mine: THEIRS, theirs: MINE });
    expect(doc.querySelector('.v[data-view="wait"] .st')!.textContent).toBe(
      "Yours is saved. When Amara writes theirs, you'll both see each other's.",
    );
    const cards = [...doc.querySelectorAll('.v[data-view="reveal"] .ec')];
    expect(cards.map((c) => text(c.querySelector('.lb')))).toEqual(['From Amara', 'From you']);
    expect(cards.map((c) => text(c.querySelector('.en')))).toEqual([MINE, THEIRS]);
  });

  it('never uses the invented prompt', async () => {
    const doc = await render({ view: 'write' });
    expect(doc.body.innerHTML).not.toContain('Something small');
    expect(readFileSync('src/components/Evening.astro', 'utf8')).not.toContain('Something small');
  });

  it('applies the size class and carries no inline style', async () => {
    const doc = await render({ view: 'today', size: 'pane' });
    expect(doc.querySelector('.dev')!.classList.contains('dev--pane')).toBe(true);
    expect(doc.querySelector('[style]')).toBeNull();
  });
});

describe('the device is generic (Apple marketing guidelines)', () => {
  // https://developer.apple.com/app-store/marketing/guidelines/ : generic devices must not
  // include details unique to Apple products, such as the sensor housing (notch, island),
  // the Ring/Silent switch or the volume controls.
  it('has no notch or island, only a round camera dot', async () => {
    const doc = await render({ view: 'today' });
    const css = readFileSync('src/styles/phone.css', 'utf8');
    expect(doc.querySelector('.isl, .island, .notch, [class*="island"], [class*="notch"]')).toBeNull();
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/island|notch|\.isl\b/i);
    const cam = /\.dev \.cam \{([^}]*)\}/.exec(css)![1];
    expect(cam).toMatch(/border-radius: 50%/);
    const w = /width: calc\((\d+) \* var\(--u\)\)/.exec(cam)![1];
    const h = /height: calc\((\d+) \* var\(--u\)\)/.exec(cam)![1];
    expect(w).toBe(h);
    expect(Number(w)).toBeLessThanOrEqual(14);
  });

  it('has one side key at most: no volume buttons, no switch', async () => {
    const doc = await render({ view: 'today' });
    const css = readFileSync('src/styles/phone.css', 'utf8');
    expect(doc.querySelectorAll('.dev__key')).toHaveLength(1);
    expect(doc.querySelector('[class*="vol"], [class*="switch"], [class*="action"], [class*="mute"]')).toBeNull();
    // The key sits on the right edge only; nothing is drawn on the left edge.
    expect(/\.dev__key \{[^}]*right:/.exec(css)).not.toBeNull();
    expect(css).not.toMatch(/\.dev__key \{[^}]*left:/);
    expect(css).not.toMatch(/\.dev::before|\.dev::after/);
  });
});

describe('phone view switching hook', () => {
  it('hides a hidden view with display none (slice 3 depends on it)', () => {
    const css = readFileSync('src/styles/phone.css', 'utf8');
    const m = /\.dev \.v\[hidden\]\s*\{([^}]*)\}/.exec(css);
    expect(m, '.v[hidden] rule').not.toBeNull();
    expect(m![1]).toMatch(/display:\s*none/);
  });
});

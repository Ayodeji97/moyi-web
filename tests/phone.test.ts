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

const MINE = "You waited up so I wouldn't walk home alone.";
const THEIRS = 'You called my mum on her birthday before I remembered.';
const labels: Record<View, string> = {
  today: 'The Mọyì app. Today: not yet written.',
  write: `The Mọyì app. Writing: ${MINE}`,
  wait: 'The Mọyì app. Written, waiting for Tunde.',
  reveal: `The Mọyì app. Your day is open. Tunde: ${THEIRS} You: ${MINE}`,
};

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

  it('uses the partner name in the wait view', async () => {
    const doc = await render({ view: 'wait', partner: 'Amara' });
    expect(doc.querySelector('.v[data-view="wait"]')!.textContent).toContain(
      "Written. You'll see Amara's when it's ready.",
    );
  });

  it('applies the size class and carries no inline style', async () => {
    const doc = await render({ view: 'today', size: 'pane' });
    expect(doc.querySelector('.dev')!.classList.contains('dev--pane')).toBe(true);
    expect(doc.querySelector('[style]')).toBeNull();
  });
});

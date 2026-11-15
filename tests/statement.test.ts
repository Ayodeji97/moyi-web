// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { lightStatement, litCount } from '../src/scripts/evening/statement';

const built = readFileSync('dist/index.html', 'utf8');
const builtBody = /<body[^>]*>([\s\S]*)<\/body>/.exec(built)![1]!;
const TEXT = 'One sentence a day about someone you love. Kept sealed until they write theirs.';

describe('litCount', () => {
  it('is 0 below the fold and all words once scrolled well past', () => {
    expect(litCount(1000, 1000, 20)).toBe(0);
    expect(litCount(-2000, 1000, 20)).toBe(20);
  });
  it('stays within 0..words', () => {
    for (let top = -3000; top <= 3000; top += 7) {
      const n = litCount(top, 1000, 20);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(20);
    }
  });
});

describe('lightStatement', () => {
  let p: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = builtBody;
    p = document.querySelector<HTMLElement>('[data-section="statement"] .st2')!;
  });

  it('the built HTML has no word spans', () => {
    expect(built).not.toContain('class="w"');
    expect(p.querySelectorAll('.w').length).toBe(0);
  });

  it('wraps each word, keeps the text and the quiet span, and sets data-live', () => {
    const s = lightStatement(p);
    expect(p.textContent).toBe(TEXT);
    expect(p.querySelector('.quiet')).not.toBeNull();
    expect(p.querySelectorAll('.quiet .w').length).toBe(6);
    expect(p.querySelectorAll('.w').length).toBe(TEXT.split(/\s+/).length);
    expect(p.closest('section')!.hasAttribute('data-live')).toBe(true);
    s.stop();
  });

  it('lights the first n words as the paragraph rises, and dims them again', () => {
    const s = lightStatement(p);
    const at = (top: number) => {
      p.getBoundingClientRect = () => ({ top } as DOMRect);
      s.update(1000);
      return p.querySelectorAll('.w.lit').length;
    };
    expect(at(1000)).toBe(0);
    expect(at(-2000)).toBe(14);
    expect(at(500)).toBe(litCount(500, 1000, 14));
    expect(at(1000)).toBe(0);
    s.stop();
  });

  it('stop restores the original markup and removes data-live', () => {
    const before = p.innerHTML;
    const s = lightStatement(p);
    s.stop();
    expect(p.innerHTML).toBe(before);
    expect(p.closest('section')!.hasAttribute('data-live')).toBe(false);
  });
});

// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lightStatement, litCount } from '../src/scripts/evening/statement';

const built = readFileSync('dist/index.html', 'utf8');
const builtBody = /<body[^>]*>([\s\S]*)<\/body>/.exec(built)![1]!;
const TEXT = 'One note a day for someone you love. Sealed until they write theirs.';

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

describe('litCount anchors (viewport 1000)', () => {
  it('matches hand-worked values', () => {
    expect(litCount(505, 1000, 20)).toBe(10); // sq = 495/900 = .55; (.55-.25)/.6 = .5; .5*20
    expect(litCount(775, 1000, 20)).toBe(0); // sq = 225/900 = .25, the threshold
    expect(litCount(235, 1000, 20)).toBe(20); // sq = 765/900 = .85; (.85-.25)/.6 = 1
  });
  it('rounds half-steps up', () => {
    // top 640: sq = 360/900 = .4; (.4-.25)/.6 = .25; .25*14 = 3.5, Math.round gives 4 (floor would give 3).
    expect(litCount(640, 1000, 14)).toBe(4);
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
    expect(p.querySelectorAll('.quiet .w').length).toBe(5);
    expect(p.querySelectorAll('.w').length).toBe(TEXT.split(/\s+/).length);
    expect(p.closest('section')!.hasAttribute('data-live')).toBe(true);
    s.stop();
  });

  it('lights the first n words as the paragraph rises, and dims them again', () => {
    const s = lightStatement(p);
    const at = (top: number) => {
      s.update(top, 1000);
      return p.querySelectorAll('.w.lit').length;
    };
    expect(at(1000)).toBe(0);
    expect(at(-2000)).toBe(13);
    expect(at(505)).toBe(7); // sq .55 gives frac .5, 13 words: 6.5 rounds to 7
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

  it('writes only the spans whose state changes', () => {
    const s = lightStatement(p);
    const spies = (['toggle', 'add', 'remove'] as const).map((m) => vi.spyOn(DOMTokenList.prototype, m));
    const calls = () => spies.reduce((n, sp) => n + sp.mock.calls.length, 0);
    const at = (top: number) => {
      s.update(top, 1000);
    };
    // 13 words: find tops for 5 and 7 from the formula.
    const topFor = (n: number) => 1000 - 900 * (0.25 + 0.6 * (n / 13));
    at(topFor(5));
    expect(p.querySelectorAll('.w.lit').length).toBe(5);
    spies.forEach((sp) => sp.mockClear());
    at(topFor(5));
    expect(calls()).toBe(0);
    at(topFor(7));
    expect(p.querySelectorAll('.w.lit').length).toBe(7);
    expect(calls()).toBe(2);
    spies.forEach((sp) => sp.mockRestore());
    s.stop();
  });
});

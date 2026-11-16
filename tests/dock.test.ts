// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DOCK_AT, dockBar } from '../src/scripts/dock';

let top = 2000;
const mount = () => {
  document.body.innerHTML = '<header class="topbar"><a class="get" href="#get">Get the app</a></header><section data-section="statement"></section>';
  document.querySelector<HTMLElement>('[data-section="statement"]')!.getBoundingClientRect = () => ({ top }) as DOMRect;
  return document.querySelector<HTMLElement>('.topbar')!;
};
const flush = () => { vi.runAllTimers(); };
const reduce = (on: boolean) => { window.matchMedia = vi.fn(() => ({ matches: on })) as never; };
const scroll = (t: number) => { top = t; window.dispatchEvent(new Event('scroll')); flush(); };
const animEnd = (el: HTMLElement) => { const e = new Event('animationend'); el.dispatchEvent(e); };

afterEach(() => { vi.useRealTimers(); top = 2000; });

describe('dockBar', () => {
  const setup = (motion = true) => {
    vi.useFakeTimers();
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0)) as never;
    window.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as never;
    reduce(!motion);
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    const bar = mount();
    const stop = dockBar(document, window);
    return { bar, stop };
  };

  it('stays on the page above the statement and docks once the statement is well on screen', () => {
    const { bar } = setup();
    expect(bar.hasAttribute('data-docked')).toBe(false);
    scroll(1000 * DOCK_AT + 1);
    expect(bar.hasAttribute('data-docked')).toBe(false);
    scroll(1000 * DOCK_AT - 1);
    expect(bar.hasAttribute('data-docked')).toBe(true);
    scroll(-5000); // far below, in the footer: still docked
    expect(bar.hasAttribute('data-docked')).toBe(true);
  });

  it('brings back a pill that had tucked on the way down', () => {
    const { bar } = setup();
    const pill = bar.querySelector('.get')!;
    pill.setAttribute('data-tucked', '');
    scroll(100);
    expect(pill.hasAttribute('data-tucked')).toBe(false);
  });

  it('slides out when scrolled back above, and only undocks when that animation ends', () => {
    const { bar } = setup();
    scroll(100);
    scroll(2000);
    expect(bar.hasAttribute('data-leaving')).toBe(true);
    expect(bar.hasAttribute('data-docked')).toBe(true);
    animEnd(bar);
    expect(bar.hasAttribute('data-docked')).toBe(false);
    expect(bar.hasAttribute('data-leaving')).toBe(false);
  });

  it('re-docks cleanly if the reader turns back down mid-exit', () => {
    const { bar } = setup();
    scroll(100);
    scroll(2000);
    scroll(100);
    expect(bar.hasAttribute('data-leaving')).toBe(false);
    animEnd(bar);
    expect(bar.hasAttribute('data-docked')).toBe(true);
  });

  it('under reduced motion undocks at once, with no animation to wait for', () => {
    const { bar } = setup(false);
    scroll(100);
    scroll(2000);
    expect(bar.hasAttribute('data-docked')).toBe(false);
    expect(bar.hasAttribute('data-leaving')).toBe(false);
  });

  it('docks at once when the page loads already past the statement, and stop undocks', () => {
    top = -300;
    const { bar, stop } = setup();
    expect(bar.hasAttribute('data-docked')).toBe(true);
    stop();
    expect(bar.hasAttribute('data-docked')).toBe(false);
  });
});

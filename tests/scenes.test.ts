// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountScenes } from '../src/scripts/evening/scenes';

let fills = 0;
const fake = new Proxy(
  {},
  {
    get: (_t, prop) => {
      if (prop === 'fillRect') return () => void fills++;
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
        return () => ({ addColorStop() {} });
      return () => {};
    },
    set: () => true,
  },
);

function harness() {
  let queue: FrameRequestCallback[] = [];
  let clock = 0;
  const raf = ((cb: FrameRequestCallback) => (queue.push(cb), queue.length)) as typeof requestAnimationFrame;
  const step = (ms: number) => {
    clock += ms;
    const q = queue;
    queue = [];
    q.forEach((cb) => cb(clock));
  };
  return { raf, now: () => clock, step };
}

function fragment() {
  const root = document.createElement('div');
  root.innerHTML =
    '<div class="scene scene--sky-afternoon"></div><div class="scene scene--sky-dusk"></div><div class="scene scene--lagos"></div>';
  return root;
}

function setHidden(v: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
}

beforeEach(() => {
  fills = 0;
  HTMLCanvasElement.prototype.getContext = (() => fake) as never;
  for (const prop of ['clientWidth', 'clientHeight'])
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => 200 });
  vi.stubGlobal('IntersectionObserver', undefined);
  setHidden(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mountScenes', () => {
  it('inserts a canvas into the sky and Lagos scenes only', () => {
    const root = fragment();
    const h = harness();
    mountScenes(root, h);
    expect(root.querySelectorAll('canvas').length).toBe(2);
    expect(root.querySelector('.scene--sky-dusk canvas')).toBeNull();
    expect(root.querySelector('.scene--lagos canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws nothing while the tab is hidden', () => {
    setHidden(true);
    const h = harness();
    mountScenes(fragment(), h);
    for (let i = 0; i < 10; i++) h.step(40);
    expect(fills).toBe(0);
  });

  it('draws when visible, at most once per 33 ms', () => {
    const h = harness();
    mountScenes(fragment(), h);
    h.step(100);
    const first = fills;
    expect(first).toBeGreaterThan(0);
    h.step(10);
    expect(fills).toBe(first);
    h.step(40);
    expect(fills).toBeGreaterThan(first);
  });

  it('skips canvases that are not intersecting', () => {
    let cb: IntersectionObserverCallback = () => {};
    const observed: unknown[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(c: IntersectionObserverCallback) {
          cb = c;
        }
        observe(el: unknown) {
          observed.push(el);
        }
        disconnect() {}
      },
    );
    const h = harness();
    mountScenes(fragment(), h);
    h.step(100);
    expect(fills).toBe(0);
    expect(observed.length).toBe(2);
    cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    h.step(100);
    expect(fills).toBeGreaterThan(0);
  });

  it('stops: canvases removed, listener gone, nothing drawn after', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const root = fragment();
    const h = harness();
    const scenes = mountScenes(root, h);
    h.step(100);
    scenes.stop();
    expect(root.querySelectorAll('canvas').length).toBe(0);
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    fills = 0;
    h.step(100);
    h.step(100);
    expect(fills).toBe(0);
  });

  it('restarts on visibilitychange', () => {
    setHidden(true);
    const h = harness();
    mountScenes(fragment(), h);
    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    h.step(100);
    expect(fills).toBeGreaterThan(0);
  });
});

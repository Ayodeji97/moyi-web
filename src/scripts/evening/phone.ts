import type { View } from './timeline';

export const SWAP_MS = 160;

export interface PhoneController {
  set(view: View): void;
  typed(k: number): void;
  busy(on: boolean): void;
  time(t: string): void;
  cards(a: number, b: number): void;
  readonly view: View;
}

export function phoneController(root: HTMLElement): PhoneController {
  const views = [...root.querySelectorAll<HTMLElement>('.v')];
  const byName = (name: View) => views.find((v) => v.dataset.view === name)!;
  const typedEl = root.querySelector<HTMLElement>('[data-typed]');
  const sendEl = root.querySelector<HTMLElement>('[data-send]');
  const clockEl = root.querySelector<HTMLElement>('.clock');
  const cardEls = [0, 1].map((i) => root.querySelector<HTMLElement>(`[data-card="${i}"]`));
  const mine = root.dataset.mine ?? '';

  let current = (views.find((v) => !v.hasAttribute('hidden'))?.dataset.view ?? 'today') as View;
  let timers: Array<() => void> = [];
  let shownTyped = typedEl?.textContent ?? '';

  const label = (view: View) => {
    const l = root.getAttribute(`data-label-${view}`);
    if (l) root.setAttribute('aria-label', l);
  };

  const cancel = () => {
    timers.forEach((c) => c());
    timers = [];
  };

  const settle = (target: View) => {
    for (const v of views) {
      v.classList.remove('is-out', 'is-in');
      if (v.dataset.view === target) v.removeAttribute('hidden');
      else v.setAttribute('hidden', '');
    }
    label(target);
  };

  const nextFrame = (fn: () => void) => {
    if (typeof requestAnimationFrame === 'function') {
      const id = requestAnimationFrame(fn);
      timers.push(() => cancelAnimationFrame(id));
    } else {
      const id = setTimeout(fn, 16);
      timers.push(() => clearTimeout(id));
    }
  };

  let swapping = false;

  return {
    get view() {
      return current;
    },
    set(view) {
      if (swapping) {
        // Mid-swap: finish the pending one at once, then start the new one.
        cancel();
        swapping = false;
        settle(current);
      }
      if (view === current) return;
      const out = byName(current);
      const incoming = byName(view);
      current = view;
      swapping = true;
      out.classList.add('is-out');
      const t = setTimeout(() => {
        out.setAttribute('hidden', '');
        out.classList.remove('is-out');
        incoming.classList.add('is-in');
        incoming.removeAttribute('hidden');
        label(view);
        void incoming.offsetHeight; // commit opacity 0 so the fade runs
        nextFrame(() => {
          incoming.classList.remove('is-in');
          swapping = false;
          timers = [];
        });
      }, SWAP_MS);
      timers.push(() => clearTimeout(t));
    },
    typed(k) {
      if (!typedEl) return;
      const text = k >= 1 ? mine : mine.slice(0, Math.round(Math.max(0, k) * mine.length));
      if (text !== shownTyped) {
        typedEl.textContent = text;
        shownTyped = text;
      }
    },
    busy(on) {
      if (!sendEl) return;
      const text = on ? 'Sending' : 'Send';
      if (sendEl.textContent !== text) sendEl.textContent = text;
    },
    time(t) {
      if (clockEl && clockEl.textContent !== t) clockEl.textContent = t;
    },
    cards(a, b) {
      [a, b].forEach((x, i) => {
        const el = cardEls[i];
        if (!el) return;
        el.style.opacity = String(x);
        el.style.setProperty('transform', `translateY(${(1 - x) * 14}px)`);
      });
    },
  };
}

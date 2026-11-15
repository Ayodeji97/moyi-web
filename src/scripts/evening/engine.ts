// The thin step from EveningState to the DOM. Every animated property is a
// custom property on the stage; CSS turns it into transforms and opacity.
// Nothing is written twice: each value is compared with the last one written.
import { phoneController, type PhoneController } from './phone';
import type { EveningState, View } from './timeline';

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Progress through the pin: 0 at its top, 1 when its bottom meets the viewport's. */
export function progress(scrollY: number, top: number, height: number, viewport: number): number {
  const span = height - viewport;
  if (!(span > 0)) return 0;
  return clamp01((scrollY - top) / span);
}

export interface Bound {
  apply(state: EveningState): void;
  /** Undo every write: clear the custom properties, restore texts, views and card styles. */
  restore(): void;
}

const round = (n: number): string => String(Math.round(n * 1000) / 1000);

export function bind(section: HTMLElement, scenes?: { setSky(p: number): void }): Bound {
  const stage = section.querySelector<HTMLElement>('[data-stage]') ?? section;
  const one = (sel: string) => section.querySelector<HTMLElement>(sel);
  const all = (sel: string) => [...section.querySelectorAll<HTMLElement>(sel)];

  const roots = {
    centre: one('[data-role="centre"] [data-phone]'),
    amara: one('[data-role="amara"] [data-phone]'),
    tunde: one('[data-role="tunde"] [data-phone]'),
  };
  const hero = one('[data-role="hero"]');
  const city = one('[data-role="caption"] [data-city]');
  const time = one('[data-role="caption"] [data-time]');
  const text = one('[data-role="caption"] [data-text]');
  const clocks = all('[data-role="who"] [data-clock]');
  const rail = all('[data-role="rail"] li');

  // Everything apply or a controller may change, recorded before any write.
  const phoneRoots = Object.values(roots).filter((r): r is HTMLElement => r !== null);
  const originals = new Map<HTMLElement, string>();
  for (const el of [city, time, text, ...clocks]) if (el) originals.set(el, el.textContent ?? '');
  for (const r of phoneRoots)
    for (const el of r.querySelectorAll<HTMLElement>('.clock, [data-typed], [data-send]'))
      originals.set(el, el.textContent ?? '');
  const cardEls = phoneRoots.flatMap((r) => [...r.querySelectorAll<HTMLElement>('[data-card]')]);

  const centre = roots.centre ? phoneController(roots.centre) : null;
  const amara = roots.amara ? phoneController(roots.amara) : null;
  const tunde = roots.tunde ? phoneController(roots.tunde) : null;
  const initial = new Map<PhoneController, View>();
  for (const c of [centre, amara, tunde]) if (c) initial.set(c, c.view);
  amara?.set('wait');

  const props = new Map<string, string>();
  const texts = new Map<HTMLElement, string>(originals);
  let cards = '';
  let step: number | undefined;
  let heroGone: boolean | undefined;
  let sky: string | undefined;

  const prop = (name: string, v: number) => {
    const s = round(v);
    if (props.get(name) === s) return;
    stage.style.setProperty(name, s);
    props.set(name, s);
  };
  const write = (el: HTMLElement | null | undefined, s: string) => {
    if (!el || texts.get(el) === s) return;
    el.textContent = s;
    texts.set(el, s);
  };

  return {
    apply(s) {
      prop('--hero', s.hero);
      prop('--rise', s.centre.rise);
      prop('--centre', s.centre.opacity);
      prop('--split', s.split);
      prop('--panes', s.panes);
      prop('--caption', s.caption.opacity);
      prop('--rail', s.rail);
      s.bars.forEach((b, i) => prop(`--bar-${i}`, b));

      if (centre) {
        centre.set(s.centre.view);
        centre.typed(s.centre.typed);
        centre.busy(s.centre.busy);
        centre.time(s.centre.time);
        const [a, b] = s.centre.cards.map(round);
        if (`${a},${b}` !== cards) {
          centre.cards(Number(a), Number(b));
          cards = `${a},${b}`;
        }
      }
      amara?.time(s.amara.time);
      if (tunde) {
        tunde.set(s.tunde.view);
        tunde.typed(s.tunde.typed);
        tunde.busy(s.tunde.busy);
        tunde.time(s.tunde.time);
      }

      write(city, s.caption.city);
      write(time, s.caption.time);
      write(text, s.caption.text);
      write(clocks[0], s.amara.time);
      write(clocks[1], s.tunde.time);

      if (s.step !== step) {
        rail.forEach((li, i) => (i === s.step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
        step = s.step;
      }

      // Once the headline has faded, its store links leave the tab order and stop taking clicks.
      const gone = s.hero === 0;
      if (hero && gone !== heroGone) {
        hero.toggleAttribute('inert', gone);
        heroGone = gone;
      }

      const k = round(s.sky);
      if (k !== sky) {
        scenes?.setSky(Number(k));
        sky = k;
      }
    },

    restore() {
      for (const name of props.keys()) stage.style.removeProperty(name);
      props.clear();
      if (stage.getAttribute('style') === '') stage.removeAttribute('style');
      for (const li of rail) li.removeAttribute('aria-current');
      hero?.removeAttribute('inert');
      for (const [c, v] of initial) c.set(v);
      for (const [el, t] of originals) if (el.textContent !== t) el.textContent = t;
      for (const el of cardEls) {
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        if (el.getAttribute('style') === '') el.removeAttribute('style');
      }
      texts.clear();
      cards = '';
      step = undefined;
      heroGone = undefined;
      sky = undefined;
    },
  };
}

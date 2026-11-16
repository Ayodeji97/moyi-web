// The evening timeline: a pure function from scroll progress to scene state.
// No DOM access and no imports. Every number comes from spec section 5.

export type View = 'today' | 'write' | 'wait' | 'reveal';

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

// NaN in gives NaN out; evening() clamps p first.
export const ramp = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a));

const pad = (n: number): string => String(n).padStart(2, '0');

export const clock = (minutes: number): string => {
  const m = (((Math.round(minutes) % 1440) + 1440) % 1440);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export interface EveningState {
  hero: number;
  sky: number;
  centre: {
    /** 0 or 1, never between: the device is never see-through over the scenery. */
    opacity: number;
    /** 1 when the phone is in place; it rises in from below the stage and sinks back out. */
    rise: number;
    view: View;
    typed: number;
    busy: boolean;
    time: string;
    cards: [number, number];
  };
  split: number;
  /** The pane labels fade with this; the pane phones slide in and out with it. */
  panes: number;
  /** 0 or 1: the pane phones are shown, opaque, whenever they are on the stage at all. */
  paneOn: number;
  amara: { view: View; time: string };
  tunde: { view: View; typed: number; busy: boolean; time: string };
  caption: { opacity: number; city: string; time: string; text: string };
  step: 0 | 1 | 2;
  bars: [number, number, number];
  rail: number;
}

const writingView = (k: number): View => (k < 0.12 ? 'today' : k < 0.55 ? 'write' : 'wait');

// Smoothstep: the phone eases into place and out again rather than sliding at a constant rate.
const ease = (t: number): number => t * t * (3 - 2 * t);

export function evening(input: number): EveningState {
  const p = Number.isNaN(input) ? 0 : clamp01(input);
  const before = p < 0.5;

  const rise = before ? ease(ramp(p, 0.08, 0.2)) * (1 - ease(ramp(p, 0.26, 0.295))) : ease(ramp(p, 0.82, 0.87));
  const dayRamp = ramp(p, 0.13, 0.26);
  const k = 0.55 * dayRamp;
  const centreView: View = before ? writingView(k) : 'reveal';
  const centreTime = before ? clock(17 * 60 + 30 + (21 * 60 + 40 - (17 * 60 + 30)) * dayRamp) : '23:10';
  const r = ramp(p, 0.84, 0.92);

  const kb = ramp(p, 0.44, 0.66);
  const k2 = kb < 0.98 ? kb * 0.55 : 0.6;
  // The day opens as soon as both have written: when Tunde sends, both panes show it.
  const sent = kb >= 0.98;
  const tundeView: View = sent ? 'reveal' : writingView(k2);
  const panes = ramp(p, 0.36, 0.41) * (1 - ramp(p, 0.68, 0.72));

  const m = 21 * 60 + 42 + Math.round(ramp(p, 0.36, 0.7) * 68);

  return {
    hero: 1 - ramp(p, 0, 0.07),
    sky: p < 0.72 ? ramp(p, 0, 0.3) * 0.55 : 0.55 + 0.45 * ramp(p, 0.72, 0.86),
    centre: {
      opacity: rise > 0 ? 1 : 0,
      rise,
      view: centreView,
      typed: before ? ramp(k, 0.14, 0.47) : 0,
      busy: before && centreView === 'write' && k > 0.49,
      time: centreTime,
      cards: before ? [0, 0] : [ramp(r, 0, 0.5), ramp(r, 0.4, 0.9)],
    },
    split: ramp(p, 0.3, 0.37) * (1 - ramp(p, 0.72, 0.8)),
    panes,
    paneOn: panes > 0 ? 1 : 0,
    amara: { view: sent ? 'reveal' : 'wait', time: clock(m) },
    tunde: {
      view: tundeView,
      typed: ramp(k2, 0.14, 0.47),
      busy: tundeView === 'write' && k2 > 0.49,
      time: clock(m - 60),
    },
    caption: {
      opacity: (p > 0.12 && p < 0.27) || p > 0.86 ? 1 : 0,
      city: before ? 'Lagos' : 'Lagos 23:10 · London 22:10',
      time: before ? centreTime : '',
      text: before
        ? dayRamp < 0.45
          ? 'The day is open for writing. Nothing to chase.'
          : 'Amara writes one true sentence about Tunde.'
        : 'Your day is open. Both of you, at the same moment.',
    },
    step: p < 0.36 ? 0 : p < 0.78 ? 1 : 2,
    bars: [ramp(p, 0.12, 0.36), ramp(p, 0.36, 0.78), ramp(p, 0.78, 0.94)],
    rail: p > 0.1 && p < 0.995 ? 1 : 0,
  };
}

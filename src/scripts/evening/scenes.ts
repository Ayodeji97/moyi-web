// Canvas footage stand-ins, ported from preview/moyi-directions.html (SCENES, bindScenes, loop).
// One rAF loop for every canvas; each draws only while intersecting, never while the tab is hidden,
// at most every 33 ms, at a pixel ratio of at most 1.25. Colours come from palette.ts only.
import { COLORS } from './palette';

export type SceneName = 'sky' | 'lagos' | 'rain';
export interface Scenes {
  setSky(p: number): void;
  stop(): void;
}

type Rng = () => number;
type Ctx = CanvasRenderingContext2D;
interface SceneDef {
  init(r: Rng): unknown;
  draw(ctx: Ctx, w: number, h: number, t: number, st: unknown, p: number): void;
}
const scene = <S>(def: {
  init(r: Rng): S;
  draw(ctx: Ctx, w: number, h: number, t: number, st: S, p: number): void;
}): SceneDef => def as SceneDef;

const TAU = 6.283;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

function rng(seed: number): Rng {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const rgbOf = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const rgba = (h: string, a: number) => `rgba(${rgbOf(h).join(',')},${a})`;
function mixRgb(a: string, b: string, t: number): number[] {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return [0, 1, 2].map((i) => Math.round(lerp(A[i], B[i], t)));
}
const mix = (a: string, b: string, t: number) => `rgb(${mixRgb(a, b, t).join(',')})`;
function ramp(stops: Array<[number, string]>, p: number): string {
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (p <= b) return mix(ca, cb, clamp((p - a) / (b - a)));
  }
  return stops[stops.length - 1][1];
}
function orb(ctx: Ctx, x: number, y: number, r: number, c: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(0.6, rgba(c, a * 0.4));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

const K = COLORS.sky;
const G = COLORS.lagos;
const R = COLORS.rain;

interface Mote { x: number; y: number; s: number; a: number; c: string; vx?: number; ph: number }

interface Building { x: number; w: number; h: number; win: Array<[number, number, number, string]>; cols: number; rows: number }

const sky = scene({
  init(r) {
    const b: Building[] = [];
    let x = -0.02;
    while (x < 1.02) {
      const bw = 0.03 + r() * 0.07;
      const bh = 0.08 + r() * 0.26;
      const win: Array<[number, number, number, string]> = [];
      const cols = Math.max(2, Math.floor(bw * 90));
      const rows = Math.floor(bh * 60);
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) if (r() > 0.35) {
            const thr = r();
            win.push([i / cols, j / rows, thr, `rgba(${mixRgb(K.winA, K.winB, thr).join(',')},${0.55 + thr * 0.4})`]);
          }
      b.push({ x, w: bw, h: bh, win, cols, rows });
      x += bw + r() * 0.006;
    }
    return {
      b,
      stars: Array.from({ length: 90 }, (): [number, number, number] => [r(), r() * 0.55, r()]),
    };
  },
  draw(ctx, w, h, t, st, p) {
    const top = ramp([[0, K.top0], [0.45, K.top1], [0.75, K.top2], [1, K.top3]], p);
    const mid = ramp([[0, K.mid0], [0.45, K.mid1], [0.75, K.mid2], [1, K.mid3]], p);
    const bot = ramp([[0, K.bot0], [0.45, K.bot1], [0.75, K.bot2], [1, K.bot3]], p);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(0.85, bot);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sa = clamp(1 - p * 1.7);
    if (sa > 0) {
      const sy = h * (0.48 + p * 0.5);
      orb(ctx, w * 0.66, sy, Math.min(w, h) * 0.5, K.sunGlow, 0.35 * sa);
      orb(ctx, w * 0.66, sy, Math.min(w, h) * 0.06, K.sunCore, 0.95 * sa);
    }
    const sta = clamp((p - 0.55) / 0.35);
    if (sta > 0)
      for (const s of st.stars) {
        ctx.fillStyle = rgba(K.star, sta * (0.4 + 0.6 * Math.abs(Math.sin(t / 900 + s[2] * 20))));
        ctx.fillRect(s[0] * w, s[1] * h, 1.3, 1.3);
      }
    const base = h; // to the very bottom: a strip of sky under the skyline read as a stray band
    // Scaled by the shorter of height and width x 1.1, so on a tall phone the skyline stays
    // under the headline and the store line instead of running up behind them.
    const sky = Math.min(h, w * 1.1);
    const sil = ramp([[0, K.sil0], [0.45, K.sil1], [1, K.sil2]], p);
    for (const b of st.b) {
      const bx = b.x * w;
      const bw = b.w * w;
      const bh = b.h * sky * 1.05;
      ctx.fillStyle = sil;
      ctx.fillRect(bx, base - bh, bw, bh);
      for (const [wx, wy, thr, lit] of b.win) {
        if (p > thr * 0.75 + 0.18) {
          ctx.fillStyle = lit;
          ctx.fillRect(bx + 3 + wx * (bw - 6), base - bh + 6 + wy * (bh - 8), Math.max(1.5, (bw / b.cols) * 0.45), 2.2);
        }
      }
    }
    const hz = ctx.createLinearGradient(0, h * 0.6, 0, h);
    hz.addColorStop(0, rgba(K.haze, 0));
    hz.addColorStop(1, rgba(K.haze, lerp(0.25, 0.7, p)));
    ctx.fillStyle = hz;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  },
});

const lagos = scene({
  init(r) {
    const pick = [G.lightA, G.lightB, G.lightC];
    return {
      lights: Array.from({ length: 40 }, (): Mote => ({
        x: r(), y: 0.55 + r() * 0.12, s: 0.004 + r() * 0.02, a: 0.3 + r() * 0.5,
        c: pick[Math.floor(r() * 3)], ph: r() * 6,
      })),
    };
  },
  draw(ctx, w, h, t, st) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, G.g0);
    g.addColorStop(0.42, G.g1);
    g.addColorStop(0.6, G.g2);
    g.addColorStop(0.62, G.g3);
    g.addColorStop(1, G.g4);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    orb(ctx, w * 0.4, h * 0.6, Math.max(w, h) * 0.35, G.glow, 0.28);
    const S = Math.max(w, h);
    for (const l of st.lights)
      orb(ctx, l.x * w, l.y * h, l.s * S * (0.85 + 0.15 * Math.sin(t / 800 + l.ph)), l.c, l.a);
    ctx.fillStyle = G.street;
    ctx.fillRect(0, h * 0.78, w, h * 0.035);
    for (let x = 0; x < w; x += Math.max(14, w * 0.035))
      ctx.fillRect(x, h * 0.78, Math.max(3, w * 0.006), h * 0.22);
    ctx.fillRect(0, h * 0.95, w, h * 0.05);
  },
});

const rain = scene({
  init(r) {
    return {
      lights: Array.from({ length: 30 }, (): Mote => ({
        x: r(), y: 0.2 + r() * 0.6, s: 0.02 + r() * 0.06, a: 0.15 + r() * 0.3,
        c: r() > 0.5 ? R.cool : R.warm, ph: r() * 6,
      })),
      drops: Array.from({ length: 110 }, (): [number, number, number] => [r(), r(), 0.6 + r() * 2]),
      runs: Array.from({ length: 22 }, () => ({ x: r(), y: r(), v: 0.0008 + r() * 0.002, l: 0.02 + r() * 0.05 })),
      rng: r, // the slot's seeded generator, so a run that restarts lands in the same place every time
    };
  },
  draw(ctx, w, h, t, st) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, R.g0);
    g.addColorStop(1, R.g1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const S = Math.max(w, h);
    for (const l of st.lights)
      orb(ctx, l.x * w, l.y * h, l.s * S * (0.9 + 0.1 * Math.sin(t / 1300 + l.ph)), l.c, l.a);
    ctx.fillStyle = rgba(R.drop, 0.35);
    for (const [x, y, r] of st.drops) {
      ctx.beginPath();
      ctx.arc(x * w, y * h, r, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(R.drop, 0.28);
    ctx.lineWidth = 1.4;
    for (const d of st.runs) {
      d.y += d.v * 16;
      if (d.y > 1.1) {
        d.y = -0.1;
        d.x = st.rng();
      }
      ctx.beginPath();
      ctx.moveTo(d.x * w, (d.y - d.l) * h);
      ctx.lineTo(d.x * w + 1, d.y * h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(d.x * w + 1, d.y * h, 1.8, 0, TAU);
      ctx.fillStyle = rgba(R.runHead, 0.5);
      ctx.fill();
    }
  },
});

const SCENES: Record<SceneName, SceneDef> = { sky, lagos, rain };

// Which element gets which scene. sky-dusk and sky-night are never painted: live mode hides them.
const TARGETS: Array<[string, SceneName]> = [
  ['.scene--sky-afternoon', 'sky'],
  ['.scene--lagos', 'lagos'],
  ['.scene--rain', 'rain'],
];

interface Slot {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  kind: SceneName;
  st: unknown;
  p: number;
  visible: boolean;
  io?: IntersectionObserver;
}

export function mountScenes(
  root: ParentNode,
  deps: { raf?: typeof requestAnimationFrame; now?: () => number } = {},
): Scenes {
  const raf = deps.raf ?? ((cb: FrameRequestCallback) => requestAnimationFrame(cb));
  const now = deps.now ?? (() => performance.now());
  const slots: Slot[] = [];
  let index = 0;

  for (const [selector, kind] of TARGETS) {
    for (const host of root.querySelectorAll<HTMLElement>(selector)) {
      const canvas = host.ownerDocument.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'scene__canvas';
      const ctx = canvas.getContext('2d');
      const i = index++;
      if (!ctx) continue;
      host.appendChild(canvas);
      const slot: Slot = {
        canvas, ctx, kind,
        st: SCENES[kind].init(rng(7 + i * 13 + kind.length * 101)),
        p: 0,
        visible: typeof IntersectionObserver === 'undefined',
      };
      if (typeof IntersectionObserver !== 'undefined') {
        slot.io = new IntersectionObserver((entries) => {
          const last = entries[entries.length - 1];
          if (last) slot.visible = last.isIntersecting;
          start();
        });
        slot.io.observe(canvas);
      }
      slots.push(slot);
    }
  }

  let running = false;
  let stopped = false;
  let lastDraw = -Infinity;

  const frame = () => {
    if (stopped || document.hidden) {
      running = false;
      return;
    }
    const t = now();
    if (t - lastDraw >= 33) {
      lastDraw = t;
      for (const s of slots) {
        if (!s.visible) continue;
        const w = s.canvas.clientWidth;
        const h = s.canvas.clientHeight;
        if (!w || !h) continue;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        if (s.canvas.width !== Math.round(w * dpr) || s.canvas.height !== Math.round(h * dpr)) {
          s.canvas.width = Math.round(w * dpr);
          s.canvas.height = Math.round(h * dpr);
        }
        s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        SCENES[s.kind].draw(s.ctx, w, h, t, s.st, s.p);
      }
    }
    if (!slots.some((s) => s.visible)) {
      running = false; // idle off screen; the IntersectionObserver callback restarts us
      return;
    }
    raf(frame);
  };

  function start() {
    if (running || stopped || document.hidden) return;
    running = true;
    raf(frame);
  }

  const onVisibility = () => start();
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return {
    setSky(p) {
      for (const s of slots) if (s.kind === 'sky') s.p = p;
    },
    stop() {
      stopped = true;
      running = false;
      document.removeEventListener('visibilitychange', onVisibility);
      for (const s of slots) {
        s.io?.disconnect();
        s.canvas.remove();
      }
      slots.length = 0;
    },
  };
}

// Canvas footage stand-ins, ported from preview/moyi-directions.html (SCENES, bindScenes, loop).
// One rAF loop for every canvas; each draws only while intersecting, never while the tab is hidden,
// at most every 33 ms, at a pixel ratio of at most 1.25. Colours come from palette.ts only.
import { COLORS } from './palette';

export type SceneName = 'sky' | 'lagos' | 'rain' | 'lamp' | 'bed';
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

const L = COLORS.lamp;
const K = COLORS.sky;
const G = COLORS.lagos;
const R = COLORS.rain;
const B = COLORS.bed;

interface Mote { x: number; y: number; s: number; a: number; c: string; vx?: number; ph: number }

const lamp = scene({
  init(r) {
    const pick = [L.orbAmber, L.orbRose, L.orbCream, L.orbCopper];
    return {
      orbs: Array.from({ length: 28 }, (): Mote => ({
        x: r(), y: r() * 0.9, s: 0.015 + r() * 0.07, a: 0.08 + r() * 0.3,
        c: pick[Math.floor(r() * 4)], vx: (r() - 0.5) * 0.00004, ph: r() * 6.28,
      })),
    };
  },
  draw(ctx, w, h, t, st) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, L.bgTop);
    g.addColorStop(1, L.bgBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    orb(ctx, w * 0.82, h * 0.32, Math.max(w, h) * 0.42, L.glow, 0.3);
    orb(ctx, w * 0.82, h * 0.3, Math.max(w, h) * 0.1, L.core, 0.5);
    ctx.fillStyle = rgba(L.pane, 0.07);
    ctx.fillRect(w * 0.04, h * 0.12, w * 0.22, h * 0.6);
    ctx.strokeStyle = rgba(L.frame, 0.06);
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.04, h * 0.12, w * 0.22, h * 0.6);
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.12);
    ctx.lineTo(w * 0.15, h * 0.72);
    ctx.stroke();
    const S = Math.max(w, h);
    for (const o of st.orbs) {
      o.x += (o.vx ?? 0) * 16;
      if (o.x > 1.1) o.x = -0.1;
      if (o.x < -0.1) o.x = 1.1;
      orb(ctx, o.x * w, o.y * h, o.s * S * (0.85 + 0.15 * Math.sin(t / 1500 + o.ph)), o.c, o.a);
    }
    const f = ctx.createLinearGradient(0, h * 0.75, 0, h);
    f.addColorStop(0, rgba(L.bgBot, 0));
    f.addColorStop(1, rgba(L.bgBot, 0.85));
    ctx.fillStyle = f;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  },
});

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
      clouds: Array.from({ length: 6 }, () => ({
        x: r(), y: 0.12 + r() * 0.3, s: 0.12 + r() * 0.18, v: 0.000006 + r() * 0.00001,
      })),
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
    for (const c of st.clouds) {
      c.x += c.v * 16;
      if (c.x > 1.3) c.x = -0.3;
      ctx.save();
      ctx.translate(c.x * w, c.y * h);
      ctx.scale(3, 1);
      orb(ctx, 0, 0, (c.s * w) / 3, p < 0.5 ? K.cloudDay : K.cloudNight, lerp(0.35, 0.12, p));
      ctx.restore();
    }
    const base = h * 0.98;
    const sil = ramp([[0, K.sil0], [0.45, K.sil1], [1, K.sil2]], p);
    for (const b of st.b) {
      const bx = b.x * w;
      const bw = b.w * w;
      const bh = b.h * h * 1.35;
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
    hz.addColorStop(0, rgba(B.shadow, 0));
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
    const sway = Math.sin(t / 1700) * 0.015;
    ctx.fillStyle = G.palm;
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.translate(w * 0.92, h * 0.8);
      ctx.rotate(-1.1 - i * 0.32 + sway);
      ctx.beginPath();
      ctx.ellipse(w * 0.16, 0, w * 0.17, h * 0.022, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
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
    ctx.fillStyle = rgba(R.edge, 0.35);
    ctx.fillRect(0, 0, w * 0.03, h);
    ctx.fillRect(0, h * 0.97, w, h * 0.03);
  },
});

const bed = scene({
  init(r) {
    return { steam: Array.from({ length: 3 }, (_, i) => ({ ph: r() * 6, dx: i * 0.012 })) };
  },
  draw(ctx, w, h, t, st) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, B.g0);
    g.addColorStop(1, B.g1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba(B.grain, 0.05);
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += w / 12) ctx.lineTo(x, y + Math.sin(x * 0.01 + y) * 3);
      ctx.stroke();
    }
    orb(ctx, w * 0.86, h * 0.16, Math.max(w, h) * 0.55, B.glow, 0.42);
    orb(ctx, w * 0.86, h * 0.16, Math.max(w, h) * 0.09, B.core, 0.75);
    ctx.save();
    ctx.translate(w * 0.34, h * 0.3);
    ctx.rotate(-0.2);
    const pw = Math.min(w * 0.2, h * 0.28);
    const ph = pw * 2.05;
    ctx.fillStyle = rgba(B.shadow, 0.45);
    ctx.beginPath();
    ctx.roundRect(-pw / 2 + 10, -ph / 2 + 14, pw, ph, pw * 0.16);
    ctx.fill();
    ctx.fillStyle = B.phone;
    ctx.beginPath();
    ctx.roundRect(-pw / 2, -ph / 2, pw, ph, pw * 0.16);
    ctx.fill();
    const glow = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t / 1800));
    ctx.fillStyle = rgba(B.screen, glow * 0.35);
    ctx.beginPath();
    ctx.roundRect(-pw / 2 + pw * 0.05, -ph / 2 + pw * 0.05, pw * 0.9, ph - pw * 0.1, pw * 0.12);
    ctx.fill();
    ctx.fillStyle = rgba(B.screen, glow);
    ctx.fillRect(-pw * 0.3, -ph * 0.05, pw * 0.6, 2);
    ctx.fillRect(-pw * 0.3, ph * 0.02, pw * 0.45, 2);
    ctx.restore();
    const mx = w * 0.66;
    const my = h * 0.36;
    const mr = Math.min(w, h) * 0.08;
    ctx.fillStyle = rgba(B.shadow, 0.35);
    ctx.beginPath();
    ctx.arc(mx + 6, my + 8, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = B.mug;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = B.coffee;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 0.78, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(B.steam, 0.18);
    ctx.lineWidth = 2;
    for (const s of st.steam) {
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const yy = my - mr * 0.3 - k * mr * 0.09;
        const xx = mx + s.dx * w + Math.sin(k * 0.5 + t / 700 + s.ph) * mr * 0.18;
        if (k) ctx.lineTo(xx, yy);
        else ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
  },
});

const SCENES: Record<SceneName, SceneDef> = { lamp, sky, lagos, rain, bed };

// Which element gets which scene. sky-dusk and sky-night are never painted: live mode hides them.
const TARGETS: Array<[string, SceneName]> = [
  ['.scene--sky-afternoon', 'sky'],
  ['.scene--lagos', 'lagos'],
  ['.scene--rain', 'rain'],
  ['.scene--lamp', 'lamp'],
  ['.scene--bed', 'bed'],
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

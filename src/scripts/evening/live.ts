// Live mode: the four still frames become one pinned scene driven by scroll.
// Never runs under reduced motion; tears itself down if that setting turns on.
import { bind, progress } from './engine';
import { mountScenes } from './scenes';
import { lightStatement } from './statement';
import { evening } from './timeline';

const noop = () => {};
export const MIN_HEIGHT = 480;

type Change = (e: { matches: boolean }) => void;
// Safari before 14 has only the deprecated addListener/removeListener on MediaQueryList.
const listen = (mq: MediaQueryList, fn: Change) =>
  typeof mq.addEventListener === 'function' ? mq.addEventListener('change', fn) : mq.addListener(fn);
const unlisten = (mq: MediaQueryList, fn: Change) =>
  typeof mq.removeEventListener === 'function' ? mq.removeEventListener('change', fn) : mq.removeListener(fn);

export function start(doc: Document, win: Window): () => void {
  const section = doc.getElementById('how');
  if (!section || typeof win.matchMedia !== 'function') return noop;
  const reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return noop;
  // Too short for the pinned scene (a landscape phone): keep the still frames.
  // Evaluated once at start; a later resize past the threshold does not switch modes.
  if (win.innerHeight < MIN_HEIGHT) return noop;

  const extras = ['rail', 'progress', 'hint']
    .map((r) => section.querySelector<HTMLElement>(`[data-role="${r}"]`))
    .filter((el): el is HTMLElement => el !== null);

  section.setAttribute('data-live', '');
  for (const el of extras) el.hidden = false;
  // Only the evening is painted. The Private cards keep their calm CSS stand-ins until real footage
  // drops in (spec 6.4): imitation footage there read as smudges.
  const scenes = mountScenes(section);
  const bound = bind(section, scenes);
  const stp = doc.querySelector<HTMLElement>('[data-section="statement"] .st2');
  const statement = stp ? lightStatement(stp) : null;

  let queued = false;
  let frameId = 0;
  const tick = () => {
    queued = false;
    // Every read before any write, so the frame forces no layout.
    const r = section.getBoundingClientRect();
    const statementTop = stp ? stp.getBoundingClientRect().top : 0;
    const vh = win.innerHeight;
    bound.apply(evening(progress(win.scrollY, r.top + win.scrollY, r.height, vh)));
    statement?.update(statementTop, vh);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    frameId = win.requestAnimationFrame(tick);
  };

  let done = false;
  const teardown = () => {
    if (done) return;
    done = true;
    win.removeEventListener('scroll', schedule);
    win.removeEventListener('resize', schedule);
    unlisten(reduce, onChange);
    if (queued) win.cancelAnimationFrame(frameId);
    queued = false;
    scenes.stop();
    section.removeAttribute('data-live');
    for (const el of extras) el.hidden = true;
    bound.restore();
    statement?.stop();
  };
  function onChange(e: { matches: boolean }) {
    if (e.matches) teardown();
  }

  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', schedule);
  listen(reduce, onChange);
  tick();
  return teardown;
}

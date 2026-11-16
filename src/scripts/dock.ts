// The glass bar. Over the evening scene the top bar sits on the page and scrolls away with it.
// Once the statement section is well on screen, the bar docks: it becomes fixed, frosted, and
// slides down from the top (data-docked). Scrolled back up into the evening, it slides out
// (data-leaving) and returns to the page. It never docks above the statement.
//
// Without JavaScript the bar simply stays at the top of the page. Under reduced motion it docks
// and undocks without a slide (the CSS drops the animation, so no animationend is waited for).
const noop = () => {};
// Dock once the statement's top edge is above this fraction of the viewport height.
export const DOCK_AT = 0.6;

export function dockBar(doc: Document, win: Window | null = doc.defaultView): () => void {
  const bar = doc.querySelector<HTMLElement>('.topbar');
  const from = doc.querySelector<HTMLElement>('[data-section="statement"]');
  if (!bar || !from || !win || typeof win.requestAnimationFrame !== 'function') return noop;
  const still = () => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  let queued = false;
  let frame = 0;
  const undock = () => {
    bar.removeAttribute('data-docked');
    bar.removeAttribute('data-leaving');
  };
  const onEnd = (e: AnimationEvent) => {
    if (e.target === bar && bar.hasAttribute('data-leaving')) undock();
  };
  const tick = () => {
    queued = false;
    const want = from.getBoundingClientRect().top < win.innerHeight * DOCK_AT;
    const docked = bar.hasAttribute('data-docked') && !bar.hasAttribute('data-leaving');
    if (want === docked) return;
    if (want) {
      bar.removeAttribute('data-leaving');
      bar.setAttribute('data-docked', '');
      // The pill may have tucked on the way down (scripts/get.ts); in the bar it belongs on show.
      bar.querySelector('.get')?.removeAttribute('data-tucked');
    } else if (still()) {
      undock();
    } else {
      bar.setAttribute('data-leaving', '');
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    frame = win.requestAnimationFrame(tick);
  };

  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', schedule, { passive: true });
  bar.addEventListener('animationend', onEnd);
  tick();
  return () => {
    win.removeEventListener('scroll', schedule);
    win.removeEventListener('resize', schedule);
    bar.removeEventListener('animationend', onEnd);
    if (queued) win.cancelAnimationFrame(frame);
    queued = false;
    undock();
  };
}

// The floating "Get the app" pill.
//
// Everywhere: it steps aside (data-away) while the closing section, which holds the store links
// it points to, is on screen, so the two never sit together.
//
// On phones (the site's 699px breakpoint) it also tucks away (data-tucked) while the reader
// scrolls down through the page's text, where its top-right spot sits over body copy, and comes
// back as soon as they scroll up. While the top bar is docked as the glass bar it never tucks. It always shows near the top, and for as long as the evening
// scene is pinned (it shares the top row with that scene's progress line, measured clear of the
// phone and captions). It shows whenever it has keyboard focus: a tucked pill stays focusable.
//
// Without JavaScript, or without the APIs below, the pill simply stays visible.
export const NARROW = '(max-width: 699px)';
// Ignore scroll movements smaller than this, so a resting thumb does not make the pill flicker.
export const THRESHOLD = 12;

const noop = () => {};

export function floatGet(doc: Document, win: Window | null = doc.defaultView): () => void {
  const pill = doc.querySelector<HTMLElement>('.topbar .get');
  if (!pill) return noop;
  const stops: (() => void)[] = [];

  const close = doc.querySelector<HTMLElement>('[data-section="close"]') ?? doc.getElementById('get');
  if (close && typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) pill.toggleAttribute('data-away', last.isIntersecting);
    });
    io.observe(close);
    stops.push(() => {
      io.disconnect();
      pill.removeAttribute('data-away');
    });
  }

  if (win && typeof win.matchMedia === 'function' && typeof win.requestAnimationFrame === 'function') {
    stops.push(tuckOnScroll(doc, win, pill));
  }

  return () => stops.forEach((s) => s());
}

function tuckOnScroll(doc: Document, win: Window, pill: HTMLElement): () => void {
  const narrow = win.matchMedia(NARROW);
  const evening = doc.getElementById('how');
  let last = win.scrollY;
  let queued = false;
  let frame = 0;

  const show = () => pill.removeAttribute('data-tucked');
  const tick = () => {
    queued = false;
    if (!narrow.matches) return show();
    // Every read before the one write, so the frame forces no extra layout.
    const y = win.scrollY;
    const vh = win.innerHeight;
    const pinned = evening !== null && evening.hasAttribute('data-live') && evening.getBoundingClientRect().bottom > vh;
    const focused = doc.activeElement === pill;
    // Docked in the glass bar (scripts/dock.ts), the pill has a backing and sits over no text.
    const docked = pill.closest('.topbar')?.hasAttribute('data-docked') === true;
    if (y < vh / 2 || pinned || focused || docked) {
      last = y;
      return show();
    }
    const delta = y - last;
    if (Math.abs(delta) < THRESHOLD) return;
    last = y;
    pill.toggleAttribute('data-tucked', delta > 0);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    frame = win.requestAnimationFrame(tick);
  };
  const onChange = () => {
    last = win.scrollY;
    if (!narrow.matches) show();
  };

  win.addEventListener('scroll', schedule, { passive: true });
  pill.addEventListener('focus', show);
  if (typeof narrow.addEventListener === 'function') narrow.addEventListener('change', onChange);
  else narrow.addListener(onChange);

  return () => {
    win.removeEventListener('scroll', schedule);
    pill.removeEventListener('focus', show);
    if (typeof narrow.removeEventListener === 'function') narrow.removeEventListener('change', onChange);
    else narrow.removeListener(onChange);
    if (queued) win.cancelAnimationFrame(frame);
    queued = false;
    show();
  };
}

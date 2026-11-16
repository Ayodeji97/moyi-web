// The footer's one entrance: as it comes into view, the brand row, each link column and the
// bottom bar rise 16px and fade in, a beat apart. It plays once.
//
// Nothing is hidden until this script has run and found IntersectionObserver, and nothing moves
// under reduced motion, so without JavaScript (or with motion reduced) the footer simply shows.
const noop = () => {};

export function revealFoot(doc: Document, win: Window | null = doc.defaultView): () => void {
  const foot = doc.querySelector<HTMLElement>('footer.foot');
  if (!foot || !win || typeof IntersectionObserver === 'undefined') return noop;
  if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return noop;

  // Already on screen when the page loads (a short page, or a reload near the bottom): show it.
  const r = foot.getBoundingClientRect();
  if (r.top < win.innerHeight && r.bottom > 0) return noop;

  foot.setAttribute('data-reveal', '');
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      foot.setAttribute('data-in', '');
      io.disconnect();
    }
  }, { threshold: 0.15 });
  io.observe(foot);
  return () => {
    io.disconnect();
    foot.removeAttribute('data-reveal');
    foot.removeAttribute('data-in');
  };
}

// The floating "Get the app" pill steps aside while the closing section, which holds the store
// links it points to, is on screen, so the two never sit together. Without JavaScript, or
// without IntersectionObserver, the pill simply stays visible.
export function floatGet(doc: Document): () => void {
  const pill = doc.querySelector<HTMLElement>('.topbar .get');
  const close = doc.querySelector<HTMLElement>('[data-section="close"]') ?? doc.getElementById('get');
  if (!pill || !close || typeof IntersectionObserver === 'undefined') return () => {};
  const io = new IntersectionObserver((entries) => {
    const last = entries[entries.length - 1];
    if (last) pill.toggleAttribute('data-away', last.isIntersecting);
  });
  io.observe(close);
  return () => {
    io.disconnect();
    pill.removeAttribute('data-away');
  };
}

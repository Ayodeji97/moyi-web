// The phone menu is a <details> in the top bar, so it works without this. This only tidies it:
// it closes when a link in it is followed (an in-page anchor would otherwise leave it open over
// the page), when Escape is pressed (focus returns to the toggle), on a tap outside it, and when
// the screen widens past the phone breakpoint (so it never comes back already open).
export const WIDE = '(min-width: 700px)';
const noop = () => {};

export function tidyMenu(doc: Document, win: Window | null = doc.defaultView): () => void {
  const menu = doc.querySelector<HTMLDetailsElement>('.topbar details.menu');
  if (!menu) return noop;
  const toggle = menu.querySelector<HTMLElement>('summary');

  const onClick = (e: Event) => {
    if ((e.target as Element | null)?.closest('a')) menu.open = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    toggle?.focus();
  };
  const onOutside = (e: Event) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  };

  const wide = win?.matchMedia?.(WIDE);
  const onWide = () => {
    if (wide?.matches) menu.open = false;
  };

  menu.addEventListener('click', onClick);
  wide?.addEventListener?.('change', onWide);
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('pointerdown', onOutside);
  return () => {
    menu.removeEventListener('click', onClick);
    wide?.removeEventListener?.('change', onWide);
    doc.removeEventListener('keydown', onKey);
    doc.removeEventListener('pointerdown', onOutside);
  };
}

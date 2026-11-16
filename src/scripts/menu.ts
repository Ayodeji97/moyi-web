// The phone menu is a <details> in the top bar, so it works without this. This only tidies it:
// it closes when a link in it is followed (an in-page anchor would otherwise leave it open over
// the page), when Escape is pressed (focus returns to the toggle), and on a tap outside it.
const noop = () => {};

export function tidyMenu(doc: Document): () => void {
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

  menu.addEventListener('click', onClick);
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('pointerdown', onOutside);
  return () => {
    menu.removeEventListener('click', onClick);
    doc.removeEventListener('keydown', onKey);
    doc.removeEventListener('pointerdown', onOutside);
  };
}

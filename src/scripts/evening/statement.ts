// The statement paragraph lights up word by word as it scrolls into view.
// Live mode only. live.ts owns the listener and the frame; this just reads and toggles.

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function litCount(top: number, viewport: number, words: number): number {
  const sq = clamp((viewport - top) / (viewport * 0.9));
  return Math.round(clamp((sq - 0.25) / 0.6) * words);
}

// Copy `src`'s children into `dst`, wrapping every whitespace-separated token in span.w.
function wrap(doc: Document, src: Node, dst: Node, words: HTMLElement[]): void {
  for (const node of Array.from(src.childNodes)) {
    if (node.nodeType === 3) {
      for (const part of (node.textContent ?? '').split(/(\s+)/)) {
        if (part === '') continue;
        if (/^\s+$/.test(part)) {
          dst.appendChild(doc.createTextNode(part));
        } else {
          const w = doc.createElement('span');
          w.className = 'w';
          w.textContent = part;
          dst.appendChild(w);
          words.push(w);
        }
      }
    } else if (node.nodeType === 1) {
      const copy = (node as Element).cloneNode(false);
      dst.appendChild(copy);
      wrap(doc, node, copy, words);
    } else {
      dst.appendChild(node.cloneNode(true));
    }
  }
}

export function lightStatement(p: HTMLElement): { update(viewport: number): void; stop(): void } {
  const original = p.innerHTML;
  const section = p.closest('section');
  const words: HTMLElement[] = [];
  const frag = p.ownerDocument.createDocumentFragment();
  wrap(p.ownerDocument, p, frag, words);
  p.replaceChildren(frag);
  section?.setAttribute('data-live', '');

  let lit = 0;
  return {
    update(viewport: number) {
      const n = litCount(p.getBoundingClientRect().top, viewport, words.length);
      if (n === lit) return;
      const lo = Math.min(n, lit);
      const hi = Math.max(n, lit);
      for (let i = lo; i < hi; i++) words[i]!.classList.toggle('lit', i < n);
      lit = n;
    },
    stop() {
      p.innerHTML = original;
      section?.removeAttribute('data-live');
    },
  };
}

/*
 * In-flow project expansion for the Selected Works grid.
 * A clicked card expands in its own document position (grid-column 1/-1);
 * the rest of the homepage reflows naturally. No overlay, no scroll lock,
 * no route change. Horizontal navigation pages through the expanded
 * project's complete portfolio sheets.
 */

function init() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  if (grid.dataset.gxInit === '1') return;
  grid.dataset.gxInit = '1';

  const items = Array.from(grid.querySelectorAll<HTMLElement>('.gitem'));
  const cards = items.map((it) => it.querySelector<HTMLElement>('.proj-card')!);
  const exps = items.map((it) => it.querySelector<HTMLElement>('.gx')!);
  const tracks = items.map((it) => it.querySelector<HTMLElement>('.gx-track')!);
  const pages = items.map((it) => Array.from(it.querySelectorAll<HTMLElement>('.gx-page')));
  const counts = pages.map((a) => a.length);
  const countEls = items.map((it) => it.querySelector<HTMLElement>('.gx-count')!);
  const prevBtns = items.map((it) => it.querySelector<HTMLButtonElement>('.gx-prev')!);
  const nextBtns = items.map((it) => it.querySelector<HTMLButtonElement>('.gx-next')!);
  const ghost = document.getElementById('gx-ghost') as HTMLElement;
  const ghostImg = ghost.querySelector('img') as HTMLImageElement;

  const state: number[] = counts.map(() => 0);
  let open = -1;
  let ghostTimer = 0;

  const pad = (n: number) => String(n).padStart(2, '0');
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step(i: number): number {
    if (pages[i].length < 2) return 0;
    return pages[i][1].offsetLeft - pages[i][0].offsetLeft;
  }

  function applyPage(i: number, animate = true) {
    const t = tracks[i];
    if (!animate) t.classList.add('gx-noanim');
    t.style.transform = `translateX(${-state[i] * step(i)}px)`;
    if (!animate) {
      void t.offsetWidth;
      t.classList.remove('gx-noanim');
    }
    countEls[i].textContent = `${pad(state[i] + 1)} / ${pad(counts[i])}`;
    prevBtns[i].disabled = state[i] === 0;
    nextBtns[i].disabled = state[i] >= counts[i] - 1;
    for (const p of [state[i], state[i] + 1]) {
      const im = pages[i][p]?.querySelector('img');
      if (im) im.loading = 'eager';
    }
  }

  function go(i: number, dir: number) {
    const n = Math.min(counts[i] - 1, Math.max(0, state[i] + dir));
    if (n === state[i]) return;
    state[i] = n;
    applyPage(i);
  }

  function setRect(el: HTMLElement, r: { top: number; left: number; width: number; height: number }) {
    el.style.top = `${r.top}px`;
    el.style.left = `${r.left}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  }

  function hideGhost() {
    ghost.classList.remove('fly');
    ghost.style.display = 'none';
    ghost.style.opacity = '1';
  }

  function flyGhost(src: string, from: DOMRect, to: DOMRect, fadeAt: number, doneAt: number) {
    window.clearTimeout(ghostTimer);
    ghostImg.src = src;
    ghost.classList.remove('fly');
    ghost.style.opacity = '1';
    ghost.style.display = 'block';
    setRect(ghost, from);
    void ghost.offsetWidth;
    ghost.classList.add('fly');
    setRect(ghost, to);
    window.setTimeout(() => {
      ghost.style.opacity = '0';
    }, fadeAt);
    ghostTimer = window.setTimeout(hideGhost, doneAt);
  }

  function flipSiblings(first: Map<number, DOMRect>, skipA: number, skipB: number) {
    const vh = window.innerHeight;
    items.forEach((it, j) => {
      if (j === skipA || j === skipB) return;
      const a = first.get(j);
      if (!a) return;
      const b = it.getBoundingClientRect();
      if (a.top > vh * 2 && b.top > vh * 2) return;
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      it.style.transition = 'none';
      it.style.transform = `translate(${dx}px,${dy}px)`;
      void it.offsetWidth;
      it.style.transition = 'transform 400ms var(--ease)';
      it.style.transform = '';
      window.setTimeout(() => {
        it.style.transition = '';
        it.style.transform = '';
      }, 440);
    });
  }

  function setExpanded(i: number) {
    const prev = open;
    if (i === prev) return;
    const reduce = reduceMotion();

    /* FIRST — geometry before any change */
    const fromCardImg = i >= 0 ? cards[i].querySelector<HTMLImageElement>('img.p1') : null;
    const fromRect = fromCardImg ? fromCardImg.getBoundingClientRect() : null;
    const closingImg = prev >= 0 ? pages[prev][state[prev]].querySelector('img') : null;
    const closingRect = closingImg ? closingImg.getBoundingClientRect() : null;
    const sibFirst = new Map<number, DOMRect>();
    if (!reduce) items.forEach((it, j) => sibFirst.set(j, it.getBoundingClientRect()));

    /* TOGGLE — one reflow */
    if (prev >= 0) {
      items[prev].classList.remove('open');
      exps[prev].hidden = true;
      cards[prev].setAttribute('aria-expanded', 'false');
    }
    if (i >= 0) {
      items[i].classList.add('open');
      exps[i].hidden = false;
      cards[i].setAttribute('aria-expanded', 'true');
      applyPage(i, false);
    }
    open = i;

    /* minimal scroll so the expanded row is meaningfully visible */
    if (i >= 0) items[i].scrollIntoView({ block: 'nearest', behavior: 'auto' });

    /* PLAY */
    if (!reduce) {
      flipSiblings(sibFirst, i, prev);
      if (i >= 0 && fromCardImg && fromRect) {
        const dest = pages[i][state[i]].querySelector('img')!;
        flyGhost(
          fromCardImg.currentSrc || fromCardImg.src,
          fromRect,
          dest.getBoundingClientRect(),
          500,
          780
        );
      } else if (i < 0 && closingImg && closingRect && prev >= 0) {
        const cardImg = cards[prev].querySelector<HTMLImageElement>('img.p1');
        if (cardImg) {
          const to = cardImg.getBoundingClientRect();
          const vh = window.innerHeight;
          if (to.bottom > 0 && to.top < vh) {
            flyGhost(closingImg.currentSrc || closingImg.src, closingRect, to, 260, 540);
          }
        }
      }
    }

    /* focus */
    if (i >= 0) {
      exps[i].focus({ preventScroll: true });
    } else if (prev >= 0) {
      cards[prev].focus({ preventScroll: true });
    }
  }

  /* ---- wiring ---- */
  items.forEach((it, i) => {
    const activate = () => setExpanded(i);
    cards[i].addEventListener('click', activate);
    cards[i].addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
    it.querySelector('.gx-close')!.addEventListener('click', () => setExpanded(-1));
    prevBtns[i].addEventListener('click', () => go(i, -1));
    nextBtns[i].addEventListener('click', () => go(i, 1));
  });

  document.addEventListener('keydown', (e) => {
    if (open < 0) return;
    if (e.key === 'Escape') {
      setExpanded(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(open, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(open, -1);
    }
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(() => {
      if (open >= 0) applyPage(open, false);
    }, 150);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

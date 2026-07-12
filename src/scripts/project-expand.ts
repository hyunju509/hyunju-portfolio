/*
 * In-flow project expansion for the Selected Works grid.
 * A clicked card expands in its own document position (grid-column 1/-1);
 * the rest of the homepage reflows naturally. No overlay, no scroll lock,
 * no route change. Horizontal navigation pages through the expanded
 * project's complete portfolio sheets.
 *
 * Motion model: transform-only FLIP for both the flying media ghost and
 * sibling-card reflow. Layout properties (top/left/width/height) are only
 * ever set once, synchronously, to establish the invert state — the
 * browser then animates a single `transform` to identity, so it can
 * composite the whole sequence on the GPU instead of recomputing layout
 * every frame.
 */

const FLIGHT_MS = 820;
const SIB_MS = 820;
const META_MS = 360;
const META_DELAY_MS = 180;
const CROSSFADE_MS = 180;
const CLOSE_META_MS = 130;
const EASE = 'cubic-bezier(.22,1,.36,1)';
const CENTER_MS = 820;
const HEADER_OFFSET = 72;

function init() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  if (grid.dataset.gxInit === '1') return;
  grid.dataset.gxInit = '1';

  const items = Array.from(grid.querySelectorAll<HTMLElement>('.gitem'));
  const cards = items.map((it) => it.querySelector<HTMLElement>('.proj-card')!);
  const exps = items.map((it) => it.querySelector<HTMLElement>('.gx')!);
  const medias = items.map((it) => it.querySelector<HTMLElement>('.gx-media')!);
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
  let busy = false;
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
    if (busy) return;
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

  /*
   * One-time eased scroll used to bring an expanding More Work project
   * toward the vertical center of the viewport, concurrent with the FLIP
   * flight (the ghost is document-anchored, so scrolling can't desync it).
   * scrollTo per frame must be behavior:'instant' — the site-wide CSS
   * scroll-behavior:smooth would otherwise re-animate every single tick.
   */
  let scrollAnimToken = 0;
  function cancelCenterScroll() {
    scrollAnimToken++;
  }
  function animateScrollTo(targetY: number, ms: number) {
    const token = ++scrollAnimToken;
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) return;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    function frame(now: number) {
      if (token !== scrollAnimToken) return;
      const t = Math.min(1, (now - start) / ms);
      window.scrollTo({ top: startY + delta * easeOutCubic(t), behavior: 'instant' as ScrollBehavior });
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Vertical-center scroll target for the expanded item: centered in the
     space below the fixed header, or aligned just under the header when
     the expanded card is taller than that space. */
  function centerTargetY(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const docTop = rect.top + window.scrollY;
    const vh = window.innerHeight;
    const room = vh - HEADER_OFFSET;
    const desiredTop = rect.height >= room - 24 ? HEADER_OFFSET : HEADER_OFFSET + (room - rect.height) / 2;
    const maxY = Math.max(0, document.documentElement.scrollHeight - vh);
    return Math.min(Math.max(0, docTop - desiredTop), maxY);
  }

  function hideGhost() {
    ghost.style.display = 'none';
    ghost.style.transition = '';
    ghost.style.transform = '';
    ghost.style.opacity = '1';
    ghost.style.willChange = '';
  }

  /*
   * Transform-only FLIP flight: the ghost's box (top/left/width/height) is
   * set once to the LAST (destination) geometry, then an inverted
   * translate+scale places it visually at FIRST — only `transform` and
   * `opacity` are ever animated from there.
   */
  function flipGhost(
    src: string,
    first: DOMRect,
    last: DOMRect,
    revealTarget: HTMLElement,
    onDone: () => void
  ) {
    window.clearTimeout(ghostTimer);
    revealTarget.style.transition = 'none';
    revealTarget.style.opacity = '0';
    void revealTarget.offsetWidth;

    ghostImg.src = src;
    ghost.style.transition = 'none';
    ghost.style.willChange = 'transform, opacity';
    ghost.style.display = 'block';
    ghost.style.opacity = '1';
    ghost.style.transformOrigin = 'top left';
    /* first/last are viewport rects captured at the same scroll position;
       the ghost itself is document-anchored (position:absolute), so add
       the current scroll offset once — the dx/dy flight deltas below are
       scroll-invariant either way */
    setRect(ghost, {
      top: last.top + window.scrollY,
      left: last.left + window.scrollX,
      width: last.width,
      height: last.height,
    });

    const sx = last.width ? first.width / last.width : 1;
    const sy = last.height ? first.height / last.height : 1;
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
    void ghost.offsetWidth;

    const fadeDelay = Math.max(0, FLIGHT_MS - CROSSFADE_MS);
    ghost.style.transition = `transform ${FLIGHT_MS}ms ${EASE}, opacity ${CROSSFADE_MS}ms ease-out ${fadeDelay}ms`;
    ghost.style.transform = 'translate3d(0,0,0) scale(1,1)';
    ghost.style.opacity = '0';

    revealTarget.style.transition = `opacity ${CROSSFADE_MS}ms ease-out ${fadeDelay}ms`;
    revealTarget.style.opacity = '1';

    ghostTimer = window.setTimeout(() => {
      hideGhost();
      revealTarget.style.transition = '';
      onDone();
    }, FLIGHT_MS + 60);
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
      it.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      it.style.willChange = 'transform';
      void it.offsetWidth;
      it.style.transition = `transform ${SIB_MS}ms ${EASE}`;
      it.style.transform = '';
      window.setTimeout(() => {
        it.style.transition = '';
        it.style.transform = '';
        it.style.willChange = '';
      }, SIB_MS + 40);
    });
  }

  function revealMeta(i: number, on: boolean) {
    items[i].classList.toggle('reveal', on);
  }

  function openProject(i: number) {
    const reduce = reduceMotion();

    /* FIRST */
    const cardImg = cards[i].querySelector<HTMLImageElement>('img.p1')!;
    const firstRect = cardImg.getBoundingClientRect();
    const sibFirst = new Map<number, DOMRect>();
    if (!reduce) items.forEach((it, j) => sibFirst.set(j, it.getBoundingClientRect()));

    /* Suppress native scroll anchoring for the duration of the transition:
       expanding this item to grid-column:1/-1 can push it onto a fresh row,
       shifting its own top edge, which the browser would otherwise try to
       compensate for by adjusting scrollTop on its own. */
    grid.classList.add('gx-transitioning');

    /* TOGGLE — one reflow. No scrollIntoView. Selected Works (tier A)
       keeps the viewport untouched; More Work (tier B) additionally glides
       toward the vertical viewport center, concurrently with the FLIP
       (the document-anchored ghost keeps the flight aligned while the
       page scrolls). */
    items[i].classList.add('open');
    exps[i].hidden = false;
    cards[i].setAttribute('aria-expanded', 'true');
    applyPage(i, false);
    open = i;

    const shouldCenter = items[i].dataset.tier === 'B';

    if (reduce) {
      medias[i].style.opacity = '1';
      revealMeta(i, true);
      busy = false;
      grid.classList.remove('gx-transitioning');
      exps[i].focus({ preventScroll: true });
      if (shouldCenter) {
        window.scrollTo({ top: centerTargetY(items[i]), behavior: 'instant' as ScrollBehavior });
      }
      return;
    }

    exps[i].focus({ preventScroll: true });

    /* Let the reflowed layout settle and paint before reading LAST
       geometry — layout write, rAF, geometry read, rAF, animation start. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipSiblings(sibFirst, i, -1);
        const destImg = pages[i][state[i]].querySelector('img')!;
        const lastRect = destImg.getBoundingClientRect();
        flipGhost(cardImg.currentSrc || cardImg.src, firstRect, lastRect, medias[i], () => {
          busy = false;
          grid.classList.remove('gx-transitioning');
        });
        if (shouldCenter) animateScrollTo(centerTargetY(items[i]), CENTER_MS);
        window.setTimeout(() => revealMeta(i, true), META_DELAY_MS - 20);
      });
    });
  }

  function closeProject(prev: number) {
    const reduce = reduceMotion();
    cancelCenterScroll();
    revealMeta(prev, false);

    if (reduce) {
      items[prev].classList.remove('open');
      exps[prev].hidden = true;
      cards[prev].setAttribute('aria-expanded', 'false');
      medias[prev].style.opacity = '';
      open = -1;
      busy = false;
      cards[prev].focus({ preventScroll: true });
      return;
    }

    const mediaImg = pages[prev][state[prev]].querySelector('img')!;
    const firstRect = mediaImg.getBoundingClientRect();
    const src = mediaImg.currentSrc || mediaImg.src;

    window.setTimeout(() => {
      grid.classList.add('gx-transitioning');
      const sibFirst = new Map<number, DOMRect>();
      items.forEach((it, j) => sibFirst.set(j, it.getBoundingClientRect()));

      /* TOGGLE — one reflow. No scrollIntoView, no window.scrollTo. */
      items[prev].classList.remove('open');
      exps[prev].hidden = true;
      cards[prev].setAttribute('aria-expanded', 'false');
      open = -1;

      cards[prev].focus({ preventScroll: true });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flipSiblings(sibFirst, prev, -1);
          const cardImg = cards[prev].querySelector<HTMLImageElement>('img.p1')!;
          const lastRect = cardImg.getBoundingClientRect();
          const cardFigure = cards[prev];
          cardFigure.style.opacity = '0';
          flipGhost(src, firstRect, lastRect, cardFigure, () => {
            cardFigure.style.opacity = '';
            medias[prev].style.opacity = '';
            busy = false;
            grid.classList.remove('gx-transitioning');
          });
        });
      });
    }, CLOSE_META_MS);
  }

  function setExpanded(i: number) {
    if (busy) return;
    const prev = open;
    if (i === prev) return;
    busy = true;

    if (prev >= 0 && i >= 0) {
      /* switching directly between two expanded projects: close then open */
      closeProject(prev);
      window.setTimeout(
        () => {
          busy = true;
          openProject(i);
        },
        reduceMotion() ? 0 : CLOSE_META_MS + FLIGHT_MS + 90
      );
      return;
    }

    if (i >= 0) openProject(i);
    else closeProject(prev);
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

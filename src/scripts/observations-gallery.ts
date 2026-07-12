/*
 * Observations page behavior:
 *  - local section navigation (Places / Writing / Image Studies) with
 *    scroll-spy active state, header-aware anchor scrolling, and hash sync
 *  - Places gallery: location filter (no reload)
 *  - Image Studies gallery: category filter (no reload)
 *  - one shared full-image viewer used by both galleries
 *
 * Filtering just toggles a `hidden` attribute per tile — cheap, and keeps
 * every tile's data attributes intact for the viewer's prev/next to
 * re-query the currently visible set on demand.
 */

const FADE_MS = 220;

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------------------------------------------------------------------- */
/* shared full-image viewer                                               */
/* ---------------------------------------------------------------------- */

interface ViewerController {
  open: (tile: HTMLButtonElement, visibleList: HTMLButtonElement[]) => void;
}

function initViewer(): ViewerController | null {
  const viewer = document.getElementById('obs-viewer') as HTMLElement | null;
  if (!viewer) return null;

  const viewerImg = viewer.querySelector('img') as HTMLImageElement;
  const viewerCaption = viewer.querySelector('.obs-viewer-caption') as HTMLElement;
  const closeBtn = viewer.querySelector('.obs-viewer-close') as HTMLButtonElement;
  const prevBtn = viewer.querySelector('.obs-viewer-prev') as HTMLButtonElement;
  const nextBtn = viewer.querySelector('.obs-viewer-next') as HTMLButtonElement;

  let openerEl: HTMLElement | null = null;
  let visibleList: HTMLButtonElement[] = [];
  let currentIndex = -1;
  let scrollY = 0;
  let isOpen = false;

  function renderCurrent() {
    const tile = visibleList[currentIndex];
    if (!tile) return;
    const full = tile.dataset.full || '';
    const title = tile.dataset.title || '';
    const seq = tile.dataset.seq || '';
    const count = tile.dataset.count || '';
    const width = tile.dataset.width || '';
    const height = tile.dataset.height || '';

    viewerImg.src = full;
    viewerImg.alt = `${title} image ${seq}`;
    if (width) viewerImg.width = parseInt(width, 10);
    if (height) viewerImg.height = parseInt(height, 10);
    const pad = (n: string) => n.padStart(2, '0');
    viewerCaption.textContent = `${title} · ${pad(seq)} / ${pad(count)}`;

    prevBtn.disabled = visibleList.length <= 1;
    nextBtn.disabled = visibleList.length <= 1;

    // preload immediate neighbors only
    const preload = (i: number) => {
      const t = visibleList[(i + visibleList.length) % visibleList.length];
      if (t?.dataset.full) {
        const im = new Image();
        im.src = t.dataset.full;
      }
    };
    if (visibleList.length > 1) {
      preload(currentIndex + 1);
      preload(currentIndex - 1);
    }
  }

  function open(tile: HTMLButtonElement, list: HTMLButtonElement[]) {
    if (isOpen) return;
    visibleList = list;
    currentIndex = visibleList.indexOf(tile);
    if (currentIndex < 0) return;
    isOpen = true;
    openerEl = tile;

    scrollY = window.scrollY;
    document.body.classList.add('obs-viewer-lock');
    document.body.style.top = `-${scrollY}px`;

    viewer.hidden = false;
    void viewer.offsetWidth;
    viewer.classList.add('open');
    renderCurrent();
    closeBtn.focus();

    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    viewer.classList.remove('open');
    document.removeEventListener('keydown', onKeydown);

    const finish = () => {
      viewer.hidden = true;
      viewerImg.src = '';
      document.body.classList.remove('obs-viewer-lock');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      openerEl?.focus({ preventScroll: true });
      openerEl = null;
    };
    if (reduceMotion()) finish();
    else window.setTimeout(finish, FADE_MS);
  }

  function step(dir: 1 | -1) {
    if (visibleList.length <= 1) return;
    currentIndex = (currentIndex + dir + visibleList.length) % visibleList.length;
    renderCurrent();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) close();
  });

  // simple, reliable swipe: horizontal drag past a threshold steps once
  let touchStartX = 0;
  let touchActive = false;
  viewer.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchActive = true;
  }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    touchActive = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
  }, { passive: true });

  return { open };
}

/* ---------------------------------------------------------------------- */
/* gallery (Places or Image Studies)                                      */
/* ---------------------------------------------------------------------- */

function initGallery(rootId: string, filterKey: string, viewer: ViewerController) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const filterBar = root.querySelector<HTMLElement>('.obs-filters');
  const grid = root.querySelector<HTMLElement>('.obs-grid');
  const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>('.obs-tile'));
  if (!grid) return;

  function visibleTiles(): HTMLButtonElement[] {
    return tiles.filter((t) => !t.hidden);
  }

  if (filterBar) {
    function applyFilter(value: string) {
      filterBar!.querySelectorAll<HTMLButtonElement>('.obs-filter').forEach((btn) => {
        const on = (btn.dataset[filterKey] || 'all') === value;
        btn.setAttribute('aria-pressed', String(on));
      });
      tiles.forEach((tile) => {
        const show = value === 'all' || tile.dataset[filterKey] === value;
        tile.hidden = !show;
      });
    }

    filterBar.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.obs-filter');
      if (!btn) return;
      applyFilter(btn.dataset[filterKey] || 'all');
    });
  }

  grid.addEventListener('click', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLButtonElement>('.obs-tile');
    if (!tile || tile.hidden) return;
    viewer.open(tile, visibleTiles());
  });
}

/* ---------------------------------------------------------------------- */
/* local section navigation (scroll-spy + header-aware anchor scroll)     */
/* ---------------------------------------------------------------------- */

function initSubnav() {
  const nav = document.querySelector<HTMLElement>('.obs-subnav');
  if (!nav) return;

  // The browser's default scroll restoration can silently reapply a
  // remembered scroll position on top of (or racing) the explicit
  // hash-driven jump below, on repeat visits within the same session
  // history. This page drives scroll position itself, so take it over.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.obs-subnav-link'));
  const sections = links
    .map((link) => document.getElementById(link.dataset.target || ''))
    .filter((el): el is HTMLElement => !!el);
  if (!sections.length) return;

  function setActive(id: string) {
    links.forEach((link) => {
      link.classList.toggle('active', link.dataset.target === id);
    });
  }

  function scrollToSection(id: string, instant: boolean) {
    const el = document.getElementById(id);
    if (!el) return;
    // 'auto' defers to the page's CSS scroll-behavior (smooth site-wide, via
    // html{scroll-behavior:smooth}), so an "instant" jump silently becomes a
    // multi-hundred-ms animation that races any code reading scroll position
    // shortly after. 'instant' is the one value that reliably bypasses CSS
    // scroll-behavior and jumps synchronously across evergreen browsers.
    const behavior = instant || reduceMotion() ? 'instant' : 'smooth';
    el.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'start' });
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.target || '';
      if (!id) return;
      scrollToSection(id, false);
      history.pushState(null, '', `#${id}`);
      setActive(id);
    });
  });

  window.addEventListener('popstate', () => {
    const id = location.hash.replace('#', '');
    if (id && sections.some((s) => s.id === id)) {
      scrollToSection(id, false);
      setActive(id);
    }
  });

  // Scroll-spy: the active section is whichever one's top edge most
  // recently crossed the reference line just below the fixed header — i.e.
  // the section the reference line currently sits inside. Driven directly
  // off real scroll events rather than IntersectionObserver (whose
  // threshold-crossing notifications batch and order unpredictably across
  // instant jumps, smooth scrolls, and repeat same-tab navigations) and
  // using "closest crossed top" rather than "largest overlap" (which
  // unfairly favors a very tall section over a short neighbor sharing the
  // same window).
  function computeActiveSection(): string | null {
    const referenceY = 100;
    let best: HTMLElement | null = null;
    for (const section of sections) {
      const top = section.getBoundingClientRect().top;
      if (top <= referenceY && (!best || top > best.getBoundingClientRect().top)) {
        best = section;
      }
    }
    return (best ?? sections[0])?.id ?? null;
  }

  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      const id = computeActiveSection();
      if (id) setActive(id);
      scrollTicking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // direct hash link on initial load: land instantly (a real 'instant' jump,
  // not 'auto' — see scrollToSection above). The browser's own native
  // fragment-on-load scroll can independently kick in around the same time
  // and land short of (or past) the target, so this re-asserts the jump on
  // a few early animation frames until the target section is confirmed in
  // place rather than trusting a single call.
  const initialHashId = location.hash.replace('#', '');
  if (initialHashId && sections.some((s) => s.id === initialHashId)) {
    setActive(initialHashId);
    scrollToSection(initialHashId, true);
    let attempts = 0;
    const settle = () => {
      attempts++;
      const el = document.getElementById(initialHashId);
      const inPlace = el && Math.abs(el.getBoundingClientRect().top - 100) < 4;
      if (!inPlace && attempts < 20) {
        scrollToSection(initialHashId, true);
        window.requestAnimationFrame(settle);
      } else {
        setActive(initialHashId);
      }
    };
    window.requestAnimationFrame(settle);
  } else {
    const id = computeActiveSection();
    if (id) setActive(id);
  }
}

/* ---------------------------------------------------------------------- */

function init() {
  const viewer = initViewer();
  if (!viewer) return;

  initGallery('places', 'slug', viewer);
  initGallery('image-studies', 'category', viewer);
  initSubnav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

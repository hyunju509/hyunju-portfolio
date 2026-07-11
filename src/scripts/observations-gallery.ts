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
    el.scrollIntoView({ behavior: instant || reduceMotion() ? 'auto' : 'smooth', block: 'start' });
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
    if (id) scrollToSection(id, false);
  });

  // direct hash link on initial load: land instantly, no animation jank
  if (location.hash) {
    const id = location.hash.replace('#', '');
    if (sections.some((s) => s.id === id)) {
      window.requestAnimationFrame(() => scrollToSection(id, true));
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActive((visible[0].target as HTMLElement).id);
      }
    },
    { rootMargin: '-100px 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] }
  );
  sections.forEach((section) => observer.observe(section));
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

/*
 * Places gallery: location filter (no reload) + a restrained full-image
 * viewer. Filtering just toggles a `hidden` class per tile — cheap, and
 * keeps every tile's data attributes intact for the viewer's prev/next
 * to re-query the currently visible set on demand.
 */

const FADE_MS = 220;

function init() {
  const root = document.getElementById('obs-places');
  if (!root) return;

  const filterBar = root.querySelector<HTMLElement>('.obs-filters');
  const grid = root.querySelector<HTMLElement>('.obs-grid');
  const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>('.obs-tile'));
  if (!filterBar || !grid) return;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- filter ---- */
  function applyFilter(slug: string) {
    filterBar!.querySelectorAll<HTMLButtonElement>('.obs-filter').forEach((btn) => {
      const on = btn.dataset.slug === slug;
      btn.setAttribute('aria-pressed', String(on));
    });
    tiles.forEach((tile) => {
      const show = slug === 'all' || tile.dataset.slug === slug;
      tile.hidden = !show;
    });
  }

  filterBar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.obs-filter');
    if (!btn) return;
    applyFilter(btn.dataset.slug || 'all');
  });

  /* ---- viewer ---- */
  const viewer = document.getElementById('obs-viewer') as HTMLElement | null;
  if (!viewer) return;
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

  function visibleTiles(): HTMLButtonElement[] {
    return tiles.filter((t) => !t.hidden);
  }

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
    viewerImg.alt = `${title} photograph ${seq}`;
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

  function openViewer(tile: HTMLButtonElement) {
    if (isOpen) return;
    visibleList = visibleTiles();
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

  function closeViewer() {
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
    if (e.key === 'Escape') { e.preventDefault(); closeViewer(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }

  grid!.addEventListener('click', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLButtonElement>('.obs-tile');
    if (!tile || tile.hidden) return;
    openViewer(tile);
  });

  closeBtn.addEventListener('click', closeViewer);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) closeViewer();
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

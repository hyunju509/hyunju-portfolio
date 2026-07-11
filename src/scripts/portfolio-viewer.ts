import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
// @ts-expect-error -- Vite `?url` import returns the built worker asset URL.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const SPREAD_BREAKPOINT = 900;
const MAX_RENDER_DPR = 2;
const THUMB_TARGET_WIDTH = 220;

type Spread = number[];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function computeSpreads(totalPages: number, mode: 'spread' | 'single'): Spread[] {
  if (mode === 'single') {
    return Array.from({ length: totalPages }, (_, i) => [i + 1]);
  }
  const spreads: Spread[] = [];
  if (totalPages >= 1) spreads.push([1]);
  for (let p = 2; p <= totalPages; p += 2) {
    if (p + 1 <= totalPages) spreads.push([p, p + 1]);
    else spreads.push([p]);
  }
  return spreads;
}

function init() {
  const viewer = document.getElementById('viewer');
  if (!viewer) return;
  // Guard against double initialization (e.g. module evaluated twice in dev),
  // which would stack duplicate keydown/click listeners.
  if (viewer.dataset.pvInit === '1') return;
  viewer.dataset.pvInit = '1';

  const pdfSrc = viewer.dataset.pdfSrc || '';
  const declaredTotal = Number(viewer.dataset.totalPages || '0');

  const stage = document.getElementById('v-stage') as HTMLElement;
  const book = document.getElementById('v-book') as HTMLElement;
  const leafA = document.getElementById('v-leaf-a') as HTMLElement;
  const leafB = document.getElementById('v-leaf-b') as HTMLElement;
  const countEl = document.getElementById('v-count') as HTMLElement;
  const prevBtn = document.getElementById('v-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('v-next') as HTMLButtonElement;
  const zonePrev = document.getElementById('v-zone-prev') as HTMLElement;
  const zoneNext = document.getElementById('v-zone-next') as HTMLElement;
  const backBtn = document.getElementById('v-back') as HTMLButtonElement;
  const indexBtn = document.getElementById('v-index-btn') as HTMLButtonElement;
  const indexCloseBtn = document.getElementById('v-index-close') as HTMLButtonElement;
  const indexPanel = document.getElementById('v-index') as HTMLElement;
  const thumbButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.v-thumb'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pdfDoc: PDFDocumentProxy | null = null;
  let totalPages = declaredTotal;
  let mode: 'spread' | 'single' = window.innerWidth >= SPREAD_BREAKPOINT ? 'spread' : 'single';
  let spreads: Spread[] = computeSpreads(totalPages, mode);
  let currentSpreadIndex = 0;

  interface CanvasEntry {
    canvas: HTMLCanvasElement;
    forWidth: number;
    forHeight: number;
  }
  const pageCache = new Map<number, CanvasEntry>();
  const renderTasks = new Map<number, RenderTask>();
  const thumbObserved = new Set<number>();

  function goBack() {
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin) {
        history.back();
        return;
      }
    } catch (err) {}
    location.href = '/';
  }

  function showError(message: string) {
    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'v-inline-error';
    const p = document.createElement('p');
    p.textContent = message;
    wrap.appendChild(p);
    stage.appendChild(wrap);
  }

  let renderSeq = 0;

  async function renderPageInto(pageNum: number, slot: HTMLElement, seq: number): Promise<void> {
    if (seq !== renderSeq) return;
    slot.innerHTML = '';
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', `Portfolio page ${pageNum}`);

    if (!pdfDoc) return;

    const rect = slot.getBoundingClientRect();
    const targetWidth = Math.max(1, rect.width);
    const targetHeight = Math.max(1, rect.height);
    const cached = pageCache.get(pageNum);

    if (cached && cached.forWidth === Math.round(targetWidth) && cached.forHeight === Math.round(targetHeight)) {
      slot.appendChild(cached.canvas);
      return;
    }

    const existingTask = renderTasks.get(pageNum);
    if (existingTask) {
      try { existingTask.cancel(); } catch (err) {}
      renderTasks.delete(pageNum);
    }

    let page: PDFPageProxy;
    try {
      page = await pdfDoc.getPage(pageNum);
    } catch (err) {
      console.error('[portfolio] Failed to load page', pageNum, err);
      return;
    }

    const unscaled = page.getViewport({ scale: 1 });
    const fitScale = Math.min(targetWidth / unscaled.width, targetHeight / unscaled.height);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
    const renderScale = fitScale * dpr;
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    canvas.className = 'v-canvas';
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const task = page.render({ canvasContext: ctx, viewport });
    renderTasks.set(pageNum, task);
    try {
      await task.promise;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return;
      console.error('[portfolio] Render failed for page', pageNum, err);
      return;
    } finally {
      renderTasks.delete(pageNum);
    }

    pageCache.set(pageNum, { canvas, forWidth: Math.round(targetWidth), forHeight: Math.round(targetHeight) });
    if (seq !== renderSeq) return;
    slot.appendChild(canvas);
  }

  function pruneCache(keepPages: Set<number>) {
    for (const [pageNum] of pageCache) {
      if (!keepPages.has(pageNum)) pageCache.delete(pageNum);
    }
  }

  function applyTransition(direction: 1 | -1) {
    if (reduceMotion) return;
    const offset = direction * 6;
    book.style.transition = 'none';
    book.style.opacity = '0';
    book.style.transform = `translateX(${offset}px)`;
    void book.offsetWidth;
    book.style.transition = 'opacity 260ms ease-out, transform 260ms ease-out';
    book.style.opacity = '1';
    book.style.transform = 'translateX(0)';
  }

  async function renderSpread(index: number, direction: 1 | -1 = 1) {
    const seq = ++renderSeq;
    currentSpreadIndex = Math.max(0, Math.min(spreads.length - 1, index));
    const spread = spreads[currentSpreadIndex];
    const isSpreadMode = mode === 'spread';
    const twoPages = spread.length === 2;

    book.classList.toggle('spread', isSpreadMode);
    book.classList.toggle('single', !isSpreadMode);
    book.classList.toggle('two', twoPages);

    leafB.style.display = twoPages ? '' : 'none';

    await renderPageInto(spread[0], leafA, seq);
    if (seq !== renderSeq) return;
    if (twoPages) {
      await renderPageInto(spread[1], leafB, seq);
      if (seq !== renderSeq) return;
    }

    const keep = new Set<number>();
    spread.forEach((p) => keep.add(p));
    const prevSpread = spreads[currentSpreadIndex - 1];
    const nextSpread = spreads[currentSpreadIndex + 1];
    if (prevSpread) prevSpread.forEach((p) => keep.add(p));
    if (nextSpread) nextSpread.forEach((p) => keep.add(p));
    pruneCache(keep);

    if (prevSpread) prevSpread.forEach((p) => prefetchPage(p));
    if (nextSpread) nextSpread.forEach((p) => prefetchPage(p));

    const first = spread[0];
    const last = spread[spread.length - 1];
    countEl.textContent = twoPages
      ? `${pad(first)}–${pad(last)} / ${pad(totalPages)}`
      : `${pad(first)} / ${pad(totalPages)}`;

    prevBtn.disabled = currentSpreadIndex === 0;
    nextBtn.disabled = currentSpreadIndex === spreads.length - 1;

    applyTransition(direction);
  }

  async function prefetchPage(pageNum: number) {
    if (!pdfDoc || pageCache.has(pageNum)) return;
    try {
      await pdfDoc.getPage(pageNum);
    } catch (err) {}
  }

  function goSpread(delta: 1 | -1) {
    renderSpread(currentSpreadIndex + delta, delta);
  }

  function isIndexOpen(): boolean {
    return indexPanel.classList.contains('open');
  }

  function openIndex() {
    indexPanel.classList.add('open');
    indexPanel.setAttribute('aria-hidden', 'false');
    indexCloseBtn.focus();
    scheduleThumbObservation();
  }

  function closeIndex() {
    indexPanel.classList.remove('open');
    indexPanel.setAttribute('aria-hidden', 'true');
    indexBtn.focus();
  }

  async function renderThumb(pageNum: number, slot: HTMLElement) {
    if (!pdfDoc || thumbObserved.has(pageNum)) return;
    thumbObserved.add(pageNum);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = THUMB_TARGET_WIDTH / unscaled.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
      slot.appendChild(canvas);
    } catch (err) {
      console.error('[portfolio] Thumbnail render failed for page', pageNum, err);
    }
  }

  let thumbObserver: IntersectionObserver | null = null;
  function scheduleThumbObservation() {
    if (thumbObserver) return;
    thumbObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const slot = entry.target as HTMLElement;
          const pageNum = Number(slot.dataset.page);
          renderThumb(pageNum, slot);
          thumbObserver?.unobserve(slot);
        });
      },
      { root: indexPanel, rootMargin: '200px' }
    );
    document.querySelectorAll<HTMLElement>('.v-thumb-canvas').forEach((slot) => {
      thumbObserver?.observe(slot);
    });
  }

  function spreadIndexForPage(pageNum: number): number {
    for (let i = 0; i < spreads.length; i++) {
      if (spreads[i].includes(pageNum)) return i;
    }
    return 0;
  }

  function handleResize() {
    const nextMode: 'spread' | 'single' = window.innerWidth >= SPREAD_BREAKPOINT ? 'spread' : 'single';
    const leadPage = spreads[currentSpreadIndex]?.[0] ?? 1;

    if (nextMode !== mode) {
      mode = nextMode;
      spreads = computeSpreads(totalPages, mode);
      pageCache.clear();
      renderSpread(spreadIndexForPage(leadPage), 1);
    } else {
      pageCache.clear();
      renderSpread(currentSpreadIndex, 1);
    }
  }

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(handleResize, 180);
  });

  prevBtn.addEventListener('click', () => goSpread(-1));
  nextBtn.addEventListener('click', () => goSpread(1));
  zonePrev.addEventListener('click', () => goSpread(-1));
  zoneNext.addEventListener('click', () => goSpread(1));
  backBtn.addEventListener('click', goBack);
  indexBtn.addEventListener('click', openIndex);
  indexCloseBtn.addEventListener('click', closeIndex);

  thumbButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pageNum = Number(btn.dataset.page);
      closeIndex();
      renderSpread(spreadIndexForPage(pageNum), 1);
    });
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'Escape') {
      if (isIndexOpen()) closeIndex();
      else goBack();
      return;
    }

    if (isIndexOpen()) return;

    if (e.key === 'ArrowLeft') goSpread(-1);
    else if (e.key === 'ArrowRight') goSpread(1);
    else if (e.key === 'Home') renderSpread(0, -1);
    else if (e.key === 'End') renderSpread(spreads.length - 1, 1);
  });

  if (!pdfSrc || !totalPages) {
    showError('The portfolio PDF could not be loaded.');
    return;
  }

  pdfjsLib
    .getDocument(pdfSrc)
    .promise.then((doc) => {
      pdfDoc = doc;
      totalPages = doc.numPages;
      spreads = computeSpreads(totalPages, mode);
      renderSpread(0, 1);
    })
    .catch((err) => {
      console.error('[portfolio] Failed to load PDF at runtime:', err);
      showError('The portfolio PDF could not be loaded.');
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

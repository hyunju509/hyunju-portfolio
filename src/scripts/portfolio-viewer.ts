import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
// @ts-expect-error -- Vite `?url` import returns the built worker asset URL.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const SPREAD_BREAKPOINT = 900;
const MAX_RENDER_DPR = 2;
const THUMB_TARGET_WIDTH = 220;
const TURN_MS = 760;
const TURN_EASE = 'cubic-bezier(.33,0,.2,1)';

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
  let turning = false;

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

  async function getOrRenderCanvas(
    pageNum: number,
    targetWidth: number,
    targetHeight: number
  ): Promise<HTMLCanvasElement | null> {
    const cached = pageCache.get(pageNum);
    if (cached && cached.forWidth === Math.round(targetWidth) && cached.forHeight === Math.round(targetHeight)) {
      return cached.canvas;
    }
    if (!pdfDoc) return null;

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
      return null;
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
    if (!ctx) return null;

    const task = page.render({ canvasContext: ctx, viewport });
    renderTasks.set(pageNum, task);
    try {
      await task.promise;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return null;
      console.error('[portfolio] Render failed for page', pageNum, err);
      return null;
    } finally {
      renderTasks.delete(pageNum);
    }

    pageCache.set(pageNum, { canvas, forWidth: Math.round(targetWidth), forHeight: Math.round(targetHeight) });
    return canvas;
  }

  function attachCanvas(slot: HTMLElement, canvas: HTMLCanvasElement, pageNum: number) {
    slot.innerHTML = '';
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', `Portfolio page ${pageNum}`);
    slot.appendChild(canvas);
  }

  async function renderPageInto(pageNum: number, slot: HTMLElement, seq: number): Promise<void> {
    if (seq !== renderSeq) return;
    slot.innerHTML = '';
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', `Portfolio page ${pageNum}`);

    const rect = slot.getBoundingClientRect();
    const canvas = await getOrRenderCanvas(pageNum, Math.max(1, rect.width), Math.max(1, rect.height));
    if (!canvas || seq !== renderSeq) return;
    slot.appendChild(canvas);
  }

  function pruneCache(keepPages: Set<number>) {
    for (const [pageNum] of pageCache) {
      if (!keepPages.has(pageNum)) pageCache.delete(pageNum);
    }
  }

  async function prefetchPage(pageNum: number, referenceSlot: HTMLElement) {
    if (!pdfDoc || pageCache.has(pageNum)) return;
    const rect = referenceSlot.getBoundingClientRect();
    await getOrRenderCanvas(pageNum, Math.max(1, rect.width), Math.max(1, rect.height));
  }

  function maintainCache(index: number) {
    const spread = spreads[index];
    const keep = new Set<number>();
    spread.forEach((p) => keep.add(p));
    const prevSpread = spreads[index - 1];
    const nextSpread = spreads[index + 1];
    if (prevSpread) prevSpread.forEach((p) => keep.add(p));
    if (nextSpread) nextSpread.forEach((p) => keep.add(p));
    pruneCache(keep);
    if (prevSpread) prevSpread.forEach((p) => prefetchPage(p, leafA));
    if (nextSpread) nextSpread.forEach((p) => prefetchPage(p, leafA));
  }

  function updateChrome(index: number) {
    const spread = spreads[index];
    const twoPages = spread.length === 2;
    const first = spread[0];
    const last = spread[spread.length - 1];
    countEl.textContent = twoPages
      ? `${pad(first)}–${pad(last)} / ${pad(totalPages)}`
      : `${pad(first)} / ${pad(totalPages)}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === spreads.length - 1;
  }

  /*
   * Restrained direct transition: used for mobile single-page nav, Home/End,
   * Index thumbnail jumps, resize, and any shape-changing boundary (Cover
   * <-> first spread) where the two-sheet book turn doesn't apply. Never
   * used for adjacent desktop spread-to-spread navigation.
   */
  function applyTransition(direction: 1 | -1) {
    if (reduceMotion) return;
    book.style.transition = 'none';
    if (mode === 'single') {
      const offset = direction * 24;
      book.style.opacity = '0.92';
      book.style.transform = `translateX(${offset}px)`;
      void book.offsetWidth;
      book.style.transition = 'opacity 360ms ease-out, transform 360ms ease-out';
    } else {
      const offset = direction * 14;
      book.style.opacity = '0';
      book.style.transform = `translateX(${offset}px)`;
      void book.offsetWidth;
      book.style.transition = 'opacity 220ms ease-out, transform 220ms ease-out';
    }
    book.style.opacity = '1';
    book.style.transform = 'translateX(0)';
  }

  /* ---- restrained/direct spread render: Home, End, Index thumbnails, resize, non-adjacent or shape-changing nav ---- */
  async function renderSpread(index: number, direction: 1 | -1 = 1) {
    if (turning) return;
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

    maintainCache(currentSpreadIndex);
    updateChrome(currentSpreadIndex);
    applyTransition(direction);
  }

  /*
   * Book page-turn: adjacent ArrowLeft/Right, Prev/Next, click zones
   * (desktop, uniform two-page spreads only).
   *
   * Front/back-face sheet illusion. Forward example (A|B -> C|D):
   *   static base:   A stays on the left untouched, D is placed on the
   *                  right immediately (hidden under the turning sheet).
   *   turning sheet: front face = outgoing B, back face = incoming C.
   *                  Rotates -180deg around its left (binding) edge, so
   *                  it sweeps from the right slot to exactly cover the
   *                  left slot by the time it settles.
   *   on settle:     the left slot is swapped from A to C (imperceptible,
   *                  since the sheet's back face already shows C there)
   *                  and the temporary sheet is removed.
   * Backward mirrors this around the right (binding) edge.
   */
  function setNavLocked(locked: boolean) {
    turning = locked;
    viewer.classList.toggle('turning', locked);
  }

  function rectRelativeTo(el: HTMLElement, container: HTMLElement) {
    const a = el.getBoundingClientRect();
    const b = container.getBoundingClientRect();
    return { top: a.top - b.top, left: a.left - b.left, width: a.width, height: a.height };
  }

  async function performPageTurn(delta: 1 | -1, nextIndex: number) {
    const cur = spreads[currentSpreadIndex];
    const next = spreads[nextIndex];
    if (cur.length !== 2 || next.length !== 2) {
      renderSpread(nextIndex, delta);
      return;
    }

    const turningLeaf = delta === 1 ? leafB : leafA;
    const staticLeaf = delta === 1 ? leafA : leafB;
    const frontPageNum = delta === 1 ? cur[1] : cur[0];
    const backPageNum = delta === 1 ? next[0] : next[1];
    const turningLeafNewPageNum = delta === 1 ? next[1] : next[0];

    const frontCanvas = turningLeaf.querySelector('canvas') as HTMLCanvasElement | null;
    if (!frontCanvas) {
      renderSpread(nextIndex, delta);
      return;
    }

    setNavLocked(true);
    const seq = ++renderSeq;
    currentSpreadIndex = nextIndex;

    const refRect = leafA.getBoundingClientRect();
    const targetW = Math.max(1, refRect.width);
    const targetH = Math.max(1, refRect.height);

    const [backCanvas, turningLeafNewCanvas] = await Promise.all([
      getOrRenderCanvas(backPageNum, targetW, targetH),
      getOrRenderCanvas(turningLeafNewPageNum, targetW, targetH),
    ]);
    if (seq !== renderSeq || !backCanvas || !turningLeafNewCanvas) {
      setNavLocked(false);
      return;
    }

    const r = rectRelativeTo(frontCanvas, book);
    const sheet = document.createElement('div');
    sheet.className = 'v-turn-sheet';
    sheet.style.top = `${r.top}px`;
    sheet.style.left = `${r.left}px`;
    sheet.style.width = `${r.width}px`;
    sheet.style.height = `${r.height}px`;
    sheet.style.transformOrigin = delta === 1 ? 'left center' : 'right center';

    const front = document.createElement('div');
    front.className = 'v-turn-face v-turn-face-front';
    front.appendChild(frontCanvas);
    const frontShade = document.createElement('div');
    frontShade.className = 'v-turn-shade';
    front.appendChild(frontShade);

    const back = document.createElement('div');
    back.className = 'v-turn-face v-turn-face-back';
    back.appendChild(backCanvas);
    const backShade = document.createElement('div');
    backShade.className = 'v-turn-shade';
    back.appendChild(backShade);

    sheet.appendChild(front);
    sheet.appendChild(back);
    book.appendChild(sheet);

    attachCanvas(turningLeaf, turningLeafNewCanvas, turningLeafNewPageNum);

    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      attachCanvas(staticLeaf, backCanvas!, backPageNum);
      if (sheet.parentElement) sheet.parentElement.removeChild(sheet);
      setNavLocked(false);
      if (seq === renderSeq) maintainCache(currentSpreadIndex);
    }

    requestAnimationFrame(() => {
      if (seq !== renderSeq) {
        finish();
        return;
      }
      const anim = delta === 1 ? 'bookTurnForward' : 'bookTurnBackward';
      sheet.style.animation = `${anim} ${TURN_MS}ms ${TURN_EASE} forwards`;
      frontShade.style.animation = `turnFold ${TURN_MS}ms ease-out forwards`;
      backShade.style.animation = `turnFold ${TURN_MS}ms ease-out forwards`;

      sheet.addEventListener('animationend', finish, { once: true });
      window.setTimeout(finish, TURN_MS + 140);
    });

    window.setTimeout(() => {
      if (seq !== renderSeq) return;
      updateChrome(currentSpreadIndex);
    }, Math.round(TURN_MS * 0.55));
  }

  function goSpread(delta: 1 | -1) {
    if (turning) return;
    const nextIndex = currentSpreadIndex + delta;
    if (nextIndex < 0 || nextIndex > spreads.length - 1) return;
    const uniform =
      mode === 'spread' &&
      spreads[currentSpreadIndex].length === 2 &&
      spreads[nextIndex].length === 2;
    if (uniform && !reduceMotion) {
      performPageTurn(delta, nextIndex);
    } else {
      renderSpread(nextIndex, delta);
    }
  }

  function isIndexOpen(): boolean {
    return indexPanel.classList.contains('open');
  }

  function openIndex() {
    if (turning) return;
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

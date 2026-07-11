import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
// @ts-expect-error -- Vite `?url` import returns the built worker asset URL.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const SPREAD_BREAKPOINT = 900;
const MAX_RENDER_DPR = 2;
const THUMB_TARGET_WIDTH = 220;
const TURN_MS = 960;
const STRIP_COUNT = 12;
const STRIP_LAG = 0.16;
const STRIP_LIFT = 5;
const STRIP_SHADE_PEAK = 0.12;

type Spread = number[];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/*
 * Small cubic-bezier(x1,y1,x2,y2) evaluator so the page-turn's master
 * progress can be eased in plain JS (Newton-Raphson on the bezier's x
 * component, then evaluate y) — this lets one coordinated progress value
 * drive both the master rotation and every strip's curvature in the same
 * animation frame, instead of letting independent CSS transitions drift
 * out of sync with each other.
 */
function makeBezierEasing(x1: number, y1: number, x2: number, y2: number) {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const C = (a1: number) => 3 * a1;
  const calc = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
  function tForX(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = calc(t, x1, x2) - x;
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= dx / s;
    }
    return clamp01(t);
  }
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calc(tForX(x), y1, y2);
  };
}
const turnEase = makeBezierEasing(0.22, 0.75, 0.18, 1);

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
  let canonicalAspect = 1372 / 896;

  /*
   * One canonical page rectangle, derived from the PDF's own aspect ratio
   * plus the available viewer box, used for every leaf regardless of how
   * many pages are currently visible. Previously each leaf sized itself
   * via flex:1 1 0, so a lone Cover leaf (no sibling to split the row
   * with) stretched to claim the full row — roughly double a normal
   * spread page's width. Fixing the leaf to this canonical box removes
   * that dependency on sibling count entirely.
   */
  function applyPageBox() {
    const stageRect = stage.getBoundingClientRect();
    const availW = Math.max(1, stageRect.width);
    const availH = Math.max(1, stageRect.height);
    const maxSingleW = mode === 'spread' ? availW / 2 : availW;
    let w = maxSingleW;
    let h = w / canonicalAspect;
    if (h > availH) {
      h = availH;
      w = h * canonicalAspect;
    }
    book.style.setProperty('--page-w', `${Math.floor(w)}px`);
    book.style.setProperty('--page-h', `${Math.floor(h)}px`);
  }

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

  /*
   * Slice a narrow vertical region out of an already-rendered page canvas
   * into its own small canvas, reusing the existing render (no PDF
   * re-render, no quality loss beyond a plain canvas-to-canvas copy).
   */
  function sliceStripCanvas(
    source: HTMLCanvasElement,
    index: number,
    count: number,
    cssW: number,
    cssH: number
  ): HTMLCanvasElement {
    const srcH = source.height;
    const sx = Math.round((index / count) * source.width);
    const sxEnd = Math.round(((index + 1) / count) * source.width);
    const sw = Math.max(1, sxEnd - sx);
    const strip = document.createElement('canvas');
    strip.width = sw;
    strip.height = srcH;
    strip.style.width = `${cssW}px`;
    strip.style.height = `${cssH}px`;
    const ctx = strip.getContext('2d');
    if (ctx) ctx.drawImage(source, sx, 0, sw, srcH, 0, 0, sw, srcH);
    return strip;
  }

  interface TurnStrip {
    el: HTMLElement;
    frontShade: HTMLElement;
    backShade: HTMLElement;
    p: number; // normalized distance from the binding edge: 0 = at spine, 1 = outer edge
  }

  function buildStrips(
    sheet: HTMLElement,
    cssW: number,
    cssH: number,
    frontSource: HTMLCanvasElement,
    backSource: HTMLCanvasElement,
    direction: 1 | -1
  ): TurnStrip[] {
    const stripCssW = cssW / STRIP_COUNT;
    const strips: TurnStrip[] = [];
    for (let k = 0; k < STRIP_COUNT; k++) {
      const leftPx = k * stripCssW;
      const stripEl = document.createElement('div');
      stripEl.className = 'v-turn-strip';
      stripEl.style.left = `${leftPx}px`;
      stripEl.style.width = `${stripCssW}px`;
      stripEl.style.height = `${cssH}px`;
      // Every strip pivots around the SAME shared binding axis (the sheet's
      // own left or right edge), not its own local edge — otherwise
      // adjacent strips would fan out independently instead of bending
      // together as one continuous sheet.
      const pivotX = direction === 1 ? -leftPx : cssW - leftPx;
      stripEl.style.transformOrigin = `${pivotX}px center`;

      const front = document.createElement('div');
      front.className = 'v-turn-face v-turn-face-front';
      front.appendChild(sliceStripCanvas(frontSource, k, STRIP_COUNT, stripCssW, cssH));
      const frontShade = document.createElement('div');
      frontShade.className = 'v-turn-shade';
      front.appendChild(frontShade);

      const back = document.createElement('div');
      back.className = 'v-turn-face v-turn-face-back';
      back.appendChild(sliceStripCanvas(backSource, k, STRIP_COUNT, stripCssW, cssH));
      const backShade = document.createElement('div');
      backShade.className = 'v-turn-shade';
      back.appendChild(backShade);

      stripEl.appendChild(front);
      stripEl.appendChild(back);
      sheet.appendChild(stripEl);

      const p = direction === 1 ? k / (STRIP_COUNT - 1) : (STRIP_COUNT - 1 - k) / (STRIP_COUNT - 1);
      strips.push({ el: stripEl, frontShade, backShade, p });
    }
    return strips;
  }

  /*
   * One master progress value (0..1 over TURN_MS, eased) drives every
   * strip each frame — each strip reads a slightly time-lagged version of
   * that same progress (more lag toward the outer edge, shrinking to zero
   * as the turn completes so every strip converges back to flat at the
   * end), which is what produces the gentle distributed curve instead of
   * a rigid flat board swinging on a hinge.
   */
  function runTurnAnimation(strips: TurnStrip[], direction: 1 | -1, onDone: () => void, isCancelled: () => boolean) {
    const start = performance.now();
    function frame(now: number) {
      if (isCancelled()) {
        onDone();
        return;
      }
      const rawT = clamp01((now - start) / TURN_MS);
      for (const s of strips) {
        const laggedT = clamp01(rawT - STRIP_LAG * s.p * (1 - rawT));
        const eased = turnEase(laggedT);
        const angle = direction === 1 ? -180 * eased : 180 * eased;
        const lift = Math.sin(eased * Math.PI) * STRIP_LIFT * (0.5 + 0.5 * s.p);
        s.el.style.transform = `rotateY(${angle}deg) translateZ(${lift}px)`;
        const shade = Math.sin(eased * Math.PI) * STRIP_SHADE_PEAK;
        s.frontShade.style.opacity = String(shade);
        s.backShade.style.opacity = String(shade);
      }
      if (rawT < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }
    requestAnimationFrame(frame);
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
    book.appendChild(sheet);

    attachCanvas(turningLeaf, turningLeafNewCanvas, turningLeafNewPageNum);

    const strips = buildStrips(sheet, r.width, r.height, frontCanvas, backCanvas, delta);

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
      runTurnAnimation(strips, delta, finish, () => seq !== renderSeq);
      window.setTimeout(finish, TURN_MS + 500);
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
      applyPageBox();
      renderSpread(spreadIndexForPage(leadPage), 1);
    } else {
      pageCache.clear();
      applyPageBox();
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
    .promise.then(async (doc) => {
      pdfDoc = doc;
      totalPages = doc.numPages;
      try {
        const page1 = await doc.getPage(1);
        const vp = page1.getViewport({ scale: 1 });
        canonicalAspect = vp.width / vp.height;
      } catch (err) {
        console.error('[portfolio] Failed to read page 1 dimensions:', err);
      }
      applyPageBox();
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

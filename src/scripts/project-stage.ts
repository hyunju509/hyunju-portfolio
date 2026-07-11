/*
 * Project Stage — two-axis architectural project browser.
 * Horizontal axis: pages within a project (translateX track).
 * Vertical axis: project sequence (native scroll + snap proximity).
 * Opens in place from a Selected Works card via a FLIP-style ghost.
 */

function init() {
  const stage = document.getElementById('pstage');
  if (!stage) return;
  if (stage.dataset.psInit === '1') return;
  stage.dataset.psInit = '1';

  const scroller = document.getElementById('ps-scroll') as HTMLElement;
  const titleEl = document.getElementById('ps-title') as HTMLElement;
  const pcountEl = document.getElementById('ps-pcount') as HTMLElement;
  const gcountEl = document.getElementById('ps-gcount') as HTMLElement;
  const backBtn = document.getElementById('ps-back') as HTMLButtonElement;
  const ghost = document.getElementById('ps-ghost') as HTMLElement;
  const ghostImg = document.getElementById('ps-ghost-img') as HTMLImageElement;

  const sections = Array.from(stage.querySelectorAll<HTMLElement>('.ps-proj'));
  const order = sections.map((s) => s.dataset.id || '');
  const slugs = sections.map((s) => s.dataset.slug || '');
  const titles = sections.map((s) => s.dataset.title || '');
  const tracks = sections.map((s) => s.querySelector<HTMLElement>('.ps-track')!);
  const pageEls = sections.map((s) => Array.from(s.querySelectorAll<HTMLElement>('.ps-page')));
  const counts = pageEls.map((a) => a.length);
  const state: number[] = counts.map(() => 0);

  let active = 0;
  let isOpen = false;
  let ghostTimer = 0;

  const pad = (n: number) => String(n).padStart(2, '0');
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cardFor = (id: string) =>
    document.querySelector<HTMLElement>(`.proj-card[data-id="${id}"]`);

  function step(i: number): number {
    const pages = pageEls[i];
    if (pages.length < 2) return 0;
    return pages[1].offsetLeft - pages[0].offsetLeft;
  }

  function updateHeader() {
    titleEl.textContent = titles[active];
    pcountEl.textContent = `${pad(active + 1)} / ${pad(sections.length)}`;
    gcountEl.textContent = `${pad(state[active] + 1)} / ${pad(counts[active])}`;
  }

  function updateZones(i: number) {
    const prev = sections[i].querySelector<HTMLButtonElement>('.ps-zone-prev')!;
    const next = sections[i].querySelector<HTMLButtonElement>('.ps-zone-next')!;
    prev.disabled = state[i] === 0;
    next.disabled = state[i] >= counts[i] - 1;
  }

  function apply(i: number, animate = true) {
    const t = tracks[i];
    if (!animate) t.classList.add('ps-noanim');
    t.style.transform = `translateX(${-state[i] * step(i)}px)`;
    if (!animate) {
      void t.offsetWidth;
      t.classList.remove('ps-noanim');
    }
    updateZones(i);
    if (i === active) updateHeader();
  }

  function go(i: number, dir: number) {
    const n = Math.min(counts[i] - 1, Math.max(0, state[i] + dir));
    if (n === state[i]) return;
    state[i] = n;
    apply(i);
  }

  function setRect(el: HTMLElement, r: { top: number; left: number; width: number; height: number }) {
    el.style.top = `${r.top}px`;
    el.style.left = `${r.left}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  }

  function hideGhost() {
    ghost.classList.remove('ps-fly');
    ghost.style.display = 'none';
    ghost.style.opacity = '1';
  }

  function flyGhost(src: string, from: DOMRect, to: DOMRect, fadeAt: number, doneAt: number) {
    window.clearTimeout(ghostTimer);
    ghostImg.src = src;
    ghost.classList.remove('ps-fly');
    ghost.style.opacity = '1';
    ghost.style.display = 'block';
    setRect(ghost, from);
    void ghost.offsetWidth;
    ghost.classList.add('ps-fly');
    setRect(ghost, to);
    window.setTimeout(() => {
      ghost.style.opacity = '0';
    }, fadeAt);
    ghostTimer = window.setTimeout(hideGhost, doneAt);
  }

  function mount(idx: number) {
    document.body.classList.add('locked');
    stage.classList.add('open');
    stage.setAttribute('aria-hidden', 'false');
    scroller.scrollTop = sections[idx].offsetTop;
    active = idx;
    sections.forEach((_, i) => apply(i, false));
    updateHeader();
    scroller.focus({ preventScroll: true });
  }

  function open(id: string, fromCard?: HTMLElement | null) {
    if (isOpen) return;
    const idx = order.indexOf(id);
    if (idx < 0) return;
    isOpen = true;
    mount(idx);

    const cardImg = fromCard?.querySelector<HTMLImageElement>('img.p1');
    if (!reduceMotion() && cardImg) {
      const dest = pageEls[idx][state[idx]].querySelector('img')!;
      flyGhost(
        cardImg.currentSrc || cardImg.src,
        cardImg.getBoundingClientRect(),
        dest.getBoundingClientRect(),
        520,
        800
      );
    }

    requestAnimationFrame(() => {
      stage.classList.add('on');
      window.setTimeout(() => stage.classList.add('ui'), reduceMotion() ? 0 : 160);
    });

    history.pushState({ psStage: id }, '', `#project/${slugs[idx]}`);
  }

  function openImmediate(id: string) {
    if (isOpen) return;
    const idx = order.indexOf(id);
    if (idx < 0) return;
    isOpen = true;
    mount(idx);
    stage.classList.add('on');
    stage.classList.add('ui');
  }

  function doClose() {
    if (!isOpen) return;
    isOpen = false;
    stage.classList.remove('ui');

    const card = cardFor(order[active]);
    const cardImg = card?.querySelector<HTMLImageElement>('img.p1');
    if (!reduceMotion() && cardImg) {
      const r = cardImg.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom > vh * 0.1 && r.top < vh * 0.9) {
        const cur = pageEls[active][state[active]].querySelector('img')!;
        flyGhost(cur.currentSrc || cur.src, cur.getBoundingClientRect(), r, 260, 560);
      }
    }

    stage.classList.remove('on');
    window.setTimeout(
      () => {
        stage.classList.remove('open');
        stage.setAttribute('aria-hidden', 'true');
      },
      reduceMotion() ? 0 : 260
    );
    document.body.classList.remove('locked');
    card?.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    const st = history.state as { psStage?: string } | null;
    if (st && st.psStage) {
      history.back();
      return;
    }
    doClose();
  }

  /* ---- vertical active tracking ---- */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const idx = Number((e.target as HTMLElement).dataset.index || '0');
        if (idx === active) continue;
        active = idx;
        updateHeader();
        updateZones(idx);
        if (isOpen) {
          const st = history.state as { psStage?: string } | null;
          if (st && st.psStage) {
            history.replaceState({ psStage: order[idx] }, '', `#project/${slugs[idx]}`);
          }
        }
      }
    },
    { root: scroller, threshold: 0.55 }
  );
  sections.forEach((s) => io.observe(s));

  /* ---- horizontal zones ---- */
  sections.forEach((sec, i) => {
    sec.querySelector('.ps-zone-prev')!.addEventListener('click', () => go(i, -1));
    sec.querySelector('.ps-zone-next')!.addEventListener('click', () => go(i, 1));
  });

  /* ---- chrome ---- */
  backBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      close();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(active, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(active, -1);
    }
  }, true);

  /* ---- card wiring ---- */
  document.querySelectorAll<HTMLElement>('.proj-card[data-id]').forEach((card) => {
    const activate = () => open(card.dataset.id || '', card);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  /* ---- history ---- */
  window.addEventListener('popstate', (e) => {
    const st = (e.state && (e.state as { psStage?: string }).psStage) || null;
    if (st && !isOpen) {
      openImmediate(st);
    } else if (!st && isOpen) {
      doClose();
    } else if (st && isOpen) {
      const i = order.indexOf(st);
      if (i >= 0) {
        scroller.scrollTop = sections[i].offsetTop;
        active = i;
        updateHeader();
      }
    }
  });

  const m = window.location.hash.match(/^#project\/([a-z-]+)$/);
  if (m) {
    const i = slugs.indexOf(m[1]);
    if (i >= 0) {
      history.replaceState({ psStage: order[i] }, '', window.location.hash);
      openImmediate(order[i]);
    }
  }

  /* ---- resize ---- */
  let rt = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(() => {
      sections.forEach((_, i) => apply(i, false));
    }, 150);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

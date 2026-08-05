/* =========================================================
   main.js — منطق صفحه اصلی JahanGame
   ========================================================= */
'use strict';

(function () {
  const PAGE_SIZE = 24;
  let currentGenre = 'all';
  let currentQuery = '';
  let visibleCount = PAGE_SIZE;

  const grid = document.getElementById('game-grid');
  const chipRow = document.getElementById('genre-chips');
  const searchInput = document.getElementById('search-input');
  const searchInputMobile = document.getElementById('search-input-mobile');
  const resultCount = document.getElementById('result-count');
  const loadMoreWrap = document.getElementById('loadmore-wrap');
  const loadMoreBtn = document.getElementById('loadmore-btn');
  const emptyState = document.getElementById('empty-state');

  function computeGenreCounts() {
    const counts = {};
    ALL_GAMES.forEach(function (g) {
      (g.genres || []).forEach(function (genre) {
        counts[genre] = (counts[genre] || 0) + 1;
      });
    });
    return counts;
  }

  function renderChips() {
    if (!chipRow) return;
    const counts = computeGenreCounts();
    const genresSorted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    let html = '<button class="chip active" data-genre="all">همه <span class="count">' + ALL_GAMES.length + '</span></button>';
    genresSorted.forEach(function (genre) {
      html += '<button class="chip" data-genre="' + genre + '">' +
        escapeHtml(genreLabel(genre)) + ' <span class="count">' + counts[genre] + '</span></button>';
    });
    chipRow.innerHTML = html;

    chipRow.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chipRow.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        currentGenre = chip.dataset.genre;
        visibleCount = PAGE_SIZE;
        renderGrid();
      });
    });
  }

  function getFiltered() {
    const q = currentQuery.trim().toLowerCase();
    return ALL_GAMES.filter(function (g) {
      const matchesGenre = currentGenre === 'all' || (g.genres || []).indexOf(currentGenre) !== -1;
      const matchesQuery = !q || g.title.toLowerCase().indexOf(q) !== -1 ||
        (g.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
      return matchesGenre && matchesQuery;
    });
  }

  function renderGrid() {
    if (!grid) return;
    const filtered = getFiltered();

    if (resultCount) {
      resultCount.textContent = filtered.length + ' بازی';
    }

    grid.innerHTML = '';
    if (!filtered.length) {
      if (emptyState) emptyState.hidden = false;
      if (loadMoreWrap) loadMoreWrap.hidden = true;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    const slice = filtered.slice(0, visibleCount);
    const frag = document.createDocumentFragment();
    slice.forEach(function (g, i) {
      frag.appendChild(buildGameCard(g, { delay: Math.min(i, 12) * 0.04 + 's' }));
    });
    grid.appendChild(frag);

    if (loadMoreWrap) {
      loadMoreWrap.hidden = visibleCount >= filtered.length;
    }
  }

  function handleSearch(value) {
    currentQuery = value;
    visibleCount = PAGE_SIZE;
    renderGrid();
  }

  if (searchInput) {
    searchInput.addEventListener('input', function (e) { handleSearch(e.target.value); if (searchInputMobile) searchInputMobile.value = e.target.value; });
  }
  if (searchInputMobile) {
    searchInputMobile.addEventListener('input', function (e) { handleSearch(e.target.value); if (searchInput) searchInput.value = e.target.value; });
  }
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });
  }

  // اسکرول نرم به گرید با دکمه‌ی هیرو
  const scrollBtn = document.getElementById('scroll-to-games');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      const target = document.getElementById('games-section');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderHeroStats() {
    const totalEl = document.getElementById('stat-total');
    const genreEl = document.getElementById('stat-genres');
    if (totalEl) totalEl.textContent = ALL_GAMES.length;
    if (genreEl) genreEl.textContent = Object.keys(computeGenreCounts()).length;
  }

  function init() {
    try {
      renderHeroStats();
      renderChips();
      renderGrid();
    } catch (err) {
      console.error('[JahanGame] خطا در راه‌اندازی صفحه اصلی:', err);
      if (grid) grid.innerHTML = '<p style="color:var(--text-dim)">مشکلی در بارگذاری فهرست بازی‌ها پیش آمد. لطفاً صفحه را رفرش کنید.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initParticleCanvas('particle-canvas');
    init();
    runBootSequence();
  });
})();

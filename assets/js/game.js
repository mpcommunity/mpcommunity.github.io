/* =========================================================
   game.js — منطق صفحه‌ی پخش هر بازی
   ========================================================= */
'use strict';

(function () {
  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function renderNotFound() {
    document.getElementById('game-root').innerHTML =
      '<div class="notfound">' +
        '<h1>۴۰۴</h1>' +
        '<p style="color:var(--text-dim)">این بازی پیدا نشد؛ شاید لینک اشتباه است یا بازی حذف شده.</p>' +
        '<a class="btn btn-primary" href="index.html">بازگشت به فهرست بازی‌ها</a>' +
      '</div>';
  }

  function renderRelated(game) {
    const wrap = document.getElementById('related-games');
    const section = document.getElementById('related-section');
    if (!wrap) return;
    const primaryGenre = game.genres && game.genres[0];
    let related = ALL_GAMES.filter(function (g) {
      return g.id !== game.id && g.genres && g.genres.indexOf(primaryGenre) !== -1;
    });
    if (related.length < 6) {
      const extra = ALL_GAMES.filter(function (g) {
        return g.id !== game.id && related.indexOf(g) === -1;
      });
      related = related.concat(extra.slice(0, 6 - related.length));
    }
    related = related.slice(0, 10);
    if (!related.length) { if (section) section.hidden = true; return; }
    wrap.innerHTML = '';
    const frag = document.createDocumentFragment();
    related.forEach(function (g) { frag.appendChild(buildGameCard(g)); });
    wrap.appendChild(frag);
  }

  function setupStage(game) {
    const stage = document.getElementById('stage');
    const loadingEl = document.getElementById('stage-loading');
    const loadingPct = document.getElementById('stage-loading-pct');
    const errorEl = document.getElementById('stage-error');
    const fsBtn = document.getElementById('fullscreen-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const newTabBtn = document.getElementById('newtab-btn');

    let loaded = false;
    let timeoutId = null;

    function fakeProgress() {
      let p = 0;
      const interval = setInterval(function () {
        if (loaded) { clearInterval(interval); return; }
        p += Math.random() * 9;
        if (p > 92) p = 92;
        if (loadingPct) loadingPct.textContent = Math.floor(p) + '%';
      }, 220);
      return interval;
    }
    const progressInterval = fakeProgress();

    function showError() {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (errorEl) errorEl.classList.add('show');
    }

    function createIframe() {
      const old = stage.querySelector('iframe');
      if (old) old.remove();
      if (errorEl) errorEl.classList.remove('show');
      if (loadingEl) loadingEl.classList.remove('hidden');
      loaded = false;
      clearTimeout(timeoutId);

      const iframe = document.createElement('iframe');
      iframe.src = game.embed;
      iframe.setAttribute('allow', 'gamepad; fullscreen; autoplay; accelerometer; gyroscope; encrypted-media');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('loading', 'eager');
      iframe.title = game.title;

      iframe.addEventListener('load', function () {
        loaded = true;
        if (loadingPct) loadingPct.textContent = '100%';
        setTimeout(function () {
          if (loadingEl) loadingEl.classList.add('hidden');
        }, 250);
      });
      iframe.addEventListener('error', function () {
        console.error('[JahanGame] بارگذاری iframe بازی با خطا مواجه شد:', game.embed);
        showError();
      });

      stage.appendChild(iframe);

      // اگر بازی ظرف زمان معقول لود نشد (مثلاً به دلیل مسدود بودن embed)، به کاربر گزینه بدهیم
      timeoutId = setTimeout(function () {
        if (!loaded) {
          console.warn('[JahanGame] Timeout در بارگذاری بازی:', game.embed);
          showError();
        }
      }, 15000);
    }

    createIframe();

    if (reloadBtn) reloadBtn.addEventListener('click', createIframe);
    if (newTabBtn) newTabBtn.addEventListener('click', function () { window.open(game.embed, '_blank', 'noopener'); });

    // تمام صفحه
    if (fsBtn) {
      fsBtn.addEventListener('click', function () {
        try {
          const el = stage;
          const isFs = document.fullscreenElement || document.webkitFullscreenElement;
          if (!isFs) {
            const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
            if (req) req.call(el);
            else console.warn('[JahanGame] Fullscreen API در این مرورگر پشتیبانی نمی‌شود.');
          } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) exit.call(document);
          }
        } catch (err) {
          console.error('[JahanGame] خطا در تمام‌صفحه کردن بازی:', err);
        }
      });

      const fsChangeHandler = function () {
        const isFs = document.fullscreenElement || document.webkitFullscreenElement;
        fsBtn.classList.toggle('active', !!isFs);
        fsBtn.querySelector('.fs-label').textContent = isFs ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه';
      };
      document.addEventListener('fullscreenchange', fsChangeHandler);
      document.addEventListener('webkitfullscreenchange', fsChangeHandler);
    }
  }

  function renderGame(game) {
    document.title = game.title + ' — بازی آنلاین رایگان | جهان‌گیم';
    const setText = function (id, value) { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('game-title', game.title);
    setText('breadcrumb-title', game.title);

    const tagsWrap = document.getElementById('game-tags');
    if (tagsWrap) {
      tagsWrap.innerHTML = (game.genres || []).map(function (g) {
        return '<span class="tag-pill">' + escapeHtml(genreLabel(g)) + '</span>';
      }).join('');
    }

    const descEl = document.getElementById('game-description');
    if (descEl) descEl.textContent = game.description || 'توضیحی برای این بازی ثبت نشده است.';

    setupStage(game);
    renderRelated(game);
  }

  function init() {
    const id = getParam('id');
    const game = id ? findGameById(id) : null;
    if (!game) {
      renderNotFound();
      return;
    }
    try {
      renderGame(game);
    } catch (err) {
      console.error('[JahanGame] خطا در رندر صفحه بازی:', err);
      renderNotFound();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    init();
    runBootSequence();
  });
})();

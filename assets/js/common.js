/* =========================================================
   common.js — توابع مشترک بین صفحات JahanGame
   ========================================================= */
'use strict';

// جلوگیری از کرش کل سایت به‌خاطر یک خطای غیرمنتظره + لاگ برای دیباگ
window.addEventListener('error', function (e) {
  console.error('[JahanGame] خطای غیرمنتظره:', e.message, e.filename + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', function (e) {
  console.error('[JahanGame] Promise رد شده:', e.reason);
});

const GENRE_LABELS = {
  action:    { fa: 'اکشن',        icon: '💥' },
  racing:    { fa: 'ماشین و مسابقه', icon: '🏎️' },
  shooting:  { fa: 'تیراندازی',   icon: '🎯' },
  strategy:  { fa: 'استراتژی',    icon: '♟️' },
  arcade:    { fa: 'آرکید',       icon: '🕹️' },
  simulator: { fa: 'شبیه‌سازی',   icon: '🛠️' },
  puzzle:    { fa: 'پازل',        icon: '🧩' },
  adventure: { fa: 'ماجراجویی',   icon: '🗺️' },
  battle:    { fa: 'مبارزه',      icon: '⚔️' },
  sports:    { fa: 'ورزشی',       icon: '⚽' },
  clicker:   { fa: 'کلیکی/آیدل',  icon: '🖱️' },
  horror:    { fa: 'ترسناک',      icon: '👻' },
  kids:      { fa: 'کودکانه',     icon: '🧸' }
};

function genreLabel(key) {
  return (GENRE_LABELS[key] && GENRE_LABELS[key].fa) || key;
}

// داده‌ی خام بازی‌ها — در صورت نبود فایل داده، آرایه خالی برای جلوگیری از کرش
const ALL_GAMES = (typeof GAMES_DATA !== 'undefined' && Array.isArray(GAMES_DATA)) ? GAMES_DATA : [];

function findGameById(id) {
  return ALL_GAMES.find(function (g) { return g.id === id; }) || null;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------- ساخت کارت بازی (استفاده در صفحه اصلی و بازی‌های مرتبط) ---------- */
function buildGameCard(game, opts) {
  opts = opts || {};
  const primaryGenre = game.genres && game.genres[0];
  const li = document.createElement('a');
  li.href = 'game.html?id=' + encodeURIComponent(game.id);
  li.className = 'game-card';
  if (opts.delay) li.style.animationDelay = opts.delay;
  li.setAttribute('aria-label', 'بازی ' + game.title);

  const tagsHtml = (game.genres || []).slice(0, 2).map(function (g) {
    return '<span class="tag-pill">' + escapeHtml(genreLabel(g)) + '</span>';
  }).join('');

  li.innerHTML =
    '<span class="card-notch" aria-hidden="true"></span>' +
    '<div class="card-thumb">' +
      '<img loading="lazy" alt="" src="' + escapeHtml(game.image) + '">' +
      '<div class="card-play"><span class="card-play-btn">' + PLAY_ICON_SVG + '</span></div>' +
    '</div>' +
    '<div class="card-body">' +
      '<div class="card-title">' + escapeHtml(game.title) + '</div>' +
      '<div class="card-tags">' + tagsHtml + '</div>' +
    '</div>';

  // مدیریت خطای بارگذاری تصویر با یک جایگزین ساده (بدون شکستن ظاهر)
  const img = li.querySelector('img');
  img.addEventListener('error', function () {
    img.remove();
    const fb = document.createElement('div');
    fb.className = 'fallback';
    fb.textContent = (game.title || '؟').trim().charAt(0).toUpperCase();
    li.querySelector('.card-thumb').prepend(fb);
  }, { once: true });

  return li;
}

const PLAY_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="margin-inline-start:3px"><path d="M6 4.5v15l14-7.5-14-7.5z" fill="#160a10"/></svg>';

/* ---------- هدر: افکت اسکرول + منوی موبایل + جستجو ---------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const mobileBtn = document.getElementById('mobile-search-toggle');
  const mobileBar = document.getElementById('mobile-search-bar');
  if (mobileBtn && mobileBar) {
    mobileBtn.addEventListener('click', function () {
      mobileBar.classList.toggle('mobile-open');
      if (mobileBar.classList.contains('mobile-open')) {
        const inp = mobileBar.querySelector('input');
        if (inp) inp.focus();
      }
    });
  }
}

/* ---------- پس‌زمینه ذره‌ای (کهکشان آرکید) روی هیرو ---------- */
function initParticleCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, particles = [];
  const COLORS = ['#45e8c8', '#ff3e86', '#ffb84d'];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width * devicePixelRatio;
    h = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const count = Math.min(90, Math.round((rect.width * rect.height) / 9000));
    particles = new Array(count).fill(0).map(function () {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.5) * devicePixelRatio,
        vy: (Math.random() * 0.12 + 0.03) * devicePixelRatio,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    });
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.tw += 0.02;
      const alpha = 0.35 + Math.sin(p.tw) * 0.3;
      ctx.globalAlpha = Math.max(0.05, alpha);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (!prefersReduced) {
        p.y -= p.vy;
        if (p.y < -10) p.y = h + 10;
      }
    }
    ctx.globalAlpha = 1;
    if (!prefersReduced) requestAnimationFrame(draw);
  }

  try {
    resize();
    draw();
    window.addEventListener('resize', resize);
  } catch (err) {
    console.error('[JahanGame] خطا در رندر پس‌زمینه ذره‌ای:', err);
  }
}

/* ---------- بوت‌سکانس صفحه بارگذاری ---------- */
function runBootSequence(onDone) {
  const screen = document.getElementById('boot-screen');
  const fill = document.getElementById('boot-fill');
  const pct = document.getElementById('boot-pct');
  const status = document.getElementById('boot-status');
  if (!screen || !fill || !pct) { if (onDone) onDone(); return; }

  const messages = [
    'در حال اتصال به سرور بازی‌ها...',
    'بارگذاری کارتریج‌ها...',
    'آماده‌سازی گرافیک...',
    'خوش آمدید به جهان‌گیم!'
  ];

  let p = 0;
  const start = performance.now();
  const MIN_MS = 900;

  function tick(now) {
    const elapsed = now - start;
    const target = Math.min(100, (elapsed / MIN_MS) * 100);
    p += (target - p) * 0.25 + 0.6;
    if (p > 100) p = 100;
    fill.style.width = p.toFixed(0) + '%';
    pct.textContent = Math.floor(p) + '%';
    const msgIndex = Math.min(messages.length - 1, Math.floor((p / 100) * messages.length));
    status.textContent = messages[msgIndex];

    if (p >= 100 && elapsed >= MIN_MS) {
      screen.classList.add('hidden');
      setTimeout(function () { screen.remove(); }, 650);
      if (onDone) onDone();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // اطمینان از عدم گیر کردن کاربر پشت صفحه بارگذاری در صورت بروز هر خطا
  setTimeout(function () {
    if (screen && !screen.classList.contains('hidden')) {
      screen.classList.add('hidden');
      setTimeout(function () { if (screen.parentElement) screen.remove(); }, 650);
      if (onDone) onDone();
    }
  }, 4000);
}

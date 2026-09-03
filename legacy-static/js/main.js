/* ==========================================================================
   WildLens — shared behaviors
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initDrawer();
    initRipple();
    initCounters();
    initAOS();
    initTagPills();
    initFavorites();
    markActiveNav();
    initServiceWorker();
    initInstallPrompt();
  });

  /* ---- PWA: service worker registration ---- */
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // file:// (opened directly from disk) can't register a service worker —
    // only attempt this over http(s), e.g. GitHub Pages or a local server.
    if (window.location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        /* offline-first is a progressive enhancement — fail silently */
      });
    });
  }

  /* ---- PWA: "Add to Home Screen" prompt ---- */
  function initInstallPrompt() {
    var deferredPrompt = null;
    var btns = document.querySelectorAll('[data-install-app]');
    if (!btns.length) return;

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      btns.forEach(function (b) { b.hidden = false; });
    });
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; b.hidden = true; });
      });
    });
    window.addEventListener('appinstalled', function () {
      btns.forEach(function (b) { b.hidden = true; });
      if (window.WL) WL.toast('WildLens installed — find it on your home screen');
    });
  }

  /* ---- Sticky nav on scroll ---- */
  function initNavScroll() {
    var nav = document.querySelector('.wl-nav');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile drawer ---- */
  function initDrawer() {
    var burger = document.querySelector('[data-drawer-open]');
    var drawer = document.querySelector('.wl-drawer');
    var closeBtn = document.querySelector('[data-drawer-close]');
    var backdrop = document.querySelector('.wl-drawer-backdrop');
    if (!burger || !drawer) return;

    function open() {
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  /* ---- Active nav link by pathname ---- */
  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav-link]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  }

  /* ---- Button ripple micro-interaction ---- */
  function initRipple() {
    document.querySelectorAll('.btn-wl').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var span = document.createElement('span');
        var size = Math.max(rect.width, rect.height);
        span.className = 'ripple';
        span.style.width = span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left - size / 2) + 'px';
        span.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(span);
        setTimeout(function () { span.remove(); }, 650);
      });
    });
  }

  /* ---- Animated number counters (stat bands) ---- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = formatNum(target) + suffix;
      return;
    }
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = target * eased;
      el.textContent = formatNum(val) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = formatNum(target) + suffix;
    }
    requestAnimationFrame(step);
  }

  function formatNum(n) {
    n = Math.round(n * 10) / 10;
    if (n % 1 !== 0) return n.toFixed(1);
    return Math.round(n).toLocaleString();
  }

  /* ---- Filter tag pill groups ---- */
  function initTagPills() {
    document.querySelectorAll('[data-pill-group]').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var pill = e.target.closest('.tag-pill');
        if (!pill) return;
        group.querySelectorAll('.tag-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var evt = new CustomEvent('pillchange', { detail: { value: pill.getAttribute('data-value') } });
        group.dispatchEvent(evt);
      });
    });
  }

  /* ---- Favorite / like toggle chips (gated — requires an account) ---- */
  function initFavorites() {
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-fav-toggle]');
      if (chip) {
        if (!(window.WL && WL.auth && WL.auth.requireAuth())) return;
        chip.classList.toggle('is-fav');
        var icon = chip.querySelector('i');
        if (icon) {
          icon.classList.toggle('bi-heart');
          icon.classList.toggle('bi-heart-fill');
        }
      }
      var likeBtn = e.target.closest('[data-like-toggle]');
      if (likeBtn) {
        if (!(window.WL && WL.auth && WL.auth.requireAuth())) return;
        likeBtn.classList.toggle('liked');
        var icon2 = likeBtn.querySelector('i');
        var countEl = likeBtn.querySelector('[data-like-count]');
        if (icon2) {
          icon2.classList.toggle('bi-heart');
          icon2.classList.toggle('bi-heart-fill');
        }
        if (countEl) {
          var n = parseInt(countEl.textContent.replace(/,/g, ''), 10) || 0;
          n = likeBtn.classList.contains('liked') ? n + 1 : n - 1;
          countEl.textContent = n.toLocaleString();
        }
      }
    });
  }

  /* ---- AOS init ---- */
  function initAOS() {
    if (window.AOS) {
      window.AOS.init({
        duration: 700,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60,
      });
    }
  }

  /* Expose small helpers for page-specific scripts.
     Merge onto window.WL rather than replacing it — js/auth.js (loaded
     before this file) already attaches WL.auth, and clobbering it here
     would silently break every gated action on the site. */
  window.WL = window.WL || {};
  window.WL.toast = function (msg, type) {
      var wrap = document.getElementById('wlToastWrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'wlToastWrap';
        wrap.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2000;display:flex;flex-direction:column;gap:8px;align-items:center;';
        document.body.appendChild(wrap);
      }
      var t = document.createElement('div');
      var color = type === 'error' ? '#c1503d' : type === 'warn' ? '#d9a441' : '#57b37f';
      t.style.cssText = 'background:#101c15;border:1px solid ' + color + ';color:#f3f0e7;padding:12px 20px;border-radius:999px;font-family:Manrope,sans-serif;font-size:0.85rem;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,0.4);opacity:0;transform:translateY(10px);transition:all .3s cubic-bezier(.22,1,.36,1);white-space:nowrap;';
      t.textContent = msg;
      wrap.appendChild(t);
      requestAnimationFrame(function () {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
      });
      setTimeout(function () {
        t.style.opacity = '0';
        t.style.transform = 'translateY(10px)';
        setTimeout(function () { t.remove(); }, 300);
      }, 2600);
    };
})();

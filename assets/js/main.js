/* =========================================================
   Frillian — portfolio interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     Theme — remembers the choice, otherwise follows the system
     --------------------------------------------------------- */
  (function theme() {
    var root = document.documentElement;
    var toggle = $('#themeToggle');
    var meta = $('meta[name="theme-color"]');
    var stored = null;

    try { stored = localStorage.getItem('frillian-theme'); } catch (e) {}

    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(stored || (prefersDark ? 'dark' : 'light'));

    function apply(mode) {
      root.setAttribute('data-theme', mode);
      if (meta) meta.setAttribute('content', mode === 'dark' ? '#0B0A09' : '#FBFAF7');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem('frillian-theme', next); } catch (e) {}
      });
    }
  })();

  /* ---------------------------------------------------------
     Nav — sticky state, scroll progress, active section
     --------------------------------------------------------- */
  (function nav() {
    var bar = $('#progressBar');
    var header = $('#nav');
    var links = $$('.nav__links a');
    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (header) header.classList.toggle('is-stuck', y > 24);

      var current = null;
      var probe = y + window.innerHeight * 0.32;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= probe) current = sections[i].id;
      }
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  (function burger() {
    var btn = $('#burger');
    var menu = $('.nav__links');
    if (!btn || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /* ---------------------------------------------------------
     Scroll reveals — staggered by data-reveal-delay
     --------------------------------------------------------- */
  (function reveals() {
    var items = $$('.reveal');

    items.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------
     Counters — animate once, when scrolled into view
     --------------------------------------------------------- */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function format(el, value) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      return prefix + value.toFixed(decimals) + suffix;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;

      if (reduceMotion) { el.textContent = format(el, target); return; }

      var duration = 1500;
      var start = null;

      function step(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        // easeOutExpo — fast start, soft landing
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = format(el, target * eased);
        if (p < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------
     Hero role rotator
     --------------------------------------------------------- */
  (function rotator() {
    var host = $('#rotator');
    if (!host) return;

    var words = [
      'Computer Science student',
      'Software Engineer Intern',
      'Basketball content creator',
      'Brand ambassador',
      'Apple Academy applicant'
    ];

    var word = $('.rotator__word', host);
    if (!word || reduceMotion) return;

    var i = 0;
    setInterval(function () {
      word.classList.add('is-out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        word.textContent = words[i];
        word.classList.remove('is-out');
      }, 320);
    }, 2800);
  })();

  /* ---------------------------------------------------------
     Magnetic buttons + custom cursor (pointer devices only)
     --------------------------------------------------------- */
  (function pointerFx() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || reduceMotion) return;

    /* cursor ring, eased toward the real pointer */
    var ring = $('#cursorRing');
    if (ring) {
      var tx = -100, ty = -100, cx = -100, cy = -100;

      document.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        ring.classList.add('is-on');
      }, { passive: true });

      document.addEventListener('mouseleave', function () {
        ring.classList.remove('is-on');
      });

      (function loop() {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        ring.style.transform = 'translate(' + (cx - 15) + 'px,' + (cy - 15) + 'px)';
        window.requestAnimationFrame(loop);
      })();

      $$('a, button, .card, .proj, .num').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-big'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-big'); });
      });
    }

    /* magnetic pull on the primary calls to action */
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.18 + 'px,' + dy * 0.28 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  })();

  /* ---------------------------------------------------------
     Portrait parallax — a little drift as the hero scrolls away
     --------------------------------------------------------- */
  (function parallax() {
    var portrait = $('#portrait');
    if (!portrait || reduceMotion) return;

    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        portrait.style.setProperty('--py', (y * 0.045) + 'px');
        portrait.style.translate = '0 ' + (y * -0.045) + 'px';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
  })();

  /* ---------------------------------------------------------
     Portrait fallback — monogram if the photo is missing
     --------------------------------------------------------- */
  (function portraitFallback() {
    var img = $('#portraitImg');
    var box = $('#portrait');
    if (!img || !box) return;

    function fail() { box.classList.add('no-img'); }

    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  })();

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();

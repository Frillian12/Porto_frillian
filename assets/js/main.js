/* =========================================================
   Frillian — portfolio interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* read the preference live, so a reader who changes it mid-visit is heard */
  function reduced() { return motionQuery.matches; }

  /* ---------------------------------------------------------
     Theme — remembers the choice, otherwise follows the system.
     The switch itself is eased, because an abrupt jump in page
     brightness is uncomfortable to look at.
     --------------------------------------------------------- */
  (function theme() {
    var root = document.documentElement;
    var toggle = $('#themeToggle');
    var meta = $('meta[name="theme-color"]');
    var stored = null;
    var timer = null;

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

        /* colours cross-fade for the length of the switch and no longer, so
           hover states never inherit a transition they did not ask for */
        if (!reduced()) {
          root.classList.add('theme-anim');
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            root.classList.remove('theme-anim');
          }, 320);
        }

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

      /* scaleX rather than width: nothing on the scroll path should relayout */
      if (bar) {
        var p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
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
     Mobile menu — the panel itself is animated in CSS so it can
     be interrupted; this only owns the state.
     --------------------------------------------------------- */
  (function burger() {
    var btn = $('#burger');
    var menu = $('.nav__links');
    if (!btn || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });

    /* never trap the reader in an open menu */
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('is-open') && !menu.contains(e.target)) close();
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

    if (reduced() || !('IntersectionObserver' in window)) {
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
     Counters — animate once, when scrolled into view.
     Explanatory rather than interactive, so it can take its time.
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

      if (reduced()) { el.textContent = format(el, target); return; }

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
     Hero role rotator — the word leaves upward and the next one
     arrives from below, so the strip only ever travels one way.
     --------------------------------------------------------- */
  (function rotator() {
    var host = $('#rotator');
    if (!host) return;

    var words = [
      'Computer Science student',
      'Software Engineer Intern',
      'Basketball content creator',
      'Brand ambassador'
    ];

    var word = $('.rotator__word', host);
    if (!word || reduced()) return;

    var i = 0;
    var timer = null;

    function step() {
      word.classList.add('is-out');                 /* leaves upward */
      window.setTimeout(function () {
        i = (i + 1) % words.length;
        word.textContent = words[i];
        word.classList.remove('is-out');
        word.classList.add('is-next');              /* parked below, untransitioned */
        void word.offsetWidth;                      /* commit that position */
        word.classList.remove('is-next');           /* then ride up into place */
      }, 200);                                      /* matches --t-hover */
    }

    function start() { if (!timer) timer = window.setInterval(step, 2800); }
    function stop() { window.clearInterval(timer); timer = null; }

    /* a throttled background tab would otherwise queue up a burst of swaps */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  })();

  /* ---------------------------------------------------------
     Pointer flourishes — cursor ring and magnetic buttons.

     Both are springs rather than scripted animations: a spring
     always starts from where the element currently is, so it can
     be grabbed, reversed and re-aimed mid-flight without a jump.
     --------------------------------------------------------- */
  (function pointerFx() {
    if (!fineQuery.matches || reduced()) return;

    /* ---- cursor ring ---- */
    var ring = $('#cursorRing');
    if (ring) {
      var tx = -100, ty = -100, cx = -100, cy = -100;
      var last = 0, idle = true;

      function loop(now) {
        var dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
        last = now;

        /* exponential smoothing by elapsed time, so the ring trails the
           pointer identically on a 60Hz and a 120Hz display */
        var k = 1 - Math.exp(-dt / 0.084);
        cx += (tx - cx) * k;
        cy += (ty - cy) * k;
        /* 29 = half the ring's fixed 58px box, so it stays centred on the pointer */
        ring.style.transform = 'translate(' + (cx - 29).toFixed(2) + 'px,' + (cy - 29).toFixed(2) + 'px)';

        if (Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1) { idle = true; return; }
        window.requestAnimationFrame(loop);
      }

      document.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        ring.classList.add('is-on');
        if (idle) { idle = false; last = 0; window.requestAnimationFrame(loop); }
      }, { passive: true });

      document.addEventListener('mouseleave', function () {
        ring.classList.remove('is-on');
      });

      $$('a, button, .card, .proj, .num').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-big'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-big'); });
      });
    }

    /* ---- a critically damped spring ----
       `response` is roughly how long it takes to arrive, in seconds. Damping
       is fixed at critical: it settles quickly and never overshoots, which is
       right for anything that is following a pointer rather than being thrown. */
    function Spring(response, value) {
      this.w = (2 * Math.PI) / response;
      this.x = value || 0;
      this.v = 0;
      this.target = this.x;
    }
    Spring.prototype.step = function (dt) {
      var a = -2 * this.w * this.v - this.w * this.w * (this.x - this.target);
      this.v += a * dt;
      this.x += this.v * dt;
    };
    Spring.prototype.settled = function (eps) {
      return Math.abs(this.v) < eps && Math.abs(this.x - this.target) < eps;
    };

    /* ---- magnetic buttons ---- */
    $$('.magnetic').forEach(function (el) {
      var mx = new Spring(0.35, 0);
      var my = new Spring(0.35, 0);
      var press = new Spring(0.16, 1);
      var running = false;
      var last = 0;

      el.classList.add('is-spring');

      function frame(now) {
        var dt = last ? Math.min((now - last) / 1000, 0.032) : 1 / 60;
        last = now;

        mx.step(dt); my.step(dt); press.step(dt);
        el.style.transform =
          'translate3d(' + mx.x.toFixed(2) + 'px,' + my.x.toFixed(2) + 'px,0) ' +
          'scale(' + press.x.toFixed(4) + ')';

        if (mx.settled(0.01) && my.settled(0.01) && press.settled(0.0005)) {
          running = false; last = 0; return;
        }
        window.requestAnimationFrame(frame);
      }

      function run() {
        if (running) return;
        running = true; last = 0;
        window.requestAnimationFrame(frame);
      }

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx.target = (e.clientX - (r.left + r.width / 2)) * 0.18;
        my.target = (e.clientY - (r.top + r.height / 2)) * 0.28;
        run();
      });

      el.addEventListener('mouseleave', function () {
        mx.target = 0; my.target = 0; press.target = 1;
        run();
      });

      /* the press rides the same spring as the pull, so letting go part-way
         through a drag blends instead of cutting to a new animation */
      el.addEventListener('pointerdown', function () { press.target = 0.97; run(); });
      window.addEventListener('pointerup', function () { press.target = 1; run(); });
      el.addEventListener('pointercancel', function () { press.target = 1; run(); });
    });
  })();

  /* ---------------------------------------------------------
     Portrait parallax — a little drift as the hero scrolls away
     --------------------------------------------------------- */
  (function parallax() {
    var portrait = $('#portrait');
    if (!portrait || reduced()) return;

    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        portrait.style.translate = '0 ' + (y * -0.045).toFixed(2) + 'px';
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

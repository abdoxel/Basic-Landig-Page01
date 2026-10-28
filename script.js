/* ============================================================
   PROTOZA — Landing Page Script
   ------------------------------------------------------------
   1. Sticky header state
   2. Scroll reveal animations
   3. Mockup scaling (dashboard + laptop)
   4. QR code generation (canvas)
   5. Interactive feature list
   6. Waitlist form validation (front-end demo only)
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. STICKY HEADER STATE
  ---------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----------------------------------------------------------
     2. SCROLL REVEAL ANIMATIONS
  ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ----------------------------------------------------------
     3. MOCKUP SCALING
     The dashboard and laptop are built at a fixed "design" width
     so they keep perfect proportions, then scaled to fit their
     container. Prevents overflow and blurring at any viewport.
  ---------------------------------------------------------- */
  const stages = [
    { stage: document.querySelector('.mac-stage'), inner: document.querySelector('.macbook'), width: 1000 },
    { stage: document.querySelector('.laptop-stage'), inner: document.querySelector('.laptop'), width: 940 }
  ];

  const fitStages = () => {
    stages.forEach(({ stage, inner, width }) => {
      if (!stage || !inner) return;
      const scale = Math.min(1, stage.clientWidth / width);
      inner.style.transform = `scale(${scale})`;
      stage.style.height = `${Math.round(inner.offsetHeight * scale)}px`;
    });
  };

  fitStages();
  window.addEventListener('resize', fitStages);
  window.addEventListener('orientationchange', () => setTimeout(fitStages, 120));
  window.addEventListener('load', fitStages);

  // Re-fit when web fonts finish loading (layout height can shift)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitStages);
  }

  /* ----------------------------------------------------------
     4. QR CODE GENERATION
     Draws a decorative, deterministic QR-style pattern on canvas.
     Not a scannable code — purely a visual placeholder.
  ---------------------------------------------------------- */
  const drawQR = (canvas, size = 25) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Seeded PRNG so the pattern is stable between reloads
    let seed = 20260214;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const grid = Array.from({ length: size }, () => Array(size).fill(0));

    // Random data modules
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        grid[y][x] = rand() > 0.52 ? 1 : 0;
      }
    }

    // Timing patterns (alternating rows/columns, as in a real QR code)
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0 ? 1 : 0;
      grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Finder patterns in three corners with quiet zones
    const finder = (ox, oy) => {
      for (let y = -1; y < 8; y++) {
        for (let x = -1; x < 8; x++) {
          const gx = ox + x;
          const gy = oy + y;
          if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;
          const quiet = y === -1 || y === 7 || x === -1 || x === 7;
          const core = x >= 0 && x <= 6 && y >= 0 && y <= 6;
          const ring = x === 0 || x === 6 || y === 0 || y === 6;
          const bullseye = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[gy][gx] = quiet ? 0 : (core && (ring || bullseye) ? 1 : 0);
        }
      }
    };
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);

    // Paint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#111114';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x]) ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  document.querySelectorAll('canvas.qr').forEach((c) => drawQR(c));

  /* ----------------------------------------------------------
     5. INTERACTIVE FEATURE LIST
     Click (or keyboard) activates a row and reveals its copy.
  ---------------------------------------------------------- */
  const featureItems = Array.from(document.querySelectorAll('[data-feature]'));

  const activateFeature = (target) => {
    featureItems.forEach((item) => {
      const active = item === target;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-expanded', active ? 'true' : 'false');
      item.setAttribute('tabindex', active ? '0' : '-1');
    });
  };

  featureItems.forEach((item, index) => {
    item.setAttribute('tabindex', index === 0 ? '0' : '-1');

    item.addEventListener('click', () => activateFeature(item));
    item.addEventListener('mouseenter', () => activateFeature(item));

    item.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = featureItems[index + 1] || featureItems[0];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = featureItems[index - 1] || featureItems[featureItems.length - 1];
      if (next) {
        e.preventDefault();
        activateFeature(next);
        next.focus();
      }
    });
  });

  /* ----------------------------------------------------------
     6. WAITLIST FORM VALIDATION (front-end demo only)
     No data is sent or stored — this is a UI demonstration.
     Swap the success handler for a real endpoint when ready.
  ---------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  document.querySelectorAll('form[data-waitlist]').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const msg = form.parentElement.querySelector('.form-msg');

    const show = (text, type) => {
      if (!msg) return;
      msg.textContent = text;
      msg.className = `form-msg is-${type}`;
      msg.hidden = false;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (input.value || '').trim();

      if (!value) {
        show('Please enter your email address.', 'err');
        input.focus();
        return;
      }
      if (!EMAIL_RE.test(value)) {
        show('That email doesn\u2019t look right \u2014 please check and try again.', 'err');
        input.focus();
        return;
      }

      show(`You\u2019re on the list, ${value}. We\u2019ll email you when the beta opens. (Demo only \u2014 nothing is stored.)`, 'ok');
      form.reset();
    });

    // Clear the error state as soon as the user starts correcting it
    input.addEventListener('input', () => {
      if (msg && !msg.hidden && msg.classList.contains('is-err')) {
        msg.hidden = true;
        msg.textContent = '';
      }
    });
  });

  /* ----------------------------------------------------------
     7. PLACEHOLDER LINKS
     "Buy template" buttons currently scroll to the waitlist.
     Replace with a real checkout URL when available.
  ---------------------------------------------------------- */
  document.querySelectorAll('.js-buy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});

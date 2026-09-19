/* =====================================================================
   script.js — Inzira Tec Ltd
   Vanilla JavaScript, no libraries.

   TABLE OF CONTENTS
   1. SETTINGS  ← change particle / scroll-animation / horizontal-scroll behavior here
   2. HELPERS
   3. NAV (scroll style + mobile menu)
   4. IMAGE PLACEHOLDERS (fade images in once they load)
   5. SCROLL ANIMATIONS (fade-up / left / right / stagger)
   6. PARTICLES (hero + services backgrounds, cursor interaction)
   7. PINNED HORIZONTAL SCROLL (Featured Projects)
   8. FOOTER YEAR
   9. START
   ===================================================================== */


/* =====================================================================
   1. SETTINGS
   ===================================================================== */
const SETTINGS = {

  /* ---------- PARTICLES ---------- */
  particles: {
    density: 9000,          // DENSITY: pixels² per particle. LOWER = MORE particles (e.g. 5000). HIGHER = fewer.
    minCount: 40,           // never fewer than this per section
    maxCount: 240,          // never more than this per section

    speed: 0.14,            // SPEED: base drift speed. 0 = still, 0.3 = fast.
    sizeMin: 0.5,           // smallest particle radius (px)
    sizeMax: 1.8,           // largest particle radius (px)
    opacityMin: 0.25,       // faintest particle
    opacityMax: 0.95,       // brightest particle

    twinkle: true,          // particles gently pulse in brightness
    twinkleSpeed: 0.0018,   // pulse speed

    // COLORS: mostly warm-white stars with a few palette-colored ones. Repeat a color to make it more common.
    colors: ['#FFF6E6', '#FFF6E6', '#FFF6E6', '#FFF6E6', '#FFD023', '#FFB646', '#EE820E'],

    /* ----- CURSOR INTERACTION ----- */
    interaction: {
      mode: 'repulse',      // 'repulse' = particles flee the cursor · 'attract' = drawn to it · 'none' = ignore cursor
      radius: 140,          // how far the cursor's influence reaches (px)
      strength: 1.0,        // how hard particles are pushed/pulled
      recovery: 0.03,       // how fast particles return to their drift (higher = snappier)

      grabLines: true,      // faint lines from the cursor to nearby particles
      grabDistance: 160,    // reach of those lines (px)
      lineColor: '255,182,70', // RGB of the lines (amber)
      lineOpacity: 0.4,     // max line opacity

      clickBurst: false,    // set true → clicking releases a small burst of short-lived particles
      burstCount: 5,
      burstLife: 90         // frames a burst particle lives
    },

    /* ----- LINES BETWEEN PARTICLES (off by default) ----- */
    links: { enabled: false, distance: 110, opacity: 0.12 }
  },

  /* ---------- SCROLL ANIMATIONS ----------
     Durations/distances are CSS variables in styles.css (:root → --anim-duration, --anim-distance).
     Per-element delays: data-delay="200" in the HTML. Stagger: data-stagger="150" on a container. */
  scrollAnimation: {
    threshold: 0.16,               // how much of an element must be visible to trigger (0–1)
    rootMargin: '0px 0px -8% 0px', // trigger slightly before the element reaches the bottom of the screen
    once: true,                    // true = animate once; false = replay every time it scrolls in/out
    staggerDefault: 120            // ms between items when data-stagger has no number
  },

  /* ---------- PINNED HORIZONTAL SCROLL (Featured Projects) ---------- */
  horizontalScroll: {
    speed: 1,        // 1 = 1px of sideways movement per 1px scrolled. >1 = faster sideways, shorter section
    smoothing: 0.12  // 0–1. Lower = floatier/laggier, higher = tighter to the scrollbar
  },

  /* ---------- NAV ---------- */
  nav: { scrolledAfter: 24 }   // px scrolled before the nav gets its dark blurred background
};


/* =====================================================================
   2. HELPERS
   ===================================================================== */
(function () {
  'use strict';

  const S = SETTINGS;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reads a CSS time variable like "900ms" or "0.9s" and returns milliseconds
  function readCssTime(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;
    const n = parseFloat(raw);
    if (isNaN(n)) return fallback;
    return raw.endsWith('ms') ? n : n * 1000;
  }


  /* ===================================================================
     3. NAV
     =================================================================== */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > S.nav.scrolledAfter);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu
    const toggle = nav.querySelector('.nav__toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('.nav__links a').forEach(a =>
        a.addEventListener('click', () => {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        })
      );
    }
  }


  /* ===================================================================
     4. IMAGE PLACEHOLDERS
     Every <img class="js-img"> fades in when it loads. If the src is still
     a placeholder (e.g. YOUR-FOUNDER-1-IMAGE-HERE) it stays hidden and the
     styled frame behind it shows instead.
     =================================================================== */
  function initImages() {
    document.querySelectorAll('img.js-img').forEach(img => {
      const host = img.closest('[data-img-host]');
      const ok = () => { img.classList.add('is-loaded'); if (host) host.classList.add('has-img'); };
      const fail = () => { img.classList.remove('is-loaded'); if (host) host.classList.remove('has-img'); };

      img.addEventListener('load', ok);
      img.addEventListener('error', fail);

      // Handle images that finished (or failed) before this script ran
      if (img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
    });
  }


  /* ===================================================================
     5. SCROLL ANIMATIONS
     =================================================================== */
 
  function initScrollAnimations() {
    const cfg = S.scrollAnimation;
    const all = Array.from(document.querySelectorAll('[data-anim]'));
    if (!all.length) return;

    // Per-element delay from data-delay="200"
    all.forEach(el => {
      if (el.dataset.delay) el.style.setProperty('--anim-delay', el.dataset.delay + 'ms');
    });

    // Stagger groups: children get increasing delays, and the whole group is revealed together
    const groups = Array.from(document.querySelectorAll('[data-stagger]'));
    groups.forEach(group => {
      const step = parseInt(group.dataset.stagger, 10) || cfg.staggerDefault;
      group.querySelectorAll('[data-anim]').forEach((el, i) => {
        el.style.setProperty('--anim-delay', (i * step) + 'ms');
      });
    });

    // Reduced motion / very old browsers: show everything immediately
    if (prefersReduced || !('IntersectionObserver' in window)) {
      all.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const duration = readCssTime('--anim-duration', 900);

    const reveal = el => {
      el.classList.add('is-visible');
      if (cfg.once) {
        // After the animation ends, remove the animation hook so hover effects have no leftover delay
        const delay = parseFloat(el.style.getPropertyValue('--anim-delay')) || 0;
        const wait = delay + (el.dataset.anim === 'mask-up' ? 1100 : duration) + 80;
        setTimeout(() => {
          el.removeAttribute('data-anim');
          el.style.removeProperty('--anim-delay');
        }, wait);
      }
    };
    const hide = el => { el.classList.remove('is-visible'); };

    // HERO HEADLINE (data-anim="mask-up"): reveal on page load.
    // It can't use the scroll observer because it starts hidden behind a clipping mask,
    // which the observer treats as "not on screen".
    const masks = all.filter(el => el.dataset.anim === 'mask-up');
    if (masks.length) {
      requestAnimationFrame(() => requestAnimationFrame(() => masks.forEach(reveal)));
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = entry.target;
        // A group container reveals all of its children; a normal element reveals itself
        const els = target.hasAttribute('data-stagger')
          ? Array.from(target.querySelectorAll('[data-anim]'))
          : [target];

        if (entry.isIntersecting) {
          els.forEach(reveal);
          if (cfg.once) io.unobserve(target);
        } else if (!cfg.once) {
          els.forEach(hide);
        }
      });
    }, { threshold: cfg.threshold, rootMargin: cfg.rootMargin });

    groups.forEach(g => io.observe(g));
    all.forEach(el => {
      if (el.dataset.anim === 'mask-up') return;          // handled above
      if (!el.closest('[data-stagger]')) io.observe(el);
    });
  }


  /* ===================================================================
     6. PARTICLES
     Used on every <section data-particles> that contains a <canvas class="particles">.
     Change behavior in SETTINGS.particles (top of this file).
     =================================================================== */
  class ParticleField {
    constructor(section, canvas, cfg) {
      this.section = section;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cfg = cfg;
      this.particles = [];
      this.pointer = { clientX: 0, clientY: 0, active: false };
      this.visible = true;
      this.w = 0; this.h = 0; this.dpr = 1;

      this.resize();
      this.bind();
    }

    makeParticle(x, y, burst) {
      const c = this.cfg;
      const angle = Math.random() * TAU;
      const sp = rand(0.4, 1.2) * c.speed;
      const bvx = Math.cos(angle) * sp;
      const bvy = Math.sin(angle) * sp;
      return {
        x: x === undefined ? Math.random() * this.w : x,
        y: y === undefined ? Math.random() * this.h : y,
        bvx, bvy,                                   // "base" drift velocity
        vx: burst ? bvx * 6 : bvx,                  // current velocity
        vy: burst ? bvy * 6 : bvy,
        r: rand(c.sizeMin, c.sizeMax),
        a: rand(c.opacityMin, c.opacityMax),
        phase: Math.random() * TAU,
        color: c.colors[(Math.random() * c.colors.length) | 0],
        life: burst ? c.interaction.burstLife : Infinity
      };
    }

    resize() {
      const c = this.cfg;
      const rect = this.section.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = rect.width;
      this.h = rect.height;
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Adjust the number of particles to the section size (density setting)
      const target = clamp(Math.round((this.w * this.h) / c.density), c.minCount, c.maxCount);
      const base = this.particles.filter(p => p.life === Infinity);
      const bursts = this.particles.filter(p => p.life !== Infinity);
      while (base.length < target) base.push(this.makeParticle());
      base.length = target;
      base.forEach(p => { if (p.x > this.w) p.x = Math.random() * this.w; if (p.y > this.h) p.y = Math.random() * this.h; });
      this.particles = base.concat(bursts);

      if (prefersReduced) this.draw(0);   // static frame if the visitor prefers reduced motion
    }

    bind() {
      const it = this.cfg.interaction;
      const s = this.section;

      s.addEventListener('pointermove', e => {
        this.pointer.clientX = e.clientX;
        this.pointer.clientY = e.clientY;
        this.pointer.active = true;
      });
      s.addEventListener('pointerleave', () => { this.pointer.active = false; });
      s.addEventListener('pointerup', e => { if (e.pointerType === 'touch') this.pointer.active = false; });

      if (it.clickBurst) {
        s.addEventListener('pointerdown', e => {
          const r = s.getBoundingClientRect();
          for (let i = 0; i < it.burstCount; i++) {
            this.particles.push(this.makeParticle(e.clientX - r.left, e.clientY - r.top, true));
          }
        });
      }

      // Re-fit when the section changes size (window resize, fonts loading…)
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => this.resize()).observe(s);
      } else {
        window.addEventListener('resize', () => this.resize());
      }

      // Only animate while the section is on screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          this.visible = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(s);
      }
    }

    update(dt) {
      const c = this.cfg;
      const it = c.interaction;
      const rect = this.section.getBoundingClientRect();
      const mx = this.pointer.clientX - rect.left;
      const my = this.pointer.clientY - rect.top;
      const pointerOn = this.pointer.active && it.mode !== 'none';
      const recover = 1 - Math.pow(1 - it.recovery, dt);
      const R = it.radius;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];

        // Cursor force
        if (pointerOn) {
          const dx = p.x - mx, dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * it.strength * 0.6 * dt;
            const dir = it.mode === 'attract' ? -1 : 1;
            p.vx += (dx / d) * f * dir;
            p.vy += (dy / d) * f * dir;
          }
        }

        // Ease back toward the natural drift
        p.vx += (p.bvx - p.vx) * recover;
        p.vy += (p.bvy - p.vy) * recover;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around the edges
        if (p.x < -10) p.x = this.w + 10; else if (p.x > this.w + 10) p.x = -10;
        if (p.y < -10) p.y = this.h + 10; else if (p.y > this.h + 10) p.y = -10;

        // Burst particles expire
        if (p.life !== Infinity) {
          p.life -= dt;
          if (p.life <= 0) this.particles.splice(i, 1);
        }
      }
    }

    draw(now) {
      const c = this.cfg;
      const it = c.interaction;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);

      // Dots
      for (const p of this.particles) {
        let alpha = p.a;
        if (c.twinkle) alpha *= 0.65 + 0.35 * Math.sin(now * c.twinkleSpeed + p.phase);
        if (p.life !== Infinity) alpha *= Math.min(1, p.life / 30);
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }

      // Lines between particles (optional)
      if (c.links.enabled) {
        const D = c.links.distance;
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgb(255,246,230)';
        for (let i = 0; i < this.particles.length; i++) {
          for (let j = i + 1; j < this.particles.length; j++) {
            const a = this.particles[i], b = this.particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < D * D) {
              ctx.globalAlpha = (1 - Math.sqrt(d2) / D) * c.links.opacity;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
      }

      // Lines from the cursor to nearby particles
      if (it.grabLines && this.pointer.active && !prefersReduced) {
        const rect = this.section.getBoundingClientRect();
        const mx = this.pointer.clientX - rect.left;
        const my = this.pointer.clientY - rect.top;
        const G = it.grabDistance;
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgb(' + it.lineColor + ')';
        for (const p of this.particles) {
          const dx = p.x - mx, dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < G * G) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / G) * it.lineOpacity;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  function initParticles() {
    const fields = [];
    document.querySelectorAll('[data-particles]').forEach(section => {
      const canvas = section.querySelector('canvas.particles');
      if (canvas) fields.push(new ParticleField(section, canvas, S.particles));
    });
    if (!fields.length || prefersReduced) return;

    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 16.667, 3);   // normalized to 60fps
      last = now;
      for (const f of fields) {
        if (f.visible) { f.update(dt); f.draw(now); }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }


  /* ===================================================================
     7. PINNED HORIZONTAL SCROLL (Featured Projects)
     The section is made tall; inside it a sticky panel stays on screen while
     the track of cards slides sideways as you scroll down.
     =================================================================== */
  function initHorizontalScroll() {
    const section = document.querySelector('[data-hscroll]');
    if (!section) return;
    const sticky = section.querySelector('[data-hscroll-sticky]');
    const track = section.querySelector('[data-hscroll-track]');
    if (!sticky || !track) return;

    const cfg = S.horizontalScroll;
    let maxShift = 0, scrollRange = 0, current = 0, target = 0, raf = null;

    const apply = () => { track.style.transform = 'translate3d(' + (-current) + 'px,0,0)'; };

    const tick = () => {
      current += (target - current) * cfg.smoothing;
      if (Math.abs(target - current) < 0.1) { current = target; raf = null; apply(); return; }
      apply();
      raf = requestAnimationFrame(tick);
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      const progress = scrollRange > 0 ? clamp(-rect.top / scrollRange, 0, 1) : 0;
      target = progress * maxShift;
      if (prefersReduced) { current = target; apply(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const measure = () => {
      const vw = document.documentElement.clientWidth;
      maxShift = Math.max(0, track.offsetWidth - vw);      // how far the track must travel
      scrollRange = maxShift / cfg.speed;                  // how much vertical scroll that takes
      section.style.height = (sticky.offsetHeight + scrollRange) + 'px';
      update();
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
    measure();
  }


  /* ===================================================================
     8. FOOTER YEAR
     =================================================================== */
  function initYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }


  /* ===================================================================
     9. START
     =================================================================== */
  function init() {
    initNav();
    initImages();
    initScrollAnimations();
    initParticles();
    initHorizontalScroll();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

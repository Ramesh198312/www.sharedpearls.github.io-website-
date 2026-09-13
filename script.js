/* ============================================================
   SHARED PEARLS OF WISDOM — script.js
   Existing functionality (hamburger, subscribe form, CEFR modal)
   is preserved exactly as before. New below it: the 3D interaction
   layer — nav elevation, hero parallax, card tilt, scroll reveal —
   all gated behind prefers-reduced-motion and pointer:fine checks,
   and all paused when not visible or when the tab is hidden.
   ============================================================ */

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  hamburger.classList.toggle('toggle');
});

document.getElementById('subscribe-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const form = event.target;
  const button = document.getElementById('submit-btn');
  const successMsg = document.getElementById('success-msg');
  button.innerText = "SENDING...";
  button.disabled = true;
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzjmtH-AHUtMLclKJ5B4m0fz85TfT2Wxw-WZ2QIHNRurqEEqKvR-lqF9mrp9LP_tm4l/exec';
  fetch(scriptURL, { method: 'POST', body: new FormData(form) })
    .then(response => { form.style.display = 'none'; successMsg.style.display = 'block'; })
    .catch(error => { alert("Something went wrong. Please try again."); button.innerText = "SUBSCRIBE"; button.disabled = false; });
});

window.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('cefrTestModal');
  const closeBtn = document.getElementById('closeCefrModalBtn');
  const hasSeenPopup = sessionStorage.getItem('cefrPopupShown');
  if (!hasSeenPopup && modal) {
    setTimeout(function() { modal.classList.add('active'); sessionStorage.setItem('cefrPopupShown', 'true'); }, 2000);
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', function(e) { e.preventDefault(); modal.classList.remove('active'); });
  }
  if (modal) {
    modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); } });
  }
});

/* ============================================================
   3D INTERACTION LAYER
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const allowMotion = !prefersReducedMotion;
  const allowPointerEffects = allowMotion && hasFinePointer;

  /* ---------- Nav elevation on scroll ---------- */
  const nav = document.querySelector('nav');
  if (nav) {
    let ticking = false;
    const applyNavState = () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(applyNavState);
        ticking = true;
      }
    }, { passive: true });
    applyNavState();
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  /* A single deliberate moment per grid: cards rise from the
     background together, staggered by position, rather than a
     generic fade applied to every section on the page. */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const staggerGrids = ['.skills-grid', '.lessons-grid', '.testimonials-grid', '.series-grid'];
  staggerGrids.forEach((gridSelector) => {
    document.querySelectorAll(`${gridSelector} > [data-reveal]`).forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i * 0.08, 0.32)}s`);
    });
  });

  if (revealEls.length) {
    if (allowMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-revealed'));
    }
  }

  /* ---------- Hero parallax scene ---------- */
  /* Floating linguistic objects respond to pointer position with
     depth-proportional movement. Disabled on touch devices and
     under reduced-motion. Loop stops automatically once the
     pointer settles, and pauses while the hero is off-screen. */
  const heroSection = document.querySelector('.hero');
  const heroScene = document.querySelector('.hero-scene');
  if (heroSection && heroScene && allowPointerEffects) {
    const objects = heroScene.querySelectorAll('.hero-object');
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let rafId = null;
    let heroVisible = true;

    const heroObserver = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    heroObserver.observe(heroSection);

    function step() {
      curX += (targetX - curX) * 0.07;
      curY += (targetY - curY) * 0.07;
      objects.forEach((obj) => {
        const depth = parseFloat(obj.dataset.depth) || 1;
        const moveX = curX * depth * 12;
        const moveY = curY * depth * 9;
        obj.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
      });
      const settled = Math.abs(targetX - curX) < 0.002 && Math.abs(targetY - curY) < 0.002;
      if (!settled && heroVisible) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    }

    heroSection.addEventListener('mousemove', (e) => {
      if (!heroVisible) return;
      const rect = heroSection.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(step);
    });

    heroSection.addEventListener('mouseleave', () => {
      targetX = 0; targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(step);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  }

  /* ---------- Depth-aware card tilt ---------- */
  /* Pointer-fine devices only. CSS :hover / :focus-within still
     provide a simpler lift for touch and keyboard users. */
  function attachTilt(selector, maxDeg) {
    if (!allowPointerEffects) return;
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const rotX = (-py * maxDeg).toFixed(2);
        const rotY = (px * maxDeg).toFixed(2);
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) translateZ(18px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
  attachTilt('.skill-tile', 7);
  attachTilt('.lesson-card', 4);
  attachTilt('.testimonial-card', 3);
  attachTilt('.series-card', 3);
  attachTilt('.level-stage', 5);

})();

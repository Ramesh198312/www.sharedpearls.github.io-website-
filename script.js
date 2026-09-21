/* ============================================================
   SHARED PEARLS OF WISDOM — script.js

   1. Announcement bars      (class-based: no duplicate IDs)
   2. Mobile menu
   3. Newsletter subscription
   4. CEFR modal
   5. Topic search
   6. ESL explorer (tabs + show all)
   7. 3D interaction layer

   Every pointer effect is skipped on touch devices and under
   prefers-reduced-motion. Nothing here is required for a link
   to work: navigation is plain HTML.
============================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* ============================================================
     1. ANNOUNCEMENT BARS
     Handled by class, so any number of bars work and none of
     them need a unique handler.
  ============================================================ */
  $$('[data-announce]').forEach(function (bar) {
    const close = $('.announce-close', bar);
    if (close) close.addEventListener('click', function () { bar.classList.add('is-hidden'); });
  });

  /* ============================================================
     2. MOBILE MENU
  ============================================================ */
  const hamburger = $('#hamburger');
  const navLinks  = $('#nav-links');

  if (hamburger && navLinks) {
    const setMenu = function (open) {
      navLinks.classList.toggle('active', open);
      hamburger.classList.toggle('toggle', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    hamburger.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('active'));
    });

    // Close after choosing a destination, and on Escape.
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        setMenu(false);
        hamburger.focus();
      }
    });
  }

  /* ============================================================
     3. NEWSLETTER SUBSCRIPTION
     ============================================================
     Posts to the Cloudflare Pages Function at
     functions/api/newsletter-subscribe.js

     Success is shown ONLY when the backend returns HTTP 2xx AND
     a JSON body of { ok: true }. A resolved fetch on its own is
     never treated as success — that was the previous bug, and it
     is why subscribers appeared to sign up but no notification
     was ever produced.
  ============================================================ */
  const ENDPOINT = '/api/newsletter-subscribe';

  const form   = $('#subscribe-form');
  const email  = $('#email-input');
  const button = $('#submit-btn');
  const status = $('#newsletter-status');

  if (form && email && button && status) {
    let busy = false;

    const say = function (message, kind) {
      status.textContent = message;
      status.classList.toggle('is-error', kind === 'error');
      status.classList.toggle('is-ok', kind === 'ok');
    };

    // Deliberately permissive: the server does the authoritative check.
    const looksLikeEmail = function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy) return;                          // blocks rapid double-clicks

      const value = email.value.trim();

      if (!value) {
        email.setAttribute('aria-invalid', 'true');
        say('Please enter your email address.', 'error');
        email.focus();
        return;
      }
      if (!looksLikeEmail(value)) {
        email.setAttribute('aria-invalid', 'true');
        say('That does not look like a valid email address.', 'error');
        email.focus();
        return;
      }
      email.removeAttribute('aria-invalid');

      busy = true;
      button.disabled = true;
      button.textContent = 'Subscribing…';
      say('Sending your subscription…', '');

      const payload = {
        email: value,
        company_website: (form.elements.company_website || {}).value || '', // honeypot
        source: 'Shared Pearls of Wisdom website'
      };

      const restore = function (message) {
        busy = false;
        button.disabled = false;
        button.textContent = 'Sign up';
        say(message, 'error');
      };

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          // The endpoint must answer with JSON. An HTML page (a 404
          // page, a sign-in screen, a provider error) is a failure —
          // it is exactly what the old Google Apps Script returned.
          const type = response.headers.get('content-type') || '';
          if (type.indexOf('application/json') === -1) {
            return { ok: false, status: response.status, data: null };
          }
          return response.json()
            .then(function (data) { return { ok: response.ok, status: response.status, data: data }; })
            .catch(function () { return { ok: false, status: response.status, data: null }; });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.ok === true) {
            form.hidden = true;
            say('You\'re subscribed! Look out for the next Shared Pearls of Wisdom newsletter.', 'ok');
            return;
          }

          const serverMessage = result.data && result.data.error;
          if (result.status === 429) {
            restore('You have tried a few times already. Please wait a minute and try again.');
          } else if (serverMessage) {
            restore(serverMessage);
          } else {
            restore('We couldn\'t complete your subscription. Please try again.');
          }
        })
        .catch(function () {
          restore('We couldn\'t reach the server. Please check your connection and try again.');
        });
    });

    email.addEventListener('input', function () {
      if (email.getAttribute('aria-invalid') === 'true' && looksLikeEmail(email.value.trim())) {
        email.removeAttribute('aria-invalid');
        say('', '');
      }
    });
  }

  /* ============================================================
     4. CEFR MODAL — once per browser session
  ============================================================ */
  const modal = $('#cefrTestModal');

  if (modal) {
    const closeBtn = $('#closeCefrModalBtn');
    let lastFocus = null;

    const openModal = function () {
      lastFocus = document.activeElement;
      modal.hidden = false;
      // next frame, so the transition has a starting state to animate from
      requestAnimationFrame(function () { modal.classList.add('active'); });
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = function () {
      modal.classList.remove('active');
      modal.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    let seen = false;
    try { seen = !!sessionStorage.getItem('cefrPopupShown'); } catch (e) { /* storage blocked */ }

    if (!seen) {
      window.setTimeout(function () {
        openModal();
        try { sessionStorage.setItem('cefrPopupShown', 'true'); } catch (e) { /* storage blocked */ }
      }, 2500);
    }

    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    // Escape closes; Tab stays inside the dialog while it is open.
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;

      const focusables = $$('a[href], button:not([disabled])', modal);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ============================================================
     5. TOPIC SEARCH
     Indexes only real links already on this page. It can never
     invent a result, because every entry comes from the DOM.
  ============================================================ */
  const overlay   = $('#searchOverlay');
  const openBtn   = $('#searchOpen');
  const searchIn  = $('#searchInput');
  const resultsEl = $('#searchResults');
  const countEl   = $('#searchCount');

  if (overlay && openBtn && searchIn && resultsEl && countEl) {
    const index = [];
    const seenHref = Object.create(null);

    const add = function (name, href, category, extra) {
      if (!name || !href) return;
      const key = href + '|' + name;
      if (seenHref[key]) return;
      seenHref[key] = true;
      index.push({
        name: name,
        href: href,
        category: category,
        haystack: (name + ' ' + category + ' ' + (extra || '')).toLowerCase()
      });
    };

    $$('.ex-item > a').forEach(function (a) {
      const soon = a.hasAttribute('data-soon');
      add(
        $('.ex-name', a) ? $('.ex-name', a).textContent.trim() : a.textContent.trim(),
        a.getAttribute('href'),
        soon ? 'Coming soon' : ($('.ex-cat', a) ? $('.ex-cat', a).textContent.trim() : 'Topic')
      );
    });
    $$('.skill').forEach(function (card) {
      const a = $('h3 a', card);
      if (a) add(a.textContent.trim(), a.getAttribute('href'), 'Skill', card.getAttribute('data-topic'));
    });
    $$('.post').forEach(function (card) {
      const a = $('.post-title a', card);
      if (a) add(a.textContent.trim(), a.getAttribute('href'), 'Lesson', card.getAttribute('data-topic'));
    });
    $$('.s-card').forEach(function (card) {
      const a = $('h3 a', card);
      if (a) add(a.textContent.trim(), a.getAttribute('href'), 'Series', card.getAttribute('data-topic'));
    });
    $$('.step').forEach(function (card) {
      const h = $('h3', card);
      if (h) add(h.textContent.trim() + ' level', card.getAttribute('href'), 'CEFR level');
    });

    const render = function (query) {
      const q = query.trim().toLowerCase();
      resultsEl.innerHTML = '';

      if (!q) {
        countEl.textContent = index.length + ' topics available. Start typing to filter.';
        return;
      }

      const hits = index.filter(function (item) { return item.haystack.indexOf(q) !== -1; }).slice(0, 12);
      countEl.textContent = hits.length
        ? hits.length + (hits.length === 1 ? ' match' : ' matches')
        : 'No topics match “' + query.trim() + '”.';

      const frag = document.createDocumentFragment();
      hits.forEach(function (item) {
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = item.href;

        const name = document.createElement('span');
        name.className = 'r-name';
        name.textContent = item.name;

        const cat = document.createElement('span');
        cat.className = 'r-cat';
        cat.textContent = item.category;

        a.appendChild(name);
        a.appendChild(cat);
        li.appendChild(a);
        frag.appendChild(li);
      });
      resultsEl.appendChild(frag);
    };

    let lastSearchFocus = null;

    const openSearch = function () {
      lastSearchFocus = document.activeElement;
      overlay.hidden = false;
      render('');
      searchIn.focus();
    };
    const closeSearch = function () {
      overlay.hidden = true;
      searchIn.value = '';
      if (lastSearchFocus && typeof lastSearchFocus.focus === 'function') lastSearchFocus.focus();
    };

    openBtn.addEventListener('click', openSearch);
    const closeSearchBtn = $('#searchClose');
    if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    searchIn.addEventListener('input', function () { render(searchIn.value); });

    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      // "/" opens search, unless the user is already typing somewhere
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (e.key === '/' && overlay.hidden && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  /* ============================================================
     6. ESL EXPLORER — category tabs + progressive disclosure
  ============================================================ */
  const explorer = $('.explorer');

  if (explorer) {
    const tabs   = $$('.ex-tab', explorer);
    const items  = $$('.ex-item', explorer);
    const moreBt = $('#exMore');
    const countP = $('#exCount');
    const COLLAPSED = 12;

    let filter   = 'all';
    let expanded = false;

    const apply = function () {
      let shown = 0;
      let matching = 0;

      items.forEach(function (item) {
        const inFilter = filter === 'all' || item.getAttribute('data-cat') === filter;
        if (inFilter) matching++;
        const visible = inFilter && (expanded || shown < COLLAPSED);
        item.classList.toggle('is-hidden', !visible);
        if (visible) shown++;
      });

      if (moreBt) {
        const hiddenCount = matching - shown;
        if (matching <= COLLAPSED) {
          moreBt.hidden = true;
        } else {
          moreBt.hidden = false;
          moreBt.textContent = expanded ? 'Show fewer topics' : 'Show all ' + matching + ' topics';
          moreBt.setAttribute('aria-expanded', String(expanded));
        }
        if (countP) countP.textContent = 'Showing ' + shown + ' of ' + matching + ' topics';
        if (hiddenCount < 0 && countP) countP.textContent = '';
      }
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        filter = tab.getAttribute('data-filter') || 'all';
        expanded = false;
        apply();
      });
    });

    if (moreBt) {
      moreBt.addEventListener('click', function () {
        expanded = !expanded;
        apply();
        if (!expanded) explorer.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }

    apply();
  }

  /* ============================================================
     6b. PREMIUM VIDEO — graceful state before the file is uploaded
     ============================================================
     Until videos/premium-course-introduction.mp4 exists, the browser
     reports "no supported source". Rather than showing a dead player,
     mark the frame so the poster and a short note are displayed.
     This disappears by itself once you upload the file.
  ============================================================ */
  const videoEl = $('.video-el');

  if (videoEl) {
    const markMissing = function () {
      const frame = videoEl.closest('.video-frame');
      if (!frame || frame.classList.contains('is-missing')) return;
      frame.classList.add('is-missing');
      videoEl.removeAttribute('controls');
    };

    // networkState 3 === NETWORK_NO_SOURCE
    const source = $('source', videoEl);
    if (source) source.addEventListener('error', markMissing);
    videoEl.addEventListener('error', markMissing);
    window.setTimeout(function () {
      if (videoEl.networkState === 3) markMissing();
    }, 1200);
  }

  /* ============================================================
     7. 3D INTERACTION LAYER
  ============================================================ */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const allowMotion  = !reduceMotion;
  const allowPointer = allowMotion && finePointer;

  /* Photo slots: hide any <img> whose file isn't uploaded yet, so a
     broken-image icon never appears over the placeholder. */
  $$('.media > img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });

  /* Nav elevation on scroll */
  const nav = $('.nav');
  if (nav) {
    let ticking = false;
    const applyNav = function () {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(applyNav); ticking = true; }
    }, { passive: true });
    applyNav();
  }

  /* Scroll reveal, staggered within each row */
  const revealEls = $$('[data-reveal]');
  const groups = new Map();
  revealEls.forEach(function (el) {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach(function (els) {
    els.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', Math.min((i % 4) * 0.09, 0.27) + 's');
    });
  });

  if (allowMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  if (!allowPointer) return;

  /* Hero stage: pointer rotates the scene, objects drift by depth */
  const hero  = $('.hero');
  const stage = $('#stage');

  if (hero && stage) {
    const inner = $('.stage-inner', stage);
    const objs  = $$('.obj', stage);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, visible = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }

    const step = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;

      if (inner) {
        inner.style.setProperty('--sx', (-cy * 7).toFixed(2) + 'deg');
        inner.style.setProperty('--sy', (cx * 11).toFixed(2) + 'deg');
      }
      objs.forEach(function (o) {
        const d = parseFloat(o.dataset.depth) || 1;
        o.style.translate = (cx * d * 14).toFixed(1) + 'px ' + (cy * d * 10).toFixed(1) + 'px';
      });

      const settled = Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002;
      raf = (!settled && visible && !document.hidden) ? window.requestAnimationFrame(step) : null;
    };
    const kick = function () { if (!raf) raf = window.requestAnimationFrame(step); };

    hero.addEventListener('mousemove', function (e) {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    hero.addEventListener('mouseleave', function () { tx = 0; ty = 0; kick(); });
  }

  /* Premium deck: same idea, smaller */
  const premium = $('.premium');
  const deck    = $('.deck-inner');

  if (premium && deck) {
    premium.addEventListener('mousemove', function (e) {
      const r = premium.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      deck.style.setProperty('--dx', (-py * 10).toFixed(2) + 'deg');
      deck.style.setProperty('--dy', (px * 14).toFixed(2) + 'deg');
    });
    premium.addEventListener('mouseleave', function () {
      deck.style.setProperty('--dx', '0deg');
      deck.style.setProperty('--dy', '0deg');
    });
  }

  /* Depth-aware tilt with a light-catching glare */
  $$('[data-tilt]').forEach(function (el) {
    const isCard = el.classList.contains('card-3d');
    const max = isCard ? 7 : 4;
    let glare = null;
    let frame = null;

    if (isCard) {
      glare = document.createElement('span');
      glare.className = 'glare';
      glare.setAttribute('aria-hidden', 'true');
      el.appendChild(glare);
    }

    el.addEventListener('mousemove', function (e) {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = null;
        const r  = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
        if (glare) {
          el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        }
      });
    });

    el.addEventListener('mouseleave', function () {
      if (frame) { window.cancelAnimationFrame(frame); frame = null; }
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
})();

/**
 * ZINGSA site interactions — mega nav, mobile menu, reveals, hero
 */
(function () {
  const header = document.querySelector('.site-header');
  const navMenu = document.querySelector('.nav-menu');
  const hamburger = document.querySelector('.hamburger');
  const navItems = document.querySelectorAll('.nav-item.has-mega');
  const mqDesktop = window.matchMedia('(min-width: 901px)');

  // Grace period before a mega panel closes on mouseleave, so users can
  // move the cursor diagonally from the trigger into the panel without
  // it vanishing. Re-entering (this item or another) cancels the timer.
  const MEGA_CLOSE_DELAY = 380;
  let megaCloseTimer = null;

  function closeAllMegas() {
    clearTimeout(megaCloseTimer);
    navItems.forEach((item) => {
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-link');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      resetMegaPosition(item);
    });
  }

  function resetMegaPosition(item) {
    const mega = item.querySelector('.mega');
    if (!mega) return;
    mega.style.left = '';
    mega.style.right = '';
  }

  /** Keep desktop mega panels inside the viewport (right-nav items especially). */
  function positionMega(item) {
    const mega = item.querySelector('.mega');
    if (!mega || !mqDesktop.matches) return;

    mega.style.left = '0';
    mega.style.right = 'auto';

    const pad = 16;
    const rect = mega.getBoundingClientRect();
    if (rect.right > window.innerWidth - pad) {
      mega.style.left = 'auto';
      mega.style.right = '0';
    }

    const rect2 = mega.getBoundingClientRect();
    if (rect2.left < pad) {
      const itemRect = item.getBoundingClientRect();
      const width = rect2.width;
      const maxLeft = window.innerWidth - pad - width;
      const target = Math.max(pad, Math.min(itemRect.left, maxLeft));
      mega.style.left = `${Math.round(target - itemRect.left)}px`;
      mega.style.right = 'auto';
    }
  }

  function openMega(item) {
    const trigger = item.querySelector('.nav-link');
    navItems.forEach((other) => {
      if (other !== item) {
        other.classList.remove('is-open');
        const b = other.querySelector('.nav-link');
        if (b) b.setAttribute('aria-expanded', 'false');
        resetMegaPosition(other);
      }
    });
    item.classList.add('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    // Measure after open so width/layout are correct
    requestAnimationFrame(() => positionMega(item));
  }

  function closeMobile() {
    if (!navMenu || !hamburger) return;
    navMenu.classList.remove('is-open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    closeAllMegas();
  }

  // Hamburger
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
      if (!open) closeAllMegas();
    });
  }

  // Mega menus
  navItems.forEach((item) => {
    const trigger = item.querySelector('.nav-link');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      const isDesktop = mqDesktop.matches;
      // On desktop, allow hover-primary but click toggles for keyboard users
      if (!isDesktop) {
        e.preventDefault();
        const willOpen = !item.classList.contains('is-open');
        navItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('is-open');
            const b = other.querySelector('.nav-link');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      } else {
        // Desktop: if it has href to a page, navigate; mega opens on hover
        // Prevent accidental navigation when expanding via keyboard
        if (trigger.getAttribute('aria-expanded') === 'false' && e.detail === 0) {
          e.preventDefault();
          openMega(item);
        }
      }
    });

    item.addEventListener('mouseenter', () => {
      if (!mqDesktop.matches) return;
      clearTimeout(megaCloseTimer);
      openMega(item);
    });
    item.addEventListener('mouseleave', () => {
      if (!mqDesktop.matches) return;
      clearTimeout(megaCloseTimer);
      megaCloseTimer = setTimeout(() => {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        resetMegaPosition(item);
      }, MEGA_CLOSE_DELAY);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const willOpen = !item.classList.contains('is-open');
        closeAllMegas();
        if (willOpen) openMega(item);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (!mqDesktop.matches) return;
    navItems.forEach((item) => {
      if (item.classList.contains('is-open')) positionMega(item);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMegas();
      closeMobile();
    }
  });

  document.addEventListener('click', (e) => {
    if (!header) return;
    if (!header.contains(e.target) && mqDesktop.matches) {
      closeAllMegas();
    }
  });

  // Close mobile when following a real link
  document.querySelectorAll('.mega__link, .nav-item:not(.has-mega) > .nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (!mqDesktop.matches) closeMobile();
    });
  });

  mqDesktop.addEventListener('change', () => {
    closeMobile();
    closeAllMegas();
  });

  // Scroll reveals
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
    );
    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        io.observe(el);
      }
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Smooth in-page anchors with sticky header offset
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) return;
      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;
      const path = href.slice(0, hashIndex);
      const hash = href.slice(hashIndex + 1);
      if (!hash) return;

      const samePage =
        !path ||
        path === window.location.pathname.split('/').pop() ||
        (path === 'index.html' && (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')));

      if (!samePage && path) return;

      const target = document.getElementById(hash);
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight + 16 : 100;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', '#' + hash);
    });
  });

  // Hero crossfade — image + copy together
  const heroSection = document.querySelector('.hero');
  const heroSlides = document.querySelectorAll('[data-hero-slides] .hero__slide');
  const heroPanels = document.querySelectorAll('[data-hero-panel]');
  const heroDots = document.querySelectorAll('[data-hero-dot]');
  if (heroSlides.length > 1) {
    let heroIndex = 0;
    let heroTimer;

    function showHero(index) {
      heroIndex = (index + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === heroIndex);
      });
      heroPanels.forEach((panel, i) => {
        const active = i === heroIndex;
        panel.classList.toggle('is-active', active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      heroDots.forEach((dot, i) => {
        const active = i === heroIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (heroSection) {
        const activeSlide = heroSlides[heroIndex];
        heroSection.classList.toggle(
          'hero--split-active',
          !!activeSlide && activeSlide.classList.contains('hero__slide--split')
        );
      }
    }

    function startHeroTimer() {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => showHero(heroIndex + 1), 7000);
    }

    heroDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        showHero(Number(dot.getAttribute('data-hero-dot')));
        startHeroTimer();
      });
    });

    showHero(0);
    startHeroTimer();
  }

  // Tabs
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const buttons = root.querySelectorAll('[data-tab]');
    const panels = root.querySelectorAll('[data-tab-panel]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tab');
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
        panels.forEach((panel) => {
          panel.classList.toggle('is-active', panel.getAttribute('data-tab-panel') === id);
        });
      });
    });
  });

  // Filters
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter]');
    const targetSel = group.getAttribute('data-filter-target');
    const items = document.querySelectorAll(targetSel);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
        items.forEach((item) => {
          const cats = (item.getAttribute('data-category') || '').split(/\s+/);
          const show = filter === 'all' || cats.includes(filter);
          item.classList.toggle('is-hidden', !show);
        });
      });
    });
  });

  // Lightbox gallery
  const lightboxTriggers = document.querySelectorAll('[data-lightbox]');
  if (lightboxTriggers.length) {
    const items = [...lightboxTriggers].map((el) => ({
      src: el.getAttribute('data-lightbox') || el.querySelector('img')?.src,
      caption: el.getAttribute('data-caption') || el.querySelector('span')?.textContent || '',
    }));

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <button type="button" class="lightbox__close" aria-label="Close">×</button>
      <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous">‹</button>
      <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next">›</button>
      <div class="lightbox__inner">
        <img src="" alt="">
        <p class="lightbox__caption"></p>
      </div>`;
    document.body.appendChild(overlay);

    const img = overlay.querySelector('img');
    const caption = overlay.querySelector('.lightbox__caption');
    let lbIndex = 0;

    function openLb(i) {
      lbIndex = (i + items.length) % items.length;
      img.src = items[lbIndex].src;
      img.alt = items[lbIndex].caption || '';
      caption.textContent = items[lbIndex].caption || '';
      overlay.classList.add('is-open');
      document.body.classList.add('nav-open');
    }

    function closeLb() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }

    lightboxTriggers.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openLb(i);
      });
    });

    overlay.querySelector('.lightbox__close').addEventListener('click', closeLb);
    overlay.querySelector('.lightbox__nav--prev').addEventListener('click', () => openLb(lbIndex - 1));
    overlay.querySelector('.lightbox__nav--next').addEventListener('click', () => openLb(lbIndex + 1));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLb();
    });
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
      if (e.key === 'ArrowRight') openLb(lbIndex + 1);
    });
  }
})();

/*!
 * ZINGSA — zingsa-nav.js
 * Sticky navbar (transparent -> solid on scroll) + accessible mega menu.
 * Mega menu panels are width-constrained and anchored under their trigger —
 * they intentionally never span the full viewport width.
 * Vanilla JS, no dependencies.
 */
(function () {
  'use strict';

  var navbar = document.querySelector('[data-zn-navbar]');
  var megaLayer = document.querySelector('[data-zn-mega-layer]');
  if (!navbar) return;

  var navItems = Array.prototype.slice.call(document.querySelectorAll('[data-zn-nav-item]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Sticky navbar: transparent over hero, solid once scrolled.
     --------------------------------------------------------------------- */
  function updateNavbarState() {
    var scrolled = window.scrollY > 12;
    navbar.classList.toggle('is-scrolled', scrolled);
  }

  updateNavbarState();
  window.addEventListener('scroll', updateNavbarState, { passive: true });

  /* ---------------------------------------------------------------------
     Mega menu: open/close, positioning under the active trigger, and
     keyboard + outside-click handling.
     --------------------------------------------------------------------- */
  var activeItem = null;
  var closeTimer = null;

  function getPanel(item) {
    var id = item.getAttribute('data-zn-nav-item');
    return megaLayer ? megaLayer.querySelector('[data-zn-mega="' + id + '"]') : null;
  }

  function positionPanel(item, panel) {
    var trigger = item.querySelector('.zn-nav__link');
    if (!trigger || !panel) return;

    var triggerRect = trigger.getBoundingClientRect();
    var navRect = navbar.getBoundingClientRect();
    var panelWidth = panel.offsetWidth;
    var viewportWidth = document.documentElement.clientWidth;

    var triggerCenter = triggerRect.left + triggerRect.width / 2 - navRect.left;
    var left = triggerCenter - panelWidth / 2;

    var minLeft = 16;
    var maxLeft = navRect.width - panelWidth - 16;
    if (maxLeft < minLeft) maxLeft = minLeft;

    left = Math.max(minLeft, Math.min(left, maxLeft));
    panel.style.left = left + 'px';

    /* Little pointer/caret hinting which trigger the panel belongs to */
    var caretPos = triggerCenter - left;
    panel.style.setProperty('--zn-mega-caret', caretPos + 'px');
  }

  function openMega(item) {
    var panel = getPanel(item);
    if (!panel) return;

    if (activeItem && activeItem !== item) {
      closeMega(activeItem);
    }

    activeItem = item;
    item.classList.add('is-open');
    item.querySelector('.zn-nav__link').setAttribute('aria-expanded', 'true');
    panel.classList.add('is-active');
    navbar.classList.add('is-open');
    positionPanel(item, panel);
  }

  function closeMega(item) {
    var panel = getPanel(item);
    item.classList.remove('is-open');
    var trigger = item.querySelector('.zn-nav__link');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) panel.classList.remove('is-active');
    if (activeItem === item) {
      activeItem = null;
      navbar.classList.remove('is-open');
    }
  }

  function closeAllMega() {
    navItems.forEach(closeMega);
  }

  navItems.forEach(function (item) {
    var trigger = item.querySelector('.zn-nav__link');
    var panel = getPanel(item);
    if (!trigger || !panel) return;

    item.addEventListener('mouseenter', function () {
      clearTimeout(closeTimer);
      openMega(item);
    });

    item.addEventListener('mouseleave', function () {
      closeTimer = setTimeout(function () {
        closeMega(item);
      }, 140);
    });

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (item.classList.contains('is-open')) {
        closeMega(item);
      } else {
        openMega(item);
      }
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMega(item);
        trigger.focus();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openMega(item);
        var firstLink = panel.querySelector('.zn-mega__link');
        if (firstLink) firstLink.focus();
      }
    });

    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMega(item);
        trigger.focus();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target)) {
      closeAllMega();
    }
  });

  window.addEventListener('resize', function () {
    if (activeItem) positionPanel(activeItem, getPanel(activeItem));
  });

  window.addEventListener('scroll', function () {
    if (activeItem) positionPanel(activeItem, getPanel(activeItem));
  }, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile offcanvas: managed mostly by Bootstrap's Offcanvas + Accordion.
     We just make sure body scroll lock class stays in sync.
     --------------------------------------------------------------------- */
  var offcanvasEl = document.getElementById('znMobileNav');
  if (offcanvasEl && window.bootstrap) {
    offcanvasEl.addEventListener('show.bs.offcanvas', function () {
      document.body.classList.add('zn-nav-open');
    });
    offcanvasEl.addEventListener('hidden.bs.offcanvas', function () {
      document.body.classList.remove('zn-nav-open');
    });
  }
})();

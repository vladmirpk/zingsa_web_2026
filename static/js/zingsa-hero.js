/*!
 * ZINGSA — zingsa-hero.js
 * Lightweight hero behaviour: CSS-particle generation, animated stat
 * counters, and a UI-only search form guard. No external dependencies.
 * Respects prefers-reduced-motion throughout.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Floating particles — generated once, pure CSS animation from there.
     --------------------------------------------------------------------- */
  var particleField = document.querySelector('[data-zn-particles]');
  if (particleField && !reduceMotion) {
    var count = window.innerWidth < 768 ? 14 : 26;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'zn-particle';
      var left = Math.random() * 100;
      var size = (Math.random() * 2.6 + 1.6).toFixed(1);
      var duration = (Math.random() * 14 + 12).toFixed(1);
      var delay = (Math.random() * 14).toFixed(1);
      var drift = (Math.random() * 80 - 40).toFixed(0);

      p.style.left = left + '%';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = '-' + delay + 's';
      p.style.setProperty('--zn-drift', drift + 'px');

      frag.appendChild(p);
    }

    particleField.appendChild(frag);
  }

  /* ---------------------------------------------------------------------
     Animated stat counters — trigger once when scrolled into view.
     --------------------------------------------------------------------- */
  var stats = Array.prototype.slice.call(document.querySelectorAll('[data-zn-counter]'));

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-zn-counter'));
    if (isNaN(target)) return;

    if (reduceMotion) {
      el.textContent = target;
      return;
    }

    var duration = 1400;
    var start = null;
    var decimals = (el.getAttribute('data-zn-counter').split('.')[1] || '').length;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = decimals ? value.toFixed(decimals) : Math.floor(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = decimals ? target.toFixed(decimals) : target;
      }
    }

    requestAnimationFrame(step);
  }

  if (stats.length) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      stats.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      stats.forEach(animateCounter);
    }
  }

  /* ---------------------------------------------------------------------
     Search form — UI only in this phase. Prevent empty submits, the
     action target is a placeholder Django URL name resolved server-side.
     --------------------------------------------------------------------- */
  var searchForm = document.querySelector('[data-zn-hero-search]');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      var input = searchForm.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        e.preventDefault();
        input && input.focus();
      }
    });
  }
})();

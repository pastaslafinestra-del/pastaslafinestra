/**
 * main.js — Punto de entrada principal (ES Module).
 *
 * Orquesta en orden:
 *   1. Inicia el carrito
 *   2. Renderiza destacados y menú
 *   3. Activa tabs, scroll reveal, stagger y nav highlight
 *
 * tabsinit.js fue fusionado aquí — era redundante como archivo separado.
 */

import { Cart }                          from './cart.js';
import { initMenu, renderDestacados }    from './mcard.js';

/* ── 1. Carrito ─────────────────────────────────────────────────── */
Cart.init();

/* ── 2. Menú y destacados ───────────────────────────────────────── */
renderDestacados();
initMenu();

/* ── 3. Tabs ────────────────────────────────────────────────────── */
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('p-' + id)?.classList.add('on');
  btn.classList.add('on');

  // Scroll centrado en el tab activo (sticky tabs)
  const tabsWrap = btn.closest('.tabs-wrap');
  if (tabsWrap) {
    const scrollTo = btn.offsetLeft - (tabsWrap.offsetWidth / 2) + (btn.offsetWidth / 2);
    tabsWrap.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }
}

// Exponer showTab globalmente porque el HTML de secciones lo puede llamar
window.showTab = showTab;

function initTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', function () {
      showTab(this.dataset.tab, this);
    });
  });
}

initTabs();

/* ── 4. Nav móvil ───────────────────────────────────────────────── */
// Expuestas en window porque el HTML de navbar las llama con onclick
window.toggleMenu = () => document.getElementById('navMobile')?.classList.toggle('open');
window.closeMenu  = () => document.getElementById('navMobile')?.classList.remove('open');

/* ── 5. Reduced motion ──────────────────────────────────────────── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 6. Scroll reveal ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade, .fade-left, .fade-right').forEach(el => {
  reducedMotion ? el.classList.add('in') : revealObserver.observe(el);
});

/* ── 7. Stagger — cards ─────────────────────────────────────────── */
if (!reducedMotion) {
  const gridObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.mcard, .dest-card').forEach((card, i) => {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(18px)';
        card.style.transition = `opacity 0.5s ease ${i * 70}ms, transform 0.5s ease ${i * 70}ms`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        }));
      });
      gridObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.mgrid, .dest-scroll').forEach(el => gridObserver.observe(el));
}

/* ── 8. Nav highlight por scroll ────────────────────────────────── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const secObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => secObserver.observe(s));
})();

/* ── 9. Destacados — dots de scroll ─────────────────────────────── */
(function () {
  const scroll = document.querySelector('.dest-scroll');
  const dots   = document.querySelectorAll('.dest-dot');
  if (!scroll || !dots.length) return;

  scroll.addEventListener('scroll', () => {
    const index = Math.round(scroll.scrollLeft / 226);
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }, { passive: true });
})();

/* ── 10. Tabs sticky ────────────────────────────────────────────── */
(function () {
  const sentinel   = document.querySelector('.tabs-sentinel');
  const stickyWrap = document.querySelector('.tabs-sticky-wrap');
  const tabsWrap   = stickyWrap?.querySelector('.tabs-wrap');
  if (!sentinel || !stickyWrap) return;

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      stickyWrap.classList.toggle('is-stuck', !entry.isIntersecting);
    });
  }, { threshold: 0 }).observe(sentinel);

  if (tabsWrap) {
    tabsWrap.addEventListener('scroll', () => {
      const atEnd = tabsWrap.scrollLeft + tabsWrap.offsetWidth >= tabsWrap.scrollWidth - 4;
      stickyWrap.classList.toggle('scrolled-end', atEnd);
    });
  }
})();
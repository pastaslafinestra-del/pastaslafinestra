/**
 * main.js — Punto de entrada principal (ES Module).
 * Carga datos desde Supabase con Local-First Fallback y orquesta el frontend.
 */

import { Cart }                       from './cart.js';
import { initMenu, renderDestacados } from './mcard.js';
import { loadMenuData }               from './menu-fetch.js';

/* ── 0. Barra de urgencia (horario) ─────────────────────────────── */
function initUrgencyBar() {
  const bar = document.getElementById('urgency-bar');
  if (!bar) return;
  const now      = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const isOpen   = totalMin >= 660 && totalMin < 1320;
  if (isOpen) {
    bar.innerHTML = '🍝 Abierto ahora &nbsp;·&nbsp; Lunes a Domingo 11:00 AM – 10:00 PM &nbsp;·&nbsp; Delivery disponible &nbsp;<a href="https://wa.me/584247842743" target="_blank">Ordenar ahora →</a>';
  } else {
    bar.classList.add('closed');
    bar.innerHTML = '🔴 Cerrado &nbsp;·&nbsp; Nuestro horario es Lunes a Domingo 11:00 AM – 10:00 PM';
  }
}
initUrgencyBar();

/* ── 1. Carrito ─────────────────────────────────────────────────── */
Cart.init();

/* ── 5. Reduced motion (movido aquí para que initStagger lo use) ── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 2. Datos (Supabase / Local-First Fallback) → renderizado ────── */
try {
  const { menuData, destacadosData } = await loadMenuData();
  renderDestacados(destacadosData);
  initMenu(menuData);
  initStagger(); // Cards ya existen en el DOM
} catch (err) {
  console.error('[main] Error cargando menú:', err);
}

/* ── 3. Tabs ────────────────────────────────────────────────────── */
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('p-' + id)?.classList.add('on');
  btn.classList.add('on');

  const tabsWrap = btn.closest('.tabs-wrap');
  if (tabsWrap) {
    tabsWrap.scrollTo({
      left: btn.offsetLeft - (tabsWrap.offsetWidth / 2) + (btn.offsetWidth / 2),
      behavior: 'smooth'
    });
  }

  // Animar cards del panel recién activado
  if (!reducedMotion) {
    const panel = document.getElementById('p-' + id);
    if (panel) animateCards(panel.querySelectorAll('.mcard'));
  }
}
window.showTab = showTab;

function initTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', function () { showTab(this.dataset.tab, this); });
  });
}
initTabs();

/* ── 4. Nav móvil ───────────────────────────────────────────────── */
window.toggleMenu = () => document.getElementById('navMobile')?.classList.toggle('open');
window.closeMenu  = () => document.getElementById('navMobile')?.classList.remove('open');

/* ── 6. Scroll reveal ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade, .fade-left, .fade-right').forEach(el => {
  reducedMotion ? el.classList.add('in') : revealObserver.observe(el);
});

/* ── 7. Stagger ─────────────────────────────────────────────────── */
function animateCards(cards) {
  cards.forEach((card, i) => {
    const delay = i * 45;
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(16px)';
    card.style.transition = `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      // Liberar estilos inline al terminar animación para no bloquear el zoom/hover CSS
      setTimeout(() => {
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
        card.style.removeProperty('transition');
      }, delay + 450);
    }));
  });
}

function initStagger() {
  if (reducedMotion) return;

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const allCards = Array.from(document.querySelectorAll('.mcard, .dest-card'));
    allCards.forEach(card => { card.style.opacity = '0'; });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      // Para cada card, buscar su contenedor scrolleable como root
      const observed = new Set();

      allCards.forEach(card => {
        // Buscar el scroll container más cercano
        const container = card.closest('.mgrid, .dest-scroll') || null;

        if (observed.has(container)) return; // ya hay un observer para ese container

        const siblings = container
          ? Array.from(container.querySelectorAll('.mcard, .dest-card'))
          : [card];

        const obs = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.style.transition = 'opacity 0.45s ease';
            e.target.style.opacity    = '1';
            setTimeout(() => {
              e.target.style.removeProperty('opacity');
              e.target.style.removeProperty('transition');
            }, 460);
            obs.unobserve(e.target);
          });
        }, {
          root: container || null,
          threshold: 0.1,
          rootMargin: '0px 60px 0px 0px'
        });

        siblings.forEach(c => obs.observe(c));
        if (container) observed.add(container);
      });
    }));
  } else {
    // Desktop: observer por grid (comportamiento original)
    const gridObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCards(entry.target.querySelectorAll('.mcard, .dest-card'));
        gridObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.mgrid, .dest-scroll').forEach(el => gridObserver.observe(el));
  }
}

/* ── 8. Nav highlight ───────────────────────────────────────────── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => navObs.observe(s));
})();

/* ── 9. Destacados dots ─────────────────────────────────────────── */
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
    entries.forEach(e => stickyWrap.classList.toggle('is-stuck', !e.isIntersecting));
  }, { threshold: 0 }).observe(sentinel);
  if (tabsWrap) {
    tabsWrap.addEventListener('scroll', () => {
      stickyWrap.classList.toggle('scrolled-end',
        tabsWrap.scrollLeft + tabsWrap.offsetWidth >= tabsWrap.scrollWidth - 4);
    });
  }
})();

/* ── 11. Soporte táctil móvil (:active dinámico en iOS/Android) ──── */
document.addEventListener('touchstart', () => {}, { passive: true });


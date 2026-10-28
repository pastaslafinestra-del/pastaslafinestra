/**
 * mcard.js — Componente de card del menú.
 *
 * Los datos (menuData, destacadosData) se reciben como parámetros
 * desde main.js, que los carga desde Supabase via menu-fetch.js.
 */

import { ASSETS_BASE_URL } from './config.js';
import { Cart }             from './cart.js';

window.Cart = Cart;

const ICON_PLUS = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

// ── SANITIZACIÓN DEFENSIVA PARA RENDERIZADO EN DOM ───────
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeStyle(css) {
  if (!css) return '';
  return String(css).replace(/["'<>\\]/g, '');
}

function buildMcard(plato) {
  const hasImg = Boolean(plato.img);
  const wrapperClasses = ['mcard'];
  if (hasImg) wrapperClasses.push('mcard-foto', 'mcard-clean');

  let imgBlock = '';
  if (hasImg) {
    const safeImg    = encodeURI(`${ASSETS_BASE_URL}${plato.img}`);
    const baseStyle  = `background-image:url('${safeImg}')`;
    const extraStyle = plato.imgStyle ? `;${sanitizeStyle(plato.imgStyle)}` : '';
    const imgClass   = plato.imgStyle ? 'mcard-img mcard-img--producto' : 'mcard-img';
    imgBlock = `<div class="${imgClass}" style="${baseStyle}${extraStyle}"></div>`;
  }

  const catBlock = plato.cat ? `<div class="mcard-cat">${escHtml(plato.cat)}</div>` : '';

  return `
    <div class="${wrapperClasses.join(' ')}">
      ${imgBlock}
      <div class="mcard-body">
        ${catBlock}
        <div class="mcard-name">${escHtml(plato.name)}</div>
        <div class="mcard-desc">${escHtml(plato.desc)}</div>
        <div class="mcard-footer">
          <span class="mcard-price">${escHtml(plato.price)}</span>
          <button class="mcard-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

function renderGrid(panelId, platos) {
  const panel = document.getElementById(panelId);
  if (!panel) { console.warn(`[mcard] Panel #${panelId} no encontrado.`); return; }
  const grid = panel.querySelector('.mgrid');
  if (!grid)  { console.warn(`[mcard] .mgrid no encontrado en #${panelId}.`); return; }
  grid.innerHTML = platos.map(buildMcard).join('\n');
}

export function initMenu(menuData) {
  renderGrid('p-entradas',    menuData.entradas    || []);
  renderGrid('p-pastas',      menuData.pastas      || []);
  renderGrid('p-pizzas',      menuData.pizzas      || []);
  renderGrid('p-proteinas',   menuData.proteinas   || []);
  renderGrid('p-ensaladas',   menuData.ensaladas   || []);
  renderGrid('p-infantil',    menuData.infantil    || []);
  renderGrid('p-postres',     menuData.postres     || []);
  renderGrid('p-bebidas',     menuData.bebidas     || []);
  renderGrid('p-adicionales', menuData.adicionales || []);
}

function buildDestCard(plato) {
  const imgStyle = plato.img
    ? ` style="background-image:url('${encodeURI(ASSETS_BASE_URL + plato.img)}')"`
    : '';
  return `
    <div class="dest-card">
      <div class="dest-img"${imgStyle}>
        <span class="dest-badge">${escHtml(plato.badge)}</span>
      </div>
      <div class="dest-info">
        <div class="dest-name">${escHtml(plato.name)}</div>
        <div class="dest-desc">${escHtml(plato.desc)}</div>
        <div class="dest-bottom">
          <span class="dest-price">${escHtml(plato.price)}</span>
          <button class="dest-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

export function renderDestacados(destacadosData) {
  const scroll        = document.querySelector('.dest-scroll');
  const dotsContainer = document.querySelector('.dest-dots');
  if (!scroll || !dotsContainer) return;

  scroll.innerHTML = destacadosData.map(buildDestCard).join('\n');
  dotsContainer.innerHTML = destacadosData
    .map((_, i) => `<span class="dest-dot${i === 0 ? ' active' : ''}"></span>`)
    .join('\n');
}

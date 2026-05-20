/**
 * mcard.js — Componente de card del menú.
 *
 * Genera el HTML de cada card del menú y los destacados.
 * Renderiza grids completos por categoría.
 *
 * Imports:
 *   - ASSETS_BASE_URL : ruta base de imágenes (hoy: 'assets/', mañana: Supabase Storage URL)
 *   - WA_NUMBER       : número de WhatsApp centralizado en config.js
 *   - menuData        : datos del menú
 *   - destacadosData  : datos de destacados
 *   - Cart            : módulo del carrito
 */

import { ASSETS_BASE_URL, WA_NUMBER } from './config.js';
import { menuData, destacadosData }   from './menu-data.js';
import { Cart }                        from './cart.js';

// Cart debe ser accesible desde los onclick inline del HTML generado
window.Cart = Cart;

/* ── Ícono reutilizable ───────────────────────────────────────────── */
const ICON_PLUS = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

/* ── Generador de una card de menú ───────────────────────────────── */
function buildMcard(plato) {
  const hasImg = Boolean(plato.img);

  const wrapperClasses = ['mcard'];
  if (hasImg) wrapperClasses.push('mcard-foto', 'mcard-clean');

  let imgBlock = '';
  if (hasImg) {
    // ASSETS_BASE_URL reemplaza el '../assets/' hardcodeado.
    // Cuando llegue Supabase Storage, solo cambia config.js — nada más.
    const baseStyle  = `background-image:url('${ASSETS_BASE_URL}${plato.img}')`;
    const extraStyle = plato.imgStyle ? `;${plato.imgStyle}` : '';
    const imgClass   = plato.imgStyle ? 'mcard-img mcard-img--producto' : 'mcard-img';
    imgBlock = `<div class="${imgClass}" style="${baseStyle}${extraStyle}"></div>`;
  }

  const catBlock = plato.cat
    ? `<div class="mcard-cat">${plato.cat}</div>`
    : '';

  return `
    <div class="${wrapperClasses.join(' ')}">
      ${imgBlock}
      <div class="mcard-body">
        ${catBlock}
        <div class="mcard-name">${plato.name}</div>
        <div class="mcard-desc">${plato.desc}</div>
        <div class="mcard-footer">
          <span class="mcard-price">${plato.price}</span>
          <button class="mcard-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${plato.name}"
                  data-price="${plato.price}"
                  aria-label="Agregar ${plato.name} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

/* ── Renderizado de un panel completo ────────────────────────────── */
function renderGrid(panelId, platos) {
  const panel = document.getElementById(panelId);
  if (!panel) {
    console.warn(`[mcard] Panel #${panelId} no encontrado.`);
    return;
  }
  const grid = panel.querySelector('.mgrid');
  if (!grid) {
    console.warn(`[mcard] .mgrid no encontrado dentro de #${panelId}.`);
    return;
  }
  grid.innerHTML = platos.map(buildMcard).join('\n');
}

/* ── Inicialización: renderiza todos los paneles ─────────────────── */
export function initMenu() {
  renderGrid('p-entradas',    menuData.entradas);
  renderGrid('p-pastas',      menuData.pastas);
  renderGrid('p-pizzas',      menuData.pizzas);
  renderGrid('p-proteinas',   menuData.proteinas);
  renderGrid('p-ensaladas',   menuData.ensaladas);
  renderGrid('p-infantil',    menuData.infantil);
  renderGrid('p-postres',     menuData.postres);
  renderGrid('p-bebidas',     menuData.bebidas);
  renderGrid('p-adicionales', menuData.adicionales);
}

/* ── DESTACADOS ──────────────────────────────────────────────────── */
function buildDestCard(plato) {
  return `
    <div class="dest-card">
      <div class="dest-img" style="background-image:url('${ASSETS_BASE_URL}${plato.img}')">
        <span class="dest-badge">${plato.badge}</span>
      </div>
      <div class="dest-info">
        <div class="dest-name">${plato.name}</div>
        <div class="dest-desc">${plato.desc}</div>
        <div class="dest-bottom">
          <span class="dest-price">${plato.price}</span>
          <button class="dest-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${plato.name}"
                  data-price="${plato.price}"
                  aria-label="Agregar ${plato.name} al carrito">
            ${ICON_PLUS}
          </button>
        </div>
      </div>
    </div>`.trim();
}

export function renderDestacados() {
  const scroll         = document.querySelector('.dest-scroll');
  const dotsContainer  = document.querySelector('.dest-dots');
  if (!scroll || !dotsContainer) return;

  scroll.innerHTML = destacadosData.map(buildDestCard).join('\n');

  dotsContainer.innerHTML = destacadosData
    .map((_, i) => `<span class="dest-dot${i === 0 ? ' active' : ''}"></span>`)
    .join('\n');
}
/**
 * scripts/prerender.js — Generador estático de HTML para SSR / Pre-renderizado
 *
 * Lee js/menu-data.js e inyecta las cards de destacados y del menú completo
 * directamente dentro del HTML estático de index.html antes del despliegue.
 * Cumple con Q-01: Cero layout shift (CLS = 0) y visibilidad 100% para SEO y curl.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { menuData, destacadosData } from '../js/menu-data.js';
import { ASSETS_BASE_URL } from '../js/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

const ICON_PLUS = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

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
                  data-cart-add
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
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
                  data-cart-add
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

export function prerender() {
  console.log('🔨 Iniciando pre-renderizado de catálogo estático...');
  let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  // 1. Pre-renderizar destacados
  const destCardsHtml = destacadosData.map(buildDestCard).join('\n  ');
  const destDotsHtml = destacadosData.map((_, i) => `<span class="dest-dot${i === 0 ? ' active' : ''}"></span>`).join('\n  ');

  html = html.replace(/<div class="dest-scroll">[\s\S]*?<\/div>/, `<div class="dest-scroll">\n  ${destCardsHtml}\n  </div>`);
  html = html.replace(/<div class="dest-dots">[\s\S]*?<\/div>/, `<div class="dest-dots">\n  ${destDotsHtml}\n  </div>`);

  // 2. Pre-renderizar categorías de la carta
  const categorias = [
    'entradas', 'pastas', 'pizzas', 'proteinas',
    'ensaladas', 'infantil', 'postres', 'bebidas', 'adicionales'
  ];

  let totalCards = 0;
  categorias.forEach(cat => {
    const items = menuData[cat] || [];
    totalCards += items.length;
    const cardsHtml = items.map(buildMcard).join('\n    ');

    // Buscar el contenedor específico de la categoría
    const regex = new RegExp(`(<div class="panel[^"]*" id="p-${cat}">[\\s\\S]*?<div class="mgrid">)[\\s\\S]*?(<\\/div>)`);
    html = html.replace(regex, `$1\n    ${cardsHtml}\n  $2`);
  });

  fs.writeFileSync(INDEX_HTML_PATH, html, 'utf8');
  console.log(`✅ [PRERENDER OK] ${totalCards} platos y ${destacadosData.length} destacados inyectados en index.html.`);
}

prerender();

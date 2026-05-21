/**
 * cart.js — Carrito de compras de La Finestra.
 *
 * Responsabilidades:
 *   - Estado del carrito (items, cantidades, subtotal)
 *   - Renderizado del drawer
 *   - Generación del mensaje WhatsApp formateado
 *
 * API pública: Cart.add(name, priceStr, btnEl)
 *              Cart.init()
 *              Cart.open()
 *              Cart.close()
 */

import { WA_NUMBER } from './config.js';

export const Cart = (() => {

  /* ── Estado ─────────────────────────────────────────── */
  let items = [];

  /* ── Utilidades ─────────────────────────────────────── */
  function parsePrice(str) {
    const clean = str.split('–')[0]
      .replace(/[^0-9,\.]/g, '')
      .replace(',', '.');
    return parseFloat(clean) || 0;
  }

  function makeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  function totalUnits() {
    return items.reduce((acc, i) => acc + i.qty, 0);
  }

  function subtotal() {
    return items.reduce((acc, i) => acc + i.price * i.qty, 0);
  }

  function fmtPrice(num) {
    return '$' + num.toFixed(2).replace('.', ',');
  }

  /* ── Mensaje WhatsApp ───────────────────────────────── */
  function buildWaMessage() {
    const lines = items.map(i =>
      `• ${i.qty}x ${i.name} — ${fmtPrice(i.price * i.qty)}`
    );
    lines.push('');
    lines.push(`*Total: ${fmtPrice(subtotal())}*`);
    lines.push('');
    lines.push('¡Hola! Quiero realizar este pedido 🍝');
    return encodeURIComponent(lines.join('\n'));
  }

  /* ── DOM refs ───────────────────────────────────────── */
  let drawerEl, overlayEl, badgeEl, itemsEl, subtotalEl, fabEl, countEl;

  function injectHTML() {
    const WA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

    const CART_SVG = `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="cart-overlay" id="cart-overlay"></div>

      <div class="cart-drawer" id="cart-drawer" role="dialog" aria-label="Carrito de compras">
        <div class="cart-header">
          <div>
            <span class="cart-header-title">Tu pedido</span>
            <span class="cart-header-count" id="cart-count"></span>
          </div>
          <div class="cart-header-actions">
            <button class="cart-clear" id="cart-clear" aria-label="Vaciar pedido" style="display:none">
              Vaciar todo
            </button>
            <button class="cart-close" id="cart-close" aria-label="Cerrar carrito">
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div class="cart-items" id="cart-items"></div>
        <div class="cart-footer" id="cart-footer">
          <div class="cart-subtotal-row">
            <span class="cart-subtotal-label">Subtotal</span>
            <span class="cart-subtotal-value" id="cart-subtotal">$0,00</span>
          </div>
          <p class="cart-note">Precios en USD · Tasa BCV del día · 25% dcto. pagando en divisas</p>
          <a id="cart-wa-btn" class="cart-btn-wa" target="_blank">
            ${WA_SVG}
            Enviar pedido por WhatsApp
          </a>
        </div>
      </div>

      <button class="cart-fab" id="cart-fab" aria-label="Ver carrito">
        ${CART_SVG}
        <span class="cart-badge" id="cart-badge"></span>
      </button>
    `);
  }

  let clearEl;

  function bindRefs() {
    drawerEl   = document.getElementById('cart-drawer');
    overlayEl  = document.getElementById('cart-overlay');
    badgeEl    = document.getElementById('cart-badge');
    itemsEl    = document.getElementById('cart-items');
    subtotalEl = document.getElementById('cart-subtotal');
    fabEl      = document.getElementById('cart-fab');
    countEl    = document.getElementById('cart-count');
    clearEl    = document.getElementById('cart-clear');
  }

  function bindEvents() {
    document.getElementById('cart-close').addEventListener('click', close);
    overlayEl.addEventListener('click', close);
    fabEl.addEventListener('click', open);
    clearEl.addEventListener('click', clearAll);

    itemsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'inc') changeQty(id,  1);
      if (btn.dataset.action === 'dec') changeQty(id, -1);
    });
  }

  /* ── Abrir / Cerrar ─────────────────────────────────── */
  function open() {
    drawerEl.classList.add('open');
    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawerEl.classList.remove('open');
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Renderizado ────────────────────────────────────── */
  function render() {
    const units = totalUnits();
    const total = subtotal();

    badgeEl.textContent = units > 99 ? '99+' : units;
    badgeEl.classList.toggle('visible', units > 0);
    countEl.textContent = units > 0 ? `(${units} ${units === 1 ? 'ítem' : 'ítems'})` : '';
    subtotalEl.textContent = fmtPrice(total);

    // Mostrar "Vaciar todo" solo cuando hay ítems
    clearEl.style.display = items.length > 0 ? 'block' : 'none';

    const waBtn = document.getElementById('cart-wa-btn');
    if (items.length > 0) {
      waBtn.href = `https://wa.me/${WA_NUMBER}?text=${buildWaMessage()}`;
      waBtn.style.pointerEvents = '';
      waBtn.style.opacity = '1';
    } else {
      waBtn.href = '#';
      waBtn.style.pointerEvents = 'none';
      waBtn.style.opacity = '0.5';
    }

    if (items.length === 0) {
      itemsEl.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          <div class="cart-empty-title">Tu carrito está vacío</div>
          <div class="cart-empty-sub">Agrega platos con el botón&nbsp;<strong>+</strong> en cada card</div>
        </div>`;
      return;
    }

    const ICON_MINUS = `<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`;
    const ICON_PLUS  = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

    itemsEl.innerHTML = items.map(item => `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-name" title="${item.name}">${item.name}</div>
          <div class="cart-item-price">${fmtPrice(item.price * item.qty)}</div>
        </div>
        <div class="cart-qty">
          <button class="cart-qty-btn ${item.qty === 1 ? 'will-remove' : ''}"
                  data-action="dec" data-id="${item.id}"
                  aria-label="Reducir cantidad">${ICON_MINUS}</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" data-action="inc" data-id="${item.id}"
                  aria-label="Aumentar cantidad">${ICON_PLUS}</button>
        </div>
      </div>`).join('');
  }

  /* ── Estado ─────────────────────────────────────────── */
  function add(name, priceStr, btnEl) {
    const id       = makeId(name);
    const price    = parsePrice(priceStr);
    const existing = items.find(i => i.id === id);

    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id, name, price, qty: 1 });
    }

    if (btnEl) {
      btnEl.classList.remove('adding');
      void btnEl.offsetWidth;
      btnEl.classList.add('adding');
      btnEl.addEventListener('animationend', () => btnEl.classList.remove('adding'), { once: true });
    }

    render();
  }

  function clearAll() {
    items = [];
    render();
  }

  function changeQty(id, delta) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    render();
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    injectHTML();
    bindRefs();
    bindEvents();
    render();
  }

  return { init, add, open, close };

})();
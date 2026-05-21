/**
 * tabs-init.js — Inicialización de tabs del menú y renderizado de cards.
 *
 * Este bloque reemplaza los onclick="showTab(...)" inline que había en menu.html.
 * Se ejecuta una vez que el componente menu.html está cargado en el DOM.
 *
 * INTEGRACIÓN: Pega este bloque dentro de tu main.js existente,
 * dentro del .then() que ya carga los componentes, después de initMenu().
 *
 * Ejemplo de dónde pegarlo en main.js:
 *
 *   Promise.all([...]).then(() => {
 *     // 1. Renderizar todas las cards desde los datos
 *     initMenu();
 *
 *     // 2. Inicializar los tabs
 *     initTabs();
 *
 *     // ... resto de tu código existente
 *   });
 */

function initTabs() {
  const tabs = document.querySelectorAll('.tab[data-tab]');

  tabs.forEach(btn => {
    btn.addEventListener('click', function () {
      const tabId = this.dataset.tab;
      showTab(tabId, this);
    });
  });
}

/**
 * showTab — muestra el panel correspondiente y activa el tab.
 * Mantiene la misma firma que el showTab original para compatibilidad.
 *
 * @param {string} tabId  - ID de la categoría (ej: 'entradas')
 * @param {Element} btn   - Botón tab que fue clickeado
 */
function showTab(tabId, btn) {
  // Desactivar todos los paneles y tabs
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));

  // Activar el panel y tab seleccionados
  const panel = document.getElementById(`p-${tabId}`);
  if (panel) panel.classList.add('on');
  if (btn)   btn.classList.add('on');
}
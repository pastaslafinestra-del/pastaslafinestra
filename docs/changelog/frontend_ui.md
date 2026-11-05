# 🎨 Bitácora de Frontend, UI y Experiencia de Usuario — La Finestra

---

### [2026-10-28] Hito 2.0.0 — Desacoplamiento de Componentes y Optimización de Carga
- **Cero Cascadas de Red:** Identificación y corrección del antipatrón de carga asíncrona por fragmentos (`fetch('sections/...')`).
- **Limpieza de Dependencias Zombie:** Remoción del script no utilizado `w3.js` en `index.html`.
- **Eliminación de Código Huérfano:** Retiro de `tabsinit.js`, consolidando la inicialización de eventos de pestañas en `main.js`.
- **Auditoría de Hojas de Estilo:** Identificación de archivos CSS redundantes (como `global.css` vacío) para unificación de tokens semánticos.
- **Microinteracciones y Carrito:** Mantenimiento del drawer interactivo (`cart.js`) con feedback táctil inmediato en móviles y botón flotante de WhatsApp con animación de pulso.

---

### [2026-10-28] Hito 2.0.2 — Auditoría Integral de JavaScript Frontend y Panel de Administración
- **Consumo RLS en Reservas (`reservas.js`):** Sincronización de fecha mínima en selector (`input.min`) con la zona horaria oficial `America/Caracas` (UTC-4) y validación de longitud defensiva en nombre ($2 \le \text{longitud} \le 120$).
- **Soporte Nativo de Supabase Auth en Panel (`admin.js`):** Integración directa del endpoint `/auth/v1/token?grant_type=password` para intercambio de credenciales administrativas por JWT real con claim `role: 'admin'`.
- **Manejo Granular de Errores RLS:** Interceptación e interpretación de respuestas HTTP 401 y 403 de PostgREST, proporcionando alertas informativas de autorización sin bloquear la interfaz.
- **Badge Dinámico de Estado de Sesión:** Implementación visual de `#admin-user-badge` en el panel administrativo diferenciando estado autenticado en Supabase vs modo contingencia local.
- **Sanitización de URL Base (`menu-fetch.js`):** Eliminación defensiva de barras finales en `SUPABASE_URL` para prevenir dobles slashes en rutas REST y Storage.

---

### [2026-10-28] Hito 2.0.3 — Refactorización UI/UX, Microinteracciones y Zoom Cinematográfico
- **Efecto Zoom Tridimensional:** Elevación suave y escalado al $104\%$ (`transform: translateY(-8px) scale(1.04)`) en tarjetas `.mcard` y `.dest-card`.
- **Doble Zoom en Imágenes de Menú:** Combinación de `transform: scale(1.10)` y `background-size: 114%` con curvas Bezier aceleradas por GPU.
- **Micro-interacciones Móviles:** Soporte táctil reactivo con listener pasivo de `touchstart` y respuesta elástica al toque (`scale(1.03)`).
- **Badges Glassmórficos:** Acabado translúcido esmerilado con desenfoque de fondo (`backdrop-filter: blur(10px)`) y borde sutil.
- **Prevención de Regresiones:** Desbloqueo de estilos en línea en `animateCards` y eliminación de reglas invasivas de transformación.

---

### [2026-10-29] Hito 2.0.4 — Branding Oficial, Favicons Multiplataforma y Despliegue Zero-Config
- **Favicons e Iconos Oficiales:** Generación e integración del imagotipo oficial de autor La Finestra con tipografía cursiva sobre fondo oscuro (`#0A0A0A`).
- **Soporte Multiplataforma Completo:** Creación de `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180), `icon-192.png` (192x192 para Google Chrome New Tab y Android), `icon-512.png` y `site.webmanifest`.
- **Inyección en Páginas HTML:** Vinculación sistemática en `index.html`, `reservas.html`, `admin.html`, `privacidad.html`, `terminos.html` y `404.html`.
- **Despliegue Zero-Config en Vercel:** Resolución de incompatibilidad de esquema en `vercel.json` y `package.json`, restableciendo despliegues estáticos continuos e instantáneos (`2s`) en producción.

---

### [2026-11-04] Hito 2.0.5 — Restauración de Zoom Hover en Desktop y Blindaje Anti-Regresión (ERR-006)
- **Preservación de Zoom Interactivo en Desktop (`css/cards.css`, `css/destacados.css`):** Aislamiento de `@media (prefers-reduced-motion: reduce)` exclusivamente a animaciones autónomas (`.wa-float-pulse`, `.fade`), evitando que Windows con efectos de ventana desactivados anule el zoom y elevación `:hover` en `.mcard` y `.dest-card`.
- **Propiedades de Transformación Individuales (`js/main.js`):** Uso de `translate` en `animateCards` y transformaciones de identidad base (`transform: translateY(0) scale(1)`) para impedir colisiones de especificidad ni saltos de contexto de apilamiento durante el `:hover`.
- **Guardia en Compuerta de Calidad (`scripts/quality_gate.js`):** Verificación determinista contra bloqueos de `.mcard:hover` o `.dest-card:hover` dentro de `prefers-reduced-motion`.

---

### [2026-11-05] Hito 2.0.6 — Rediseño Editorial Full-Bleed de Cards y Blindaje de Scroll Táctil en Móvil
- **Imagen Completa en Cards (`css/destacados.css`, `css/cards.css`):** Rediseño de `.dest-card` y `.mcard:has(.mcard-img)` (con fallback `@supports not selector(:has(*))` en `.mcard.mcard-foto`) para que la fotografía del plato ocupe el $100\%$ de la tarjeta (`245×325px` en Desktop, `210×290px` en Móvil) con degradado inferior oscuro.
- **Descripción Interactiva bajo Demanda (`js/mcard.js`):** Visualización limpia de título, precio y botón `+` por defecto, revelando la descripción del plato sobre un overlay glassmórfico (`backdrop-filter: blur(10px)`) al hacer clic o tocar la card (`.show-desc`), con indicador `ⓘ Info` / `✕ Cerrar` y soporte de teclado accesible (`aria-expanded`, `Enter`/`Space`).
- **Blindaje de Scroll y Eliminación de Parpadeo en Móvil:** Remoción de `background-size: 114%` en favor de zoom puro por GPU (`transform: scale(1.08)` sobre `background-size: cover`), adición de `overflow-y: hidden` y `touch-action: pan-x pan-y` en `.dest-scroll` y `.mgrid`, y aislamiento de la elevación vertical de caja mediante `@media (hover: none), (pointer: coarse)` para evitar choques entre el scroll horizontal y vertical en iOS/Android.





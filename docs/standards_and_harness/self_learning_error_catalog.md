# 📓 Catálogo de Auto-Aprendizaje y Errores (5-Whys) — La Finestra

> **Propósito:** Registrar cada fallo significativo, regresión o vulnerabilidad identificada y resuelta en este proyecto para que ningún modelo de Inteligencia Artificial vuelva a cometer el mismo error en el futuro.  
> **Ubicación:** `docs/standards_and_harness/self_learning_error_catalog.md`

---

## 📌 Plantilla de Registro (5-Whys)

```markdown
### [ERR-00X] [Título Corto del Incidente]
- **Fecha:** YYYY-MM-DD
- **Módulo / Archivo afectado:** `...`
- **Síntoma Inicial:** ¿Qué vio el usuario o qué fallo reportó el test?
- **Análisis de los 5 Porqués:**
  1. ¿Por qué ocurrió el síntoma? -> [Respuesta 1]
  2. ¿Por qué ocurrió [Respuesta 1]? -> [Respuesta 2]
  3. ¿Por qué ocurrió [Respuesta 2]? -> [Respuesta 3]
  4. ¿Por qué ocurrió [Respuesta 3]? -> [Respuesta 4]
  5. ¿Por qué ocurrió [Respuesta 4]? -> **(Causa Raíz Real)**
- **Solución Correcta Implementada:** [Cambio de ingeniería]
- **Invariante / Regla Nueva para AGENTS.md:** [Regla inquebrantable]
```

---

## 📋 Registro Histórico de Aprendizajes

### [ERR-001] Blackout del Menú por Inexistencia de DNS en Supabase Cloud
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `js/menu-fetch.js`, `js/main.js`
- **Síntoma Inicial:** La página web cargaba el encabezado y el pie de página, pero todas las pestañas de platos aparecían completamente vacías sin contenido para el comensal.
- **Análisis de los 5 Porqués:**
  1. ¿Por qué no había platos en la pantalla? -> Porque `initMenu(menuData)` y `renderDestacados(destacadosData)` nunca se ejecutaron en `main.js`.
  2. ¿Por qué no se ejecutaron? -> Porque la función `loadMenuData()` arrojó una excepción no controlada (`Error cargando menu_items: undefined`).
  3. ¿Por qué arrojó una excepción? -> Porque el `fetch()` hacia `https://atjijqvwwdlydgsonptr.supabase.co` falló con error de resolución de host DNS.
  4. ¿Por qué falló el DNS? -> Porque el proyecto de Supabase fue pausado, eliminado o desconectado en la nube.
  5. ¿Por qué la aplicación web colapsó si el menú existía en el código? -> **Causa Raíz:** Falta de un mecanismo de desacoplamiento y contingencia (**Local-First Resilient Fallback**) que degradara al catálogo local `menu-data.js` cuando el backend remoto no estuviera disponible.
- **Solución Correcta Implementada:** Se modificó `menu-fetch.js` para capturar cualquier error de red o timeout hacia Supabase y retornar automáticamente los datos tipados de `menu-data.js` de forma transparente.
- **Invariante para el Asistente:** `loadMenuData()` nunca debe arrojar excepciones no controladas; el catálogo del comensal debe ser 100% resiliente a caídas externas.

---

### [ERR-002] Exposición de Contraseña Maestra en Texto Plano en Cliente
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `admin.html`
- **Síntoma Inicial:** Cualquier usuario podía acceder a las funciones del panel administrativo o inspeccionar el código fuente del navegador y leer la contraseña de administración.
- **Análisis de los 5 Porqués:**
  1. ¿Por qué cualquiera podía ver la contraseña? -> Porque estaba definida en una constante global de JavaScript en el navegador (`const ADMIN_PASSWORD = 'finestra2024'`).
  2. ¿Por qué estaba en JavaScript del cliente? -> Porque la validación del formulario de login se realizaba con una comparación directa en el DOM (`if (val === ADMIN_PASSWORD)`).
  3. ¿Por qué se hizo en el navegador? -> Para evitar configurar un flujo de autenticación completo en un servidor backend.
  4. ¿Por qué era peligroso? -> Porque además de la contraseña, el cliente contenía las claves anónimas de Supabase con permisos directos de inserción, actualización y borrado sin verificación previa de sesión en el servidor.
  5. ¿Por qué ocurrió esto? -> **Causa Raíz:** Antipatrón de seguridad ilusoria (*Security through Obscurity*) en un cliente estático sin capa de autorización real ni Row Level Security configurado.
- **Solución Correcta Implementada:** Se extrajo la lógica a un módulo desacoplado, se eliminó la contraseña fija en texto plano y se documentó la arquitectura de autenticación con Supabase Auth / variables protegidas.
- **Invariante para el Asistente:** Jamás escribir contraseñas en texto plano ni credenciales maestras en archivos que se descarguen en el navegador del usuario.

---

### [ERR-003] Parpadeo y Rotura Offline por Inyección de Micro-HTML
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `index.html`, `sections/*.html`
- **Síntoma Inicial:** Al abrir el proyecto localmente con doble clic (`file:///...`), la página mostraba mensajes de error rojos *"⚠️ No se pudo cargar sections/navbar.html"* y no cargaba el contenido; en producción producía parpadeo notable (Cumulative Layout Shift).
- **Análisis de los 5 Porqués:**
  1. ¿Por qué fallaba en local y parpadeaba en web? -> Porque el cuerpo de la página se armaba asíncronamente mediante 7 llamadas a `fetch()`.
  2. ¿Por qué fallaba en `file:///`? -> Porque las políticas de seguridad CORS del navegador bloquean peticiones `fetch()` a archivos locales relativos sin un servidor HTTP.
  3. ¿Por qué parpadeaba en la web? -> Porque el navegador tenía que esperar la respuesta de 7 peticiones HTTP en cascada antes de poder renderizar el menú.
  4. ¿Por qué se dividió en 7 archivos diminutos? -> En un intento de modularizar componentes HTML sin un proceso de compilación o empaquetado.
  5. ¿Por qué es un antipatrón en frontend vanilla? -> **Causa Raíz:** Forzar la modularidad en tiempo de ejecución del cliente en lugar de pre-renderizar la estructura base semántica en el HTML inicial.
- **Solución Correcta Implementada:** Consolidación de la estructura semántica en el documento principal, preservando la modularidad lógica en ES Modules para JavaScript y tokens para CSS.
- **Invariante para el Asistente:** Prohibido construir cascadas de `fetch()` para fragmentos estáticos de HTML menores a 20 KB en tiempo de carga inicial.


---

### [ERR-004] Brechas de Seguridad en RLS y Desincronización de Catálogo en Dossier SQL
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `docs/database/schema.sql`, `docs/database/lafinestra_database_audit_package.sql`, `docs/database/seed.sql`
- **Síntoma Inicial:** La auditoría de ciberseguridad del arquitecto identificó escalada de privilegios en el rol `authenticated` (SEC-01), inyección de estados en reservas (SEC-02), trigger con `SECURITY DEFINER` sin `search_path` (SEC-03), fuga de platos en categorías inactivas (SEC-04), omisión de columna `telefono` (DAT-02), y divergencia de platos 31 al 58 entre el dossier y `seed.sql` (DAT-01).
- **Análisis de los 5 Porqués:**
  1. ¿Por qué ocurrió la divergencia de platos? -> Porque al redactar el dossier consolidado se transcribieron datos genéricos para los platos 31-58 en lugar de reutilizar directamente el DML exacto de `seed.sql`.
  2. ¿Por qué las políticas administrativas otorgaban control a `authenticated`? -> Porque se asumió que cualquier usuario autenticado en Supabase era administrador, ignorando que el registro público (`signUp`) asigna dicho rol por defecto a atacantes.
  3. ¿Por qué la política de reservas permitía estados arbitrarios? -> Porque se definió con `WITH CHECK (TRUE)` sin validar restricciones de negocio (`estado = 'pendiente'` y `fecha >= CURRENT_DATE`).
  4. ¿Por qué los platos de categorías apagadas seguían expuestos? -> Porque la consulta RLS evaluaba solo `disponible = TRUE` sin verificar si la categoría padre tenía `activo = TRUE`.
  5. ¿Por qué se usó `SECURITY DEFINER` en el trigger? -> **Causa Raíz:** Aplicación ciega de privilegios elevados sin considerar que un trigger de actualización de memoria (`NEW.updated_at = NOW()`) debe correr como `SECURITY INVOKER` con `search_path` aislado.
- **Solución Correcta Implementada:** 
  1. Implementación de `public.is_admin()` basado en `app_metadata ->> 'role' = 'admin'`.
  2. Blindaje de RLS en `reservas` (`estado = 'pendiente' AND fecha >= CURRENT_DATE`) y adición de columna `telefono` con constraint `chk_reservas_longitudes`.
  3. Validación de categoría activa (`c.activo = TRUE`) en la política de `menu_items`.
  4. Conversión de `handle_updated_at()` a `SECURITY INVOKER` con `SET search_path = public`.
  5. Sincronización idéntica y 100% fiel de los 58 platos y 5 destacados en el dossier y `seed.sql`.
  6. Idempotencia absoluta con cláusulas `ON CONFLICT DO UPDATE`.
- **Invariante para el Asistente:** Prohibido usar `TO authenticated USING (TRUE)` para operaciones destructivas en Supabase; validar siempre claims inmutables de administrador.

---

### [ERR-005] Vulnerabilidades SAST en Frontend: Inyección DOM XSS, Subida Insegura y Carrera en Reservas Móviles
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `js/admin.js`, `js/reservas.js`, `js/mcard.js`
- **Síntoma Inicial:** La auditoría SAST del arquitecto identificó:
  1. FE-SEC-01: Concatenación directa en `innerHTML` e interpolación de comillas en handlers `onclick` de borrado, permitiendo DOM XSS o rotura de botones ante nombres con comillas dobles.
  2. FE-SEC-02: Riesgo de diccionario offline sobre `ADMIN_HASH` y falta de revocación de tokens en `logout()`.
  3. FE-SEC-03: Subida de imágenes sin lista blanca de MIME types ni límite de peso en `uploadImage()`.
  4. FE-BUG-01: Omisión en cliente de límites de `telefono (<= 30)` y `notas (<= 500)`, provocando fallos HTTP 400 silenciosos en Supabase.
  5. FE-BUG-02: Envío de reservas sin `keepalive: true` ni control anti-doble clic antes de disparar el deep-link a WhatsApp en móviles.
- **Análisis de los 5 Porqués:**
  1. ¿Por qué se rompía el botón de borrado ante nombres con comillas? -> Porque se pasaba el string del nombre directamente dentro del atributo `onclick="..."`.
  2. ¿Por qué se permitía subir cualquier archivo? -> Porque `uploadImage()` confiaba en `file.name.split('.').pop()` sin validar `file.type` contra una lista blanca ni verificar `file.size`.
  3. ¿Por qué la reserva fallaba silenciosamente en Supabase si la nota era larga? -> Porque el cliente solo validaba el nombre, confiando en que el usuario no escribiría más de 500 caracteres, y el `.catch()` ignoraba el HTTP 400.
  4. ¿Por qué se perdían peticiones POST en móviles al abrir WhatsApp? -> Porque el cambio de contexto a la app nativa congela los sockets TCP de la pestaña del navegador si la petición no incluye `keepalive: true`.
  5. ¿Por qué ocurrieron estos fallos? -> **Causa Raíz:** Asumir que la validación en base de datos era suficiente sin sincronizar las defensas en la capa de interacción del cliente (Principio de Defensa en Profundidad).
- **Solución Correcta Implementada:**
  1. Creación e inyección de `escHtml()` y `sanitizeStyle()` en todas las plantillas literales de `admin.js`, `mcard.js` y `cart.js`.
  2. Refactorización de `deleteItem()` y `deleteDest()` para recibir únicamente el `id` numérico y consultar el nombre en memoria.
  3. Implementación de `ALLOWED_MIME` (webp, jpg, png), `MAX_UPLOAD_BYTES` (4 MB) y sanitización de carpetas en `uploadImage()`.
  4. Sincronización estricta 1:1 en `reservas.js` de longitudes de teléfono ($\le 30$) y notas ($\le 500$).
  5. Inyección de `keepalive: true` en el `fetch` hacia Supabase y deshabilitación temporal del botón `#rf-submit` por 3 segundos.
  6. Revocación de sesión en servidor (`POST /auth/v1/logout`) en `logout()`.
- **Invariante para el Asistente:** Todo dato renderizado en `innerHTML` o dentro de atributos HTML debe escapar caracteres especiales con `escHtml()`; las peticiones que precedan redirecciones externas en móviles deben usar `keepalive: true`.

---

### [ERR-006] Bloqueo de Interacciones y Zoom en Desktop por Regla Invasiva de Reducción de Movimiento
- **Fecha:** 2026-10-28
- **Módulo / Archivo afectado:** `css/cards.css`, `css/destacados.css`, `js/main.js`
- **Síntoma Inicial:** Las tarjetas del menú y destacados se veían totalmente planas y estáticas en Desktop; las fotos no hacían zoom al pasar el cursor (`:hover`), mientras que en móvil algunas se encogían en vez de expandirse.
- **Análisis de los 5 Porqués:**
  1. ¿Por qué las cards no reaccionaban en Desktop? -> Porque la regla `@media (prefers-reduced-motion: reduce)` aplicaba `transform: none !important;`.
  2. ¿Por qué se activaba `prefers-reduced-motion` en la PC del usuario? -> Porque en Windows la configuración de rendimiento/accesibilidad tenía desactivadas las animaciones de ventanas del sistema operativo, propagando dicha preferencia a Chromium/Firefox.
  3. ¿Por qué se incluyó `transform: none !important;` en micro-interacciones hover? -> Porque se aplicó una regla de reducción de movimiento global sobre transformaciones táctiles y de hover que el usuario activaba voluntariamente con el ratón.
  4. ¿Por qué los estilos de animación inicial en JS (`animateCards`) afectaban el hover? -> Porque dejaban `card.style.transform = 'translateY(0)'` fijado como estilo en línea, anulando las clases CSS por especificidad.
  5. ¿Por qué en móvil las cards se encogían? -> **Causa Raíz:** El selector `:active` utilizaba `transform: scale(0.98)` (contracción en vez de elevación) y Safari móvil requería un listener pasivo de `touchstart` para disparar `:active`.
- **Solución Correcta Implementada:**
  1. Remoción de `transform: none !important;` en media queries de accesibilidad para permitir micro-interacciones hover voluntarias del usuario.
  2. Liberación automática de estilos inline (`style.removeProperty`) en `animateCards` al finalizar la transición escalonada.
  3. Escalado notable del $104\%$ (`scale(1.04)`) y elevación en hover para Desktop, combinado con doble zoom de imagen (`transform: scale(1.10)` y `background-size: 114%`).
  4. Adaptación táctil elástica en móvil (`transform: scale(1.03)`) con listener pasivo de `touchstart` en el documento.
- **Invariante para el Asistente:** Prohibido anular propiedades de transformación con `transform: none !important` en estados interactivos de hover/focus que el usuario acciona voluntariamente.


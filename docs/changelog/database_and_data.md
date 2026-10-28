# 🗄️ Bitácora de Base de Datos y Gestión de Datos — La Finestra

---

### [2026-10-28] Hito 2.0.0 — Reconstrucción de Artefactos SQL y Local-First Fallback
- **Diagnóstico de Supabase Cloud:** Constatación del fallo DNS en el endpoint remoto (`atjijqvwwdlydgsonptr.supabase.co`).
- **Rescate y Preservación de Datos:** Reconstrucción integral de los scripts DDL y DML a partir del catálogo histórico en `js/menu-data.js`.
- **Creación de `docs/database/schema.sql`:**
  - Tablas `menu_items`, `destacados` y `categorias`.
  - Definición de tipos, índices de ordenación y restricciones.
  - Activación obligatoria de **Row Level Security (RLS)** con políticas de lectura pública para `anon` y escritura restringida.
- **Creación de `docs/database/seed.sql`:**
  - Inserción de 50+ platos reales categorizados (Entradas, Pastas, Pizzas, Postres, etc.) y destacados con descripciones, precios en USD y textos de WhatsApp.
- **Implementación del Fallback:**
  - Modificación de `menu-fetch.js` para capturar errores de red y degradar de forma transparente a `menu-data.js`. Menú 100% operativo sin dependencias frágiles de red.


---

### [2026-10-28] Hito 2.0.1 — Sincronización Integral de Catálogo e Idempotencia
- **Remediación DAT-01:** Subsanación de discrepancia en platos #31 al 58 en `lafinestra_database_audit_package.sql`. Sincronización idéntica y 100% fiel con los 58 platos reales de `js/menu-data.js` (Pollo al Limone, Lomito a la Finestra, Giardino, Panzanella, Frappé, Agua Minalba, etc.).
- **Remediación DAT-02:** Adición formal de la columna `telefono TEXT` en la tabla `reservas` y en el formulario frontend de reservas.
- **Remediación DAT-03:** Implementación de cláusulas `ON CONFLICT DO UPDATE` en todas las inserciones DML y unificación de índices/claves foráneas (`ON DELETE RESTRICT`, `idx_reservas_fecha_hora`) garantizando idempotencia absoluta en re-ejecuciones.

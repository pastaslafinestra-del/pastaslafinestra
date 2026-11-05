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

---

### [2026-10-28] Hito 2.0.2 — Runner Automatizado de Migraciones (Aprobado con Correcciones Obligatorias)
- **Implementación de `scripts/db_migrate.js`:** Dispatcher CLI institucional con soporte dual: HTTPS Supabase Management API (cero dependencias nativo Node.js) y TCP Pooler (`pg`).
- **Bloqueo Transaccional no Bloqueante:** Adopción obligatoria de `pg_advisory_xact_lock(2026102801)` en lugar de locks de sesión, evitando bloqueos huérfanos en Supavisor :6543 (Transaction Mode) y llamadas stateless.
- **Transacción Atómica Única por Archivo:** Contenido SQL e `INSERT INTO public.schema_migrations_audit` unificados en el mismo payload transaccional, con sanitizador de `BEGIN`/`COMMIT` redundantes.
- **Normalización Estricta SHA-256:** Filtro `.replace(/\r\n/g, '\n').trim()` para erradicar falsos positivos por saltos de línea Windows/Linux (CRLF vs LF).
- **Simulación Transaccional en `--dry-run`:** Ejecución real contra motor PostgreSQL con `ROLLBACK` final (o visualización de plan offline).
- **Cero Secretos e Identificadores Hardcodeados:** Resolución dinámica de `SUPABASE_PROJECT_REF` y plantilla `.env.example`.
- **Estructuración de Migraciones:** Despliegue de `docs/database/migrations/001_initial_schema_v2.0.2.sql` y `002_initial_seed_v2.0.2.sql`.
- **Comandos npm Integrados:** `npm run db:migrate`, `npm run db:status`, `npm run db:seed`, `npm run db:dry-run`.
- **Quality Gate:** Ampliado a 7 verificaciones deterministas (100% aprobadas).

---

### [2026-11-05] Hito 2.0.5 — Migración 007 (Vínculos Exactos en Destacados) y Keep-Alive Automatizado
- **Migración 007 (`007_fix_destacados_fk_links.sql`):** Corrección determinista de las claves foráneas `menu_item_id` en `public.destacados` (`Tallarín Frutti Latte` en posición 2 y `Ripieno Ragú` en posición 3) y normalización de la ruta de imagen `pastas/Ripieno_Ragu.webp` acorde al objeto real en Supabase Storage (`menu-images`).
- **Keep-Alive Automatizado (`scripts/db_keepalive.js` y `.github/workflows/supabase-keepalive.yml`):** Script de pulso activo hacia PostgREST (`/rest/v1/menu_items`, `/rest/v1/destacados`) y workflow programado en GitHub Actions cada 72 horas (`0 12 */3 * *`) para evitar la pausa automática por inactividad de 7 días en Supabase Free Tier sin intervención manual.


# 📚 Índice Central de Documentación — La Finestra

> **Hub de Navegación Arquitectónica e Institucional**  
> Repositorio: `moisesrojasp89-Dev/lafinestra` · Versión: 2.0.0

---

## 🧭 Mapa de Documentación

### 🏛️ 1. Arquitectura y Diseño del Sistema
* [`docs/architecture/ARQUITECTURA_TECNICA.md`](architecture/ARQUITECTURA_TECNICA.md): Especificación técnica de componentes, flujo de datos desacoplado, ciclo de vida del carrito y resiliencia de red.

### 🛡️ 2. Estándares y Harness de Ingeniería
* [`AGENTS.md`](../AGENTS.md): Reglas inquebrantables, guardrails y directivas de desarrollo para asistentes de IA.
* [`GEMINI.md`](../GEMINI.md): Contexto operativo de alta densidad para agentes.
* [`SPEC.md`](../SPEC.md): Especificación funcional del MVP, viajes de usuario y modelo de datos.
* [`docs/standards_and_harness/ENGINEERING_STANDARDS.md`](standards_and_harness/ENGINEERING_STANDARDS.md): Convenciones de código, tokens CSS, accesibilidad y ergonomía móvil.
* [`docs/standards_and_harness/self_learning_error_catalog.md`](standards_and_harness/self_learning_error_catalog.md): Catálogo de auto-aprendizaje y bitácora 5-Whys de incidentes resueltos.
* [`docs/standards_and_harness/checklist_preflight.md`](standards_and_harness/checklist_preflight.md): Lista de comprobación obligatoria antes de desplegar o hacer commit.

### 🗄️ 3. Base de Datos y Persistencia
* [`docs/database/schema.sql`](database/schema.sql): Definición DDL de tablas, tipos, índices y políticas Row Level Security (RLS) para PostgreSQL / Supabase.
* [`docs/database/seed.sql`](database/seed.sql): Script DML con todos los platos, categorías, precios y destacados para restaurar la base de datos en 1 clic.

### 📜 4. Bitácoras y Registro de Cambios (Changelog Modular)
* [`docs/changelog/README.md`](changelog/README.md): Matriz de hitos y versiones del proyecto.
* [`docs/changelog/frontend_ui.md`](changelog/frontend_ui.md): Evolución de interfaz, responsive, cards, drawer y animaciones.
* [`docs/changelog/database_and_data.md`](changelog/database_and_data.md): Migraciones, esquemas y lógica de sincronización.
* [`docs/changelog/security.md`](changelog/security.md): Auditorías de seguridad, protección de secretos y RLS.

# 📜 Matriz de Changelog y Bitácoras Modulares — La Finestra

> **Registro Histórico de Evolución Arquitectónica por Dominios**  
> Prohibido el uso de archivos monolíticos gigantes; cada hito se registra en su dominio correspondiente.

---

## 🗂️ Registro por Dominios

| Dominio | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **Frontend & UI/UX** | [`frontend_ui.md`](frontend_ui.md) | Componentes visuales, layout, animaciones, drawer de carrito y ergonomía móvil. |
| **Base de Datos & Datos** | [`database_and_data.md`](database_and_data.md) | Modelos SQL, catálogo local, políticas RLS y sincronización Supabase. |
| **Seguridad & Gobernanza**| [`security.md`](security.md) | Zero-Trust, auditorías, eliminación de secretos y compuerta de calidad (*Quality Gate*). |

---

## 🚀 Versiones Principales

- **v2.0.0 (2026-10-28):** Reingeniería institucional integral. Implementación del arnés de gobernanza (`AGENTS.md`, `GEMINI.md`, `SPEC.md`), reconstrucción DDL/DML de base de datos (`schema.sql`, `seed.sql`), patrón Local-First Resilient Fallback y compuerta de calidad automatizada.
- **v1.0.0 (Legacy):** Prototipo inicial de menú estático con integración básica de WhatsApp y script de conexión a Supabase.

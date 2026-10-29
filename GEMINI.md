# 🤖 GEMINI.md — Contexto Rápido de Operación (La Finestra)

> Este archivo proporciona contexto de alta densidad para asistentes de IA (Gemini, Claude, Antigravity) para operar con precisión quirúrgica en el repositorio **La Finestra**.

---

## 🧭 1. Resumen del Proyecto

- **Nombre:** La Finestra (Ristorante e Pastificio Italiano)
- **Ubicación:** San Cristóbal, Táchira, Venezuela (V-19236204-7)
- **Tipo:** Web Application de Menú Digital Interactivo y Pedidos Gastronómicos por WhatsApp
- **Stack Técnico:**
  - **Frontend:** Vanilla JavaScript (ES Modules), HTML5 semántico, CSS3 moderno con variables y tokens.
  - **Persistencia / Backend:** Supabase PostgreSQL (con arquitectura Local-First Fallback a `menu-data.js`).
  - **Despliegue:** Vercel (`vercel.json`) / Static Web Hosting.
  - **Canal de Venta:** WhatsApp API (`wa.me/584247842743`) con formateo automático de pedidos y reservas.

---

## 🛑 2. Reglas Críticas Innegociables

1. **Local-First Fallback:** `loadMenuData()` debe retornar datos válidos siempre. Si Supabase no responde o falla el DNS, debe conmutar a `menu-data.js` sin arrojar errores visibles al usuario.
2. **Cero Secretos:** Prohibido escribir contraseñas en texto plano en archivos cliente (`admin.html`, `.js`, `.css`).
3. **No Waterfalls:** No usar `fetch()` en cliente para fragmentos HTML si pueden ser estáticos o pre-renderizados.
4. **Respeto a los Precios:** Los precios en USD y formato de moneda (`$X,XX`) deben mantenerse exactos y sincronizados entre catálogo y base de datos.
5. **Quality Gate:** Ejecutar siempre `node scripts/quality_gate.js` antes de finalizar.

---

## 🗂️ 3. Mapa de Directorios Clave

```text
lafinestra/
├── AGENTS.md                   # Harness institucional y guardrails para agentes
├── GEMINI.md                   # Este archivo (contexto rápido)
├── SPEC.md                     # Especificación formal del producto (MVP y Anti-scope)
├── README.md                   # Documentación principal del proyecto
├── index.html                  # Landing page y menú digital principal
├── reservas.html               # Módulo de reservas de mesa
├── admin.html                  # Panel administrativo (modularizado)
├── vercel.json                 # Configuración de rutas y rewrites de despliegue
├── assets/                     # Recursos gráficos e imágenes optimizadas
├── css/                        # Hojas de estilo modulares
├── js/                         # Lógica desacoplada en ES Modules
│   ├── config.js               # Parámetros públicos de configuración
│   ├── cart.js                 # Drawer y estado del carrito de compras
│   ├── mcard.js                # Renderizado de cards de menú y destacados
│   ├── menu-data.js            # Catálogo tipado local (fuente de verdad resiliente)
│   ├── menu-fetch.js           # Capa de datos con Local-First Fallback
│   └── main.js                 # Punto de entrada orquestador
├── docs/                       # Arquitectura, estándares y esquemas
│   ├── INDEX.md                # Índice de navegación documental
│   ├── architecture/           # Blueprints arquitectónicos y flujos
│   ├── database/               # schema.sql, seed.sql y políticas RLS
│   ├── standards_and_harness/  # Calidad, checklist y catálogo de errores 5-Whys
│   └── changelog/              # Bitácoras modulares por dominio
└── scripts/                    # Herramientas y compuerta de calidad
    └── quality_gate.js         # Script determinista de validación
```

---

## ⚡ 4. Comando de Verificación

```bash
node scripts/quality_gate.js
```
El resultado debe ser `100% de verificaciones aprobadas` (código `0`).

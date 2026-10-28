# 🍝 La Finestra — Reglas y Guardrails para Agentes de IA (Harness Institucional)

> **Mandato Institucional Obligatorio para Antigravity, Claude, Cursor y Asistentes IA**  
> **Versión:** 1.0.0 (Certificación Institucional & Estándares Harness 2026)  
> **Ámbito:** Aplica automáticamente a todas las sesiones de desarrollo, depuración, refactorización y despliegue en este repositorio.

---

## 🎯 1. Misión y Filosofía de Construcción

1. **Plataforma Gastronómica de Experiencia y Pedidos Rápidos:**
   - La Finestra es un restaurante de pastas artesanales, pizzas y salsas frescas en San Cristóbal, Venezuela.
   - El canal principal de conversión es el menú digital interactivo y el despacho directo por WhatsApp.
   - **Cero tiempo de inactividad visible para el comensal:** La experiencia de usuario debe cargar de forma instantánea sin bloqueos de red ni pantallas vacías.

2. **Principio Operativo Dominante:**
   - **Los humanos dirigen. Los agentes ejecutan.**
   - Ante fallos repetidos o caídas de infraestructura externa (como Supabase), la respuesta jamás es *"intentar más fuerte"* o fallar en silencio, sino codificar defensas deterministas y comprobables en el código.

3. **Harness Dentro del Harness (Auto-Aprendizaje):**
   - Prohibido parches ciegos, atajos temporales o dependencias externas innecesarias.
   - Ante cualquier fallo de infraestructura o regresión, consultar obligatoriamente [`docs/standards_and_harness/self_learning_error_catalog.md`](docs/standards_and_harness/self_learning_error_catalog.md) y documentar la causa raíz con análisis 5-Whys.

---

## 🛑 2. Mandamientos Inquebrantables del Código

### A. Local-First Resilient Fallback (Cero Menús en Blanco)
- El catálogo de productos debe visualizarse siempre, sin importar el estado del backend o la conexión de red.
- Si la llamada a Supabase o cualquier API remota falla por DNS, timeout o error HTTP, el sistema debe degradar automáticamente y sin interrupción al catálogo local tipado ([`js/menu-data.js`](js/menu-data.js)).
- Queda terminantemente prohibido dejar que una excepción de red interrumpa la inicialización de cards del menú.

### B. Seguridad Zero-Trust y Cero Secretos en Cliente
- Jamás almacenar contraseñas maestras, credenciales de Supabase `service_role` o contraseñas de administración en texto plano dentro del código rastreado por Git (`admin.html`, JavaScript o CSS).
- El acceso administrativo debe requerir autenticación real o mantenerse fuera del cliente estático público.

### C. Eliminación de Cascadas de Red (*Anti-Waterfall*)
- Prohibido fragmentar el HTML esencial en múltiples peticiones `fetch()` en tiempo de ejecución (`fetch('sections/...')`) si pueden servirse de forma estática o pre-renderizada.
- Cero Cumulative Layout Shift (CLS) en la carga de la página.

### D. Pureza de Dependencias y Anti-Bloat
- Prohibido incluir scripts de terceros obsoletos o no utilizados (ej. `w3.js`).
- Solo dependencias y librerías justificadas que aporten valor medible a la experiencia del usuario.

### E. Presentación Desacoplada y Ergonomía Mobile-First
- Todo estilo debe residir en hojas de estilo estructuradas por tokens semánticos (paleta de autor, tipografía Playfair / Cormorant / Jost).
- Respetar los lineamientos de diseño gastronómico: cards legibles en móvil ($\le 380\text{px}$), microinteracciones táctiles suaves, feedback inmediato al agregar al carrito y botón flotante de WhatsApp siempre accesible.

### F. Preservación del Modelo de Datos
- Toda modificación de campos o precios debe reflejarse sincronizadamente en el esquema SQL ([`docs/database/schema.sql`](docs/database/schema.sql)), en los datos semilla ([`docs/database/seed.sql`](docs/database/seed.sql)) y en el catálogo local ([`js/menu-data.js`](js/menu-data.js)).

---

## ⚡ 3. Quality Gate Obligatorio

Antes de dar por concluida cualquier tarea, refactorización o commit:

```bash
node scripts/quality_gate.js
```

Si el script reporta `[❌ FAIL]`, **la tarea NO está completa**. Se debe corregir la causa raíz hasta obtener `100% Verificaciones Aprobadas`.

---

## 📚 4. Protocolo Documental

1. **Estructura Modular:** Toda documentación técnica debe residir en `docs/` organizada por dominios (`architecture/`, `standards_and_harness/`, `database/`, `changelog/`).
2. **Actualización Continua:** Cada hito técnico debe registrarse en la bitácora correspondiente en `docs/changelog/`.
3. **Registro de Errores:** Cada regresión corregida debe documentarse en [`docs/standards_and_harness/self_learning_error_catalog.md`](docs/standards_and_harness/self_learning_error_catalog.md).

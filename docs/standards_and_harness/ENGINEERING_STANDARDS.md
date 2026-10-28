# 📐 Estándares de Ingeniería y Convenciones — La Finestra

> **Guía de Calidad Técnica y Buenas Prácticas**  
> Basada en los estándares de *AEON*, *TrasladosYa* y el *Manual para Desarrollo Asistido con IA*.

---

## 1. Convenciones de HTML y Semántica

1. **Estructura Semántica Obligatoria:** Usar `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>` y `<footer>`. Prohibido el abuso de `<div>` sin rol o significado estructural.
2. **Atributos de Accesibilidad (a11y):**
   - Todo botón interactivo sin texto visible debe incluir `aria-label` descriptivo (ej. `aria-label="Agregar Burrata Pesto al carrito"`).
   - Los modales y drawers deben incluir `role="dialog"` y enlaces de cierre accesibles por teclado (`Escape`).
3. **Cero Dependencias Zombie:** Prohibido insertar etiquetas `<script>` hacia CDNs de librerías no utilizadas (ej. scripts de terceros obsoletos).

---

## 2. Convenciones de CSS y Tokens de Diseño

1. **Tokens Centralizados:**
   - Todo valor de color, fuente, espaciado y transición debe derivarse de variables CSS definidas en [`css/variables.css`](../../css/variables.css).
   - Paleta de autor de La Finestra:
     - Fondo primario / secundario: `#FFFFFF`, `#FBF9F5` (crema cálido italiano)
     - Acento dorado / bronce: `#C5A059`, `#A6823B`
     - Oscuros de contraste: `#1C1917`, `#292524`
     - Verde albahaca / éxito: `#27AE60`
     - Terracota / alerta: `#C0392B`
2. **Cero Estilos Inline:**
   - Prohibido escribir `style="..."` en el HTML o templates de JavaScript para maquetación o estados visuales.
   - Usar clases de estado (`.on`, `.active`, `.open`) o CSS Custom Properties dinámicas (`element.style.setProperty('--ratio', value)`).
3. **Ergonomía Mobile-First:**
   - Objetivos táctiles mínimos de $44 \times 44\text{px}$ para botones de agregar al carrito y navegación.
   - Pestañas de menú deslizables horizontalmente con `scroll-snap-type: x mandatory` y `overflow-x: auto`.

---

## 3. Convenciones de JavaScript (ES Modules)

1. **Modularidad Estricta:**
   - Cada archivo en `js/` debe tener una responsabilidad única y bien delimitada:
     - `config.js`: Constantes públicas y endpoints.
     - `menu-data.js`: Estructura local tipada del menú.
     - `menu-fetch.js`: Capa de transporte y fallback de datos.
     - `mcard.js`: Renderizado de tarjetas y templates HTML seguros.
     - `cart.js`: Gestión del estado del pedido y drawer interactivo.
     - `main.js`: Orquestación inicial del ciclo de vida.
2. **Manejo Defensivo de Excepciones:**
   - Prohibido bloques `catch` vacíos o silenciosos.
   - Todo error de red debe registrarse con contexto explicativo y degradar a un estado seguro sin colapsar la interfaz.
3. **Prevención de Inyecciones XSS:**
   - Al renderizar cadenas dinámicas que no provengan de código confiable, sanitizar o escapar caracteres HTML (`&`, `<`, `>`, `"`, `'`).

---

## 4. Convenciones de Base de Datos y Supabase

1. **Nomenclatura Snake_Case:** Todas las tablas y columnas deben escribirse en minúsculas con guiones bajos (`menu_items`, `wa_text`, `img_style`).
2. **Row Level Security (RLS) Mandatorio:**
   - Toda tabla creada en Supabase debe tener RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
   - Políticas explícitas:
     - `SELECT`: Permitido para el rol `anon` en registros con `disponible = true`.
     - `INSERT / UPDATE / DELETE`: Exclusivo para usuarios autenticados con rol de administración.

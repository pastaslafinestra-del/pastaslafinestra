# 🍽️ Menú Digital Premium — Restaurant Menu Web App

Aplicación web de menú digital premium para restaurantes, con panel de administración privado y base de datos en tiempo real. Desarrollada con HTML, CSS y JavaScript vanilla, sin frameworks.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Base de datos | [Supabase](https://supabase.com) (PostgreSQL + REST API) |
| Almacenamiento | Supabase Storage (imágenes del menú) |
| Deploy | Railway / Vercel |
| Integración | WhatsApp API (pedidos directos) |

---

## ✨ Características

### Menú Público
- **Carga dinámica desde Supabase** — los datos del menú se obtienen en tiempo real desde la base de datos, sin necesidad de editar código
- **Sección de destacados** — carousel horizontal con productos destacados y badges personalizados
- **Navegación por categorías** — sistema de tabs con scroll horizontal adaptado a móvil y desktop
- **Tabs sticky** — la barra de categorías se fija al hacer scroll para facilitar la navegación
- **Pedidos por WhatsApp** — cada plato genera un mensaje preformateado directo al número del restaurante
- **Carrito de pedidos** — gestión de pedidos con `cart.js` antes de enviar por WhatsApp

### Animaciones & UX
- **Scroll reveal** — elementos con animaciones `fade`, `fade-left`, `fade-right` usando `IntersectionObserver`
- **Stagger de cards** — las tarjetas de cada categoría aparecen en cascada al activar la tab
- **Adaptación móvil/desktop** — lógica diferenciada: en móvil se usan observers por contenedor scroll; en desktop por grid
- **Respeto a `prefers-reduced-motion`** — todas las animaciones se desactivan automáticamente si el usuario lo tiene configurado
- **Nav highlight** — el enlace de navegación activo se resalta según la sección visible en pantalla
- **Destacados dots** — indicadores de posición en el carousel de destacados

### Panel de Administración
- Acceso mediante `admin.html` (ruta privada)
- Gestión de items del menú y destacados directamente en Supabase

---

## 📁 Estructura del Proyecto

```
├── index.html          # Menú principal
├── admin.html          # Panel de administración
├── reservas.html       # Página de reservas
├── js/
│   ├── config.js       # URLs y credenciales de Supabase + número WhatsApp
│   ├── main.js         # Punto de entrada — orquesta todo el frontend
│   ├── menu-fetch.js   # Carga datos desde Supabase REST API
│   ├── menu-data.js    # (legacy) Datos estáticos del menú
│   ├── mcard.js        # Renderizado de tarjetas de menú y destacados
│   ├── cart.js         # Lógica del carrito de pedidos
│   └── tabsinit.js     # Inicialización del sistema de tabs
├── css/                # Estilos
├── assets/             # Recursos estáticos
└── sections/           # Secciones HTML parciales
```

---

## 🗄️ Modelo de Datos (Supabase)

### Tabla `menu_items`
| Campo | Tipo | Descripción |
|---|---|---|
| `name` | text | Nombre del plato |
| `descripcion` | text | Descripción |
| `price` | text | Precio |
| `categoria` | text | Categoría (agrupa en tabs) |
| `cat` | text | Subcategoría |
| `img` | text | Nombre del archivo en Supabase Storage |
| `img_style` | text | CSS de posicionamiento de imagen |
| `wa_text` | text | Texto preformateado para WhatsApp |
| `disponible` | boolean | Controla visibilidad en el menú |
| `orden` | integer | Orden de aparición |

### Tabla `destacados`
| Campo | Tipo | Descripción |
|---|---|---|
| `name` | text | Nombre del producto |
| `descripcion` | text | Descripción |
| `price` | text | Precio |
| `badge` | text | Etiqueta del badge (ej. "Nuevo", "Popular") |
| `img` | text | Imagen en Supabase Storage |
| `wa_text` | text | Texto para WhatsApp |
| `disponible` | boolean | Visibilidad |
| `orden` | integer | Orden en el carousel |

---

## ⚙️ Instalación Local

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# 2. Configura las credenciales en js/config.js
export const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';
export const SUPABASE_ANON = 'TU_ANON_KEY';
export const WA_NUMBER     = 'TU_NUMERO_WHATSAPP';  # formato: 521XXXXXXXXXX
export const ASSETS_BASE_URL = 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/menu-images/';

# 3. Sirve con cualquier servidor estático (requiere ES Modules)
npx serve .
# o
python -m http.server 8080
```

> ⚠️ **Nota de seguridad:** El proyecto actualmente usa las credenciales de Supabase directamente en `config.js`. Para producción, se recomienda migrar a variables de entorno e implementar un proxy o edge functions. Asegúrate de configurar **Row Level Security (RLS)** en todas las tablas de Supabase.

---

## 🔌 Integración Supabase

La conexión se realiza directamente contra la REST API de Supabase sin SDK, usando `fetch` nativo:

```javascript
// menu-fetch.js — consulta con filtros y ordenación
fetchTable('menu_items', 'disponible=eq.true&order=orden.asc')
```

Las dos tablas se cargan en paralelo con `Promise.all` para minimizar el tiempo de carga inicial.

---

## 📱 WhatsApp Integration

Cada tarjeta de menú usa el campo `wa_text` de la base de datos para generar un enlace directo:

```
https://wa.me/{WA_NUMBER}?text={wa_text_encoded}
```

El número se configura en `config.js` con formato internacional sin `+` ni espacios.

---

## 🚀 Deploy

El proyecto es estático y se puede desplegar en cualquier plataforma:

- **Railway** — conectar repositorio y hacer deploy directo
- **Vercel** — compatible con la configuración de `vercel.json` incluida
- **Netlify** — drag & drop de la carpeta del proyecto

---

## 📄 Licencia

Proyecto de uso privado / portafolio. Disponible como plantilla base para futuros proyectos de menús digitales para restaurantes.

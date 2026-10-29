# 📋 ESPECIFICACIÓN DEL PROYECTO (SPEC.md) — La Finestra

> **Basado en el estándar del Manual para Desarrollo Asistido con IA**  
> *"Si tú no tienes claro el mapa en la servilleta, la IA inventará un laberinto"*.

---

## 🎯 1. El Problema y la Solución (MVP)

* **¿Qué problema real resuelve?**  
  Permite a comensales y amantes de la gastronomía italiana en San Cristóbal explorar la carta artesanal de La Finestra, armar pedidos personalizados con cálculo exacto de subtotales y generar reservas de mesa de forma fluida directamente por WhatsApp, sin necesidad de descargar aplicaciones pesadas ni registrarse en portales lentos.

* **La Solución MVP (Producto Mínimo Viable):**  
  1. Menú digital interactivo de alta velocidad, categorizado (Entradas, Pastas artesanales, Pizzas, Proteínas, Ensaladas, Menú Infantil, Postres, Bebidas y Adicionales).
  2. Sección de platos destacados recomendados por el chef.
  3. Drawer de carrito de compras en tiempo real que suma cantidades, subtotales en USD y genera el mensaje formateado para WhatsApp.
  4. Módulo de reservas de mesa con selección de fecha, turnos de almuerzo/cena, número de comensales y envío por WhatsApp.
  5. Arquitectura **Local-First Resilient Fallback**: Disponibilidad del 100% incluso ante fallos de red o caídas de backend.

* **🚫 ANTI-SCOPE (Estrictamente Prohibido en esta versión):**  
  - [ ] No habrá procesamiento de pagos con pasarelas automáticas (todo pago se acuerda y liquida vía WhatsApp / tasa oficial BCV o divisas en local).
  - [ ] No habrá sistema de login o cuentas de usuario para comensales (acceso público y directo).
  - [ ] No habrá chat en vivo complejo con websockets dentro de la web (toda comunicación se delega a WhatsApp).
  - [ ] No habrá aplicación móvil nativa (código 100% web responsive optimizado para navegadores móviles).

---

## 🚶‍♂️ 2. El Viaje del Usuario (Los Flujos Principales)

### Flujo A: Pedido de Menú
```text
Paso 1: El comensal ingresa a la web (carga instantánea < 1.0s).
Paso 2: Explora las categorías en los tabs superiores o la sección de destacados.
Paso 3: Hace clic en "+" en los platos deseados.
        ├── Se actualiza el badge flotante del carrito con animación.
        └── El plato se agrega al estado local en memoria.
Paso 4: El comensal abre el drawer "Tu pedido" y revisa items y subtotal.
Paso 5: Presiona "Enviar pedido por WhatsApp".
        └── Se abre WhatsApp con el pedido desglosado y el subtotal calculado en USD.
```

### Flujo B: Reserva de Mesa
```text
Paso 1: El comensal hace clic en "Reservar Mesa" en la barra de navegación o banner.
Paso 2: Ingresa su nombre completo y selecciona la fecha.
Paso 3: Selecciona turno/hora (chips interactivos) y número de comensales.
Paso 4: Agrega notas opcionales (alergias, cumpleaños, etc.).
Paso 5: Presiona "Enviar reserva por WhatsApp".
        └── Se abre WhatsApp con los datos listos para confirmación por el anfitrión.
```

---

## 🗄️ 3. El Mapa de Datos Esencial (Las Tablas Mínimas)

### Tabla 1: `menu_items` (Platos y Productos)
- `id` (Entero autoincremental / UUID)
- `categoria` (Texto: 'entradas', 'pastas', 'pizzas', 'proteinas', 'ensaladas', 'infantil', 'postres', 'bebidas', 'adicionales')
- `cat` (Texto opcional: subcategoría visible)
- `name` (Texto obligatorio: nombre del plato)
- `descripcion` (Texto: ingredientes y preparación)
- `price` (Texto / Decimal: ej. '$8,04')
- `img` (Texto opcional: ruta relativa o URL pública de imagen)
- `img_style` (Texto opcional: estilos de encuadre CSS)
- `wa_text` (Texto: texto para el mensaje de WhatsApp)
- `orden` (Entero: posición en la lista)
- `disponible` (Booleano: `true` si está activo, `false` si está agotado)
- `creado_en` (Timestamp con zona horaria)

### Tabla 2: `destacados` (Platos Estrella)
- `id` (Entero autoincremental / UUID)
- `badge` (Texto: '⭐ Chef recomienda', '🔥 Más Vendido', '🍽️ Favorito', '✨ Especial')
- `name` (Texto obligatorio)
- `descripcion` (Texto)
- `price` (Texto / Decimal)
- `img` (Texto: ruta de la imagen)
- `wa_text` (Texto)
- `orden` (Entero)
- `disponible` (Booleano)
- `creado_en` (Timestamp con zona horaria)

---

## 🏗️ 4. Arquitectura en Servilleta

* **Frontend:**
  - Vanilla JavaScript con ES Modules nativos (`js/main.js`, `js/cart.js`, `js/mcard.js`, `js/menu-fetch.js`, `js/config.js`).
  - Hojas de estilo estructuradas con CSS Tokens (`variables.css`, `base.css`, `cards.css`, `cart.css`, `responsive.css`).
  - Cero dependencias de frameworks pesados (React, Angular) ni librerías obsoletas (como `w3.js`).
* **Capa de Persistencia y Resiliencia:**
  - **Primaria:** Supabase PostgreSQL vía REST API pública (`/rest/v1/menu_items`).
  - **Secundaria (Fallback):** Objeto tipado en memoria (`js/menu-data.js`).
* **Canal de Despacho:**
  - WhatsApp Click-to-Chat URI (`https://wa.me/584247842743?text=...`).

---

## 📋 5. Mandatos Inquebrantables para el Asistente de IA

1. Respeta estrictamente los campos y tipos definidos en la Sección 3.
2. Todo cambio en el catálogo debe mantener la paridad entre `menu-data.js` y las tablas SQL.
3. Si la base de datos remota está inaccesible, el sistema jamás debe bloquear el renderizado del menú.
4. Mantener la estética italiana artesanal, tipografía limpia y ergonomía táctil en móviles.

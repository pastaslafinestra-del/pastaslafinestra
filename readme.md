# 🍽️ La Finestra — Guía de Mantenimiento del Menú Digital

Este documento explica cómo está montado tu menú digital y cómo hacer cambios sin romper nada. Léelo antes de tocar cualquier cosa.

---

## 🌐 ¿Dónde está publicado?

El menú está publicado en **Netlify** y conectado a tu repositorio de GitHub. Cada vez que se actualiza el código en GitHub, Netlify lo publica automáticamente.

| Servicio | Para qué sirve |
|---|---|
| **Netlify** | Publica el menú en internet |
| **GitHub** | Guarda el código del proyecto |
| **Supabase** | Base de datos — aquí viven los platos, precios e imágenes |

---

## 📋 Cómo actualizar el menú

**Todo el contenido del menú (platos, precios, imágenes, destacados) se administra desde Supabase.** No hay que tocar el código para hacer cambios de contenido.

### Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com) desde cualquier navegador
2. Inicia sesión con la cuenta del restaurante
3. Selecciona el proyecto **LaFinestraMenu**
4. Ve a **Table Editor**

### Modificar un plato
1. Abre la tabla **`menu_items`**
2. Busca el plato que quieres editar
3. Haz clic sobre la celda que quieres cambiar y edita directamente
4. Los cambios se guardan automáticamente

### Ocultar un plato sin borrarlo
En la columna **`disponible`** cambia el valor a `false` — el plato desaparece del menú sin perder la información.

### Cambiar el orden de los platos
Modifica el número en la columna **`orden`** — los números más bajos aparecen primero.

---

## 🖼️ Cómo agregar imágenes

Las imágenes se guardan en **Supabase Storage**, no en el código.

1. En Supabase ve a **Storage → menu-images**
2. Sube la imagen (recomendado: formato `.webp` o `.jpg`, máximo 500KB)
3. Copia el nombre exacto del archivo (ej. `pasta-carbonara.jpg`)
4. En la tabla `menu_items`, pega ese nombre en la columna **`img`** del plato correspondiente

> ⚠️ El nombre del archivo en Storage debe coincidir exactamente con lo que escribes en la columna `img`.

---

## ⭐ Cómo gestionar los Destacados

Los destacados son los productos que aparecen en el carousel principal al inicio del menú.

1. Abre la tabla **`destacados`** en Supabase
2. Máximo recomendado: **5 destacados** para que el carousel se vea bien
3. El campo **`badge`** es la etiqueta que aparece sobre la imagen (ej. "Nuevo", "Popular", "Especial")
4. Igual que en `menu_items`, usa `disponible = false` para ocultar sin borrar

---

## 📱 Número de WhatsApp

El número al que llegan los pedidos se configura en el archivo `js/config.js` del proyecto.

Formato requerido: número internacional sin `+` ni espacios.
Ejemplo: `584247827899` (para el número venezolano +58 424 782 7899)

Para cambiarlo hay que editar ese archivo en el código — contacta al desarrollador.

---

## 🔐 Seguridad — Lo que NO debes hacer

- **No compartas** las credenciales de Supabase con nadie
- **No borres** las tablas `menu_items` ni `destacados` desde Supabase
- **No desactives** el RLS (Row Level Security) — está activado para proteger la base de datos
- **No cambies** el nombre del bucket `menu-images` en Storage

---

## 🆘 Problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| El menú no carga | Supabase caído o credenciales incorrectas | Verificar en supabase.com que el proyecto esté activo |
| Una imagen no aparece | Nombre del archivo incorrecto en la tabla | Verificar que el nombre en `img` coincide exactamente con el archivo en Storage |
| Un plato no se ve | Campo `disponible` en `false` | Cambiar a `true` en Table Editor |
| El menú muestra datos viejos | Caché del navegador | Abrir en modo incógnito o limpiar caché |

---

## 📞 Contacto del desarrollador

Para cambios en el código, diseño, o nuevas funcionalidades contactar al desarrollador que montó este proyecto.

---

## 🔑 Accesos importantes

Guarda estos accesos en un lugar seguro:

- **Supabase:** [supabase.com](https://supabase.com) — cuenta del restaurante
- **GitHub:** [github.com](https://github.com) — cuenta `pastaslafinestra-del`
- **Netlify:** [netlify.com](https://netlify.com) — cuenta vinculada al proyecto
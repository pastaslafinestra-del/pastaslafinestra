# 🏛️ Arquitectura Técnica y Desacoplamiento — La Finestra

> **Documento de Especificación Arquitectónica (Target State)**  
> **Versión:** 2.0.0 · **Enfoque:** Vanilla Modular, Local-First Resiliente, Mobile-First

---

## 1. Visión General del Sistema

La Finestra opera como una aplicación web de alto rendimiento optimizada para conversión gastronómica. No utiliza frameworks reactivos pesados (React, Vue) para garantizar tiempos de carga inferiores a 800ms en redes móviles venezolanas (3G/4G).

```mermaid
flowchart TD
    subgraph Client ["Navegador del Comensal (Mobile/Desktop)"]
        HTML["index.html (Estructura Semántica Pre-renderizada)"]
        CSS["CSS Tokens & Components (Cero Inline Styles)"]
        Main["main.js (Orquestador ES Modules)"]
        CartMod["cart.js (Estado y Drawer Carrito)"]
        MCardMod["mcard.js (Generador de Cards)"]
        FetchMod["menu-fetch.js (Capa de Acceso a Datos)"]
    end

    subgraph DataLayer ["Capa de Datos Híbrida"]
        LocalData["menu-data.js (Catálogo Local Tipado)"]
        Supabase["Supabase REST API (PostgreSQL + RLS)"]
    end

    subgraph Conversion ["Canal de Conversión y Despacho"]
        WhatsAppAPI["WhatsApp API (wa.me)"]
    end

    HTML --> Main
    Main --> CartMod
    Main --> MCardMod
    Main --> FetchMod

    FetchMod -->|"1. Intento Remoto (Timeout 1.5s)"| Supabase
    FetchMod -->|"2. Fallback Transparente si Falla"| LocalData

    MCardMod -->|"Renderiza Cards en DOM"| HTML
    CartMod -->|"Actualiza Badge & Drawer"| HTML
    CartMod -->|"Envío de Pedido Formateado"| WhatsAppAPI
```

---

## 2. Patrón Local-First Resilient Fallback

Para evitar el fallo catastrófico observado en el diagnóstico (donde la caída de Supabase vació el menú por completo), se diseñó el patrón **Local-First Resilient Fallback**:

```mermaid
sequenceDiagram
    autonumber
    actor User as Comensal
    participant App as main.js
    participant Layer as menu-fetch.js
    participant SB as Supabase Cloud
    participant Local as menu-data.js

    User->>App: Carga index.html
    App->>Layer: loadMenuData()
    Layer->>SB: fetchTable('menu_items') con Timeout
    alt Conexión Exitosa
        SB-->>Layer: 200 OK (Datos actualizados)
        Layer-->>App: { menuData, destacadosData } (Remoto)
    else Falla de Red / DNS / Timeout / 500
        Layer->>Local: Importar datos locales tipados
        Note over Layer,Local: Respaldo inmediato sin errores visuales
        Local-->>Layer: { menuData, destacadosData } (Local)
        Layer-->>App: { menuData, destacadosData } (Fallback Activo)
    end
    App->>App: renderDestacados() & initMenu()
    App->>User: Menú 100% visible y funcional
```

### Invariantes del Fallback:
1. `loadMenuData()` **nunca lanza una excepción no controlada** que interrumpa la ejecución de `main.js`.
2. Si Supabase responde, la capa devuelve los datos más frescos del servidor.
3. Si Supabase falla por cualquier causa (DNS, corte de energía, límite de cuota o latencia > 1500ms), se sirve el catálogo local de inmediato con una advertencia en la consola de depuración.

---

## 3. Estado y Ciclo de Vida del Carrito (`cart.js`)

El módulo `cart.js` implementa un patrón Singleton encapsulado con las siguientes responsabilidades:

1. **Estado en Memoria:** Arreglo `items` con `{ id, name, price, qty }`.
2. **Cálculos Aritméticos Seguros:**
   - Subtotal calculado en punto flotante y formateado a dos decimales con coma decimal (`$X,XX`).
   - Sincronización automática de unidades totales en el badge flotante.
3. **Persistencia Ligera:** Sincronización opcional con `sessionStorage` para no perder el pedido al recargar la página.
4. **Generador de Mensajes WhatsApp:** Formatea una lista con viñetas, total en USD, nota de tasa BCV y saludo inicial listo para enviar.

---

## 4. Desacoplamiento de la Interfaz (Zero Micro-Waterfalls)

En el estado anterior, `index.html` realizaba 7 peticiones `fetch()` asíncronas para descargar trozos de HTML (`navbar.html`, `hero.html`, `menu.html`, etc.).

### Problemas Resueltos:
* **Eliminación del parpadeo (CLS):** La estructura base reside directamente en el documento HTML principal, permitiendo que el navegador dibuje la interfaz en el primer ciclo de renderizado.
* **Compatibilidad Offline / Local:** Permite probar y previsualizar el sitio abriendo `index.html` directamente o sirviéndolo desde cualquier CDN estático sin configuraciones complejas de CORS.
* **Mejora del SEO y Redes Sociales:** Los metadatos OpenGraph y el contenido semántico son inmediatamente visibles para los motores de búsqueda y la vista previa de enlaces en WhatsApp/Telegram.

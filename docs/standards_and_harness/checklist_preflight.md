# ✅ Checklist Preflight de Certificación — La Finestra

> **Lista de Verificación Obligatoria para Desarrolladores y Agentes de IA**  
> Antes de proponer cambios, fusionar ramas o desplegar a producción en Vercel.

---

## 🔍 Bloque 1: Integridad y Cero Secretos
- [ ] ¿Se ejecutó el Quality Gate con 100% de verificaciones aprobadas (`node scripts/quality_gate.js`)?
- [ ] ¿El código está 100% libre de claves privadas, contraseñas en texto plano o tokens `service_role` de Supabase?
- [ ] ¿Se eliminaron todos los `console.log()` de depuración innecesarios?

---

## 🍽️ Bloque 2: Experiencia Gastronómica y Fallback
- [ ] ¿El menú carga completo incluso desconectando el cable de red o simulando caída de Supabase?
- [ ] ¿Los precios mostrados en el catálogo coinciden con los precios del drawer de carrito?
- [ ] ¿El botón de agregar al carrito (`+`) provee retroalimentación visual inmediata (vibración/animación)?
- [ ] ¿El enlace de WhatsApp genera el mensaje con el desglose exacto de productos y el subtotal en USD?

---

## 📱 Bloque 3: Rendimiento y Responsividad Móvil
- [ ] ¿La página carga sin parpadeos ni desplazamientos de maquetación (CLS < 0.1)?
- [ ] ¿Los botones y selectores táctiles tienen un tamaño mínimo de $44 \times 44\text{px}$?
- [ ] ¿Las pestañas de categorías se desplazan horizontalmente de forma suave en pantallas pequeñas ($\le 380\text{px}$)?
- [ ] ¿El drawer del carrito se abre y cierra limpiamente en dispositivos móviles sin bloquear el scroll del cuerpo?

---

## 📚 Bloque 4: Gobernanza y Documentación
- [ ] Si se resolvió un error, ¿se documentó el análisis 5-Whys en `docs/standards_and_harness/self_learning_error_catalog.md`?
- [ ] Si se modificó la estructura de datos, ¿se actualizaron los scripts SQL en `docs/database/`?
- [ ] ¿Se registró el hito en la bitácora modular de `docs/changelog/` correspondiente?

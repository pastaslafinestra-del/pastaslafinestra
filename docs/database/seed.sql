-- =============================================================================
-- DATOS SEMILLA (SEED DATA) — LA FINESTRA
-- Versión: 2.0.1 (Idempotente con ON CONFLICT y Datos Reales del Menú)
-- Generado a partir de js/menu-data.js (Fuente de Verdad Resiliente)
-- =============================================================================

-- 1. CATEGORIAS (9 Categorías Oficiales)
INSERT INTO public.categorias (id, nombre, orden, activo) VALUES
  ('entradas', 'Entradas', 0, TRUE),
  ('pastas', 'Pastas Frescas', 10, TRUE),
  ('pizzas', 'Pizzas Artesanales', 20, TRUE),
  ('proteinas', 'Proteínas', 30, TRUE),
  ('ensaladas', 'Ensaladas', 40, TRUE),
  ('infantil', 'Menú Infantil', 50, TRUE),
  ('postres', 'Postres', 60, TRUE),
  ('bebidas', 'Bebidas', 70, TRUE),
  ('adicionales', 'Adicionales', 80, TRUE)
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden, activo = EXCLUDED.activo;

-- 2. MENU ITEMS (58 Platos Reales de la Carta)
INSERT INTO public.menu_items (categoria, cat, name, descripcion, price, img, img_style, wa_text, orden, disponible) VALUES
  ('entradas', NULL, 'Triángolo al Pomodoro', 'Triángulos de masa crocante, bañados en salsa napolitana y queso pecorino.', '$8,04', NULL, NULL, 'un Triángolo al Pomodoro', 0, TRUE),
  ('entradas', NULL, 'Burrata Pesto', 'Perlas fritas de Mozzarella de Búfala rellenas de pesto, en salsa pomodoro, acompañadas de pan de masa madre.', '$10,64', 'entradas/burrata_pesto.webp', NULL, 'una Burrata Pesto', 1, TRUE),
  ('entradas', NULL, 'Caponata Siciliana', 'Berenjenas, pimentones, cebolla morada, aceitunas negras y tomates encurtidos en aceite de oliva y vinagre de manzana.', '$8,04', NULL, NULL, 'una Caponata Siciliana', 2, TRUE),
  ('entradas', NULL, 'Bruschettas', 'Tostadas de pan de masa madre con tomate deshidratado, pesto y aceto balsámico.', '$8,04', NULL, NULL, 'Bruschettas', 3, TRUE),
  ('entradas', NULL, 'Fettunta', 'Pan de masa madre tostado al estilo toscano.', '$8,04', NULL, NULL, 'Fettunta', 4, TRUE),
  ('entradas', NULL, 'Frittata', 'Bolitas apanadas fritas rellenas de pasta, salsa bologna, mozzarella y queso pecorino, servidas con más salsa bologna.', '$8,04', NULL, NULL, 'Frittata', 5, TRUE),
  ('entradas', NULL, 'Rotolo', 'Rollo de queso crema, pimentón dulce, pistacho, nueces y tocineta, servido como dip para untar en tostadas de pan de masa madre.', '$8,04', 'entradas/Rotolo.webp', NULL, 'Rotolo', 6, TRUE),
  ('pastas', 'Pasta Larga', 'Fettuccine / Tallarín', 'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.', '$8,71', NULL, NULL, 'Pasta Larga', 100, TRUE),
  ('pastas', 'Pastificio', 'Pastificio', 'En un mismo plato: Pasticho de Bologna, Tallarín 4 Formaggi y Milanesa de Pollo a la Pizzaiola.', '$16,08', NULL, NULL, 'el Pastificio', 101, TRUE),
  ('pastas', 'Pasta Corta', 'Cavatelli / Gnocchi de Papa', 'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.', '$8,71', 'pastas/Gnocchi_s_de_papa.webp', NULL, 'Pasta Corta', 102, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Almendra & Manzana Acaramelada', 'Ravioli relleno, acompañado de la salsa de tu preferencia.', '$11,39', NULL, NULL, 'Ravioli Almendra y Manzana', 103, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Carne', 'Ravioli relleno de carne, acompañado de la salsa de tu preferencia.', '$10,05', NULL, NULL, 'Ravioli de Carne', 104, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Cerdo a la Naranja / Ricotta & Espinaca / Jamón Serrano & Mozz', 'Ravioli relleno a tu elección.', '$9,38 – $11,73', NULL, NULL, 'Ravioli', 105, TRUE),
  ('pastas', 'Frutti di Mare', 'Tallarín Frutti Latte', 'Tallarines salteados en aceite de oliva con salsa frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).', '$20,10', 'pastas/Tallarin_frutti_latte.webp', NULL, 'Tallarín Frutti Latte', 106, TRUE),
  ('pastas', 'Frutti di Mare', 'Tallarín Frutti Roja', 'Tallarines en salsa napolitana con frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).', '$20,10', 'pastas/Tallarin_Frutti_Roja.webp', NULL, 'Tallarín Frutti Roja', 107, TRUE),
  ('pastas', 'Pasticho', 'Pasticho Tradicional de Bologna', 'Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.', '$9,38', 'pastas/Pasticho_Tradicional_de_Bologna.webp', NULL, 'Pasticho Tradicional', 108, TRUE),
  ('pastas', 'Pasticho', 'Pasticho de Berenjena con Bologna', 'Láminas de Berenjena, Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.', '$9,38', NULL, NULL, 'Pasticho de Berenjena', 109, TRUE),
  ('pastas', 'Ripieno', 'Ripieno Finestra', 'Bola de pan de masa madre rellena con Brócoli, Zanahoria, Champiñones y Pechuga de Pollo en salsa blanca.', '$10,72', NULL, NULL, 'Ripieno Finestra', 110, TRUE),
  ('pastas', 'Ripieno', 'Ripieno Ragú', 'Bola de pan de masa madre rellena con Ragú de Mechada.', '$10,72', 'pastas/Ripieno_Ragú.webp', NULL, 'Ripieno Ragú', 111, TRUE),
  ('pastas', 'Ripieno', 'Ripieno Azzurro', 'Bola de pan de masa madre rellena con Lomito en tiras encurtido en vino tinto y romero, con toque de Queso Azul.', '$12,06', NULL, NULL, 'Ripieno Azzurro', 112, TRUE),
  ('pizzas', NULL, 'Margherita', 'Napolitana, mozzarella, tomate cherry, albahaca fresca, mozzarella de búfala, trazos de pesto.', '$9,38', NULL, NULL, 'Pizza Margherita', 200, TRUE),
  ('pizzas', NULL, 'Quattro Formaggi', 'Bechamel, queso mozzarella, queso brie, queso provolone, queso pecorino crocante.', '$14,74', NULL, NULL, 'Pizza Quattro Formaggi', 201, TRUE),
  ('pizzas', NULL, 'Marinara', 'Napolitana, tomate deshidratado, ajo en rodajas crocantes, anchoas, polvo de aceitunas negras, trazos de albahaca.', '$9,38', 'pizzas/Marinara.webp', NULL, 'Pizza Marinara', 202, TRUE),
  ('pizzas', NULL, 'Quotidiano', 'Napolitana, mozzarella, jamón artesanal, pechuga de pollo en tiras, champiñones salteados en oliva y vino blanco.', '$9,38', NULL, NULL, 'Pizza Quotidiano', 203, TRUE),
  ('pizzas', NULL, 'Valeria', 'Napolitana, mozzarella, pepperoni, queso pecorino crocante.', '$9,38', NULL, NULL, 'Pizza Valeria', 204, TRUE),
  ('pizzas', NULL, 'Frutti di Mare', 'Napolitana, aros de calamar, camarón, pulpo, mejillón negro, perejil deshidratado.', '$20,10', NULL, NULL, 'Pizza Frutti di Mare', 205, TRUE),
  ('pizzas', NULL, 'Purtroppo', 'Pomodoro, mozzarella, tomate confitado, jamón serrano, rúgula, orégano, pecorino en tiras, polvo de aceitunas verdes.', '$11,39', NULL, NULL, 'Pizza Purtroppo', 206, TRUE),
  ('pizzas', NULL, 'Salumiera', 'Pomodoro, mozzarella, jamón artesanal, chorizo español, bologna de cerdo & pistacho, trazos de nuez, pimienta negra.', '$11,39', 'pizzas/Salumiera.webp', NULL, 'Pizza Salumiera', 207, TRUE),
  ('pizzas', NULL, 'Carpaccio', 'Napolitana, tomate deshidratado, carpaccio de lomito, alcaparras asadas, pecorino en lajas, reducción de aceto balsámico.', '$11,39', NULL, NULL, 'Pizza Carpaccio', 208, TRUE),
  ('pizzas', NULL, 'Messo', 'Bechamel, mozzarella, pomodoro, pesto.', '$9,38', NULL, NULL, 'Pizza Messo', 209, TRUE),
  ('proteinas', NULL, 'Milanesa de Pollo a la Pizzaiola', 'Pechuga de pollo apanada, napolitana, mozzarella, tomate cherry y albahaca fresca.', '$10,72', NULL, NULL, 'Milanesa de Pollo', 300, TRUE),
  ('proteinas', NULL, 'Pollo al Limone', 'Pechuga de pollo en salsa de limón y alcaparras, acompañada de vegetales salteados.', '$10,72', NULL, NULL, 'Pollo al Limone', 301, TRUE),
  ('proteinas', NULL, 'Lomito a la Finestra', 'Medallones de lomito en salsa de vino tinto y romero, acompañados de papas rústicas.', '$16,08', NULL, NULL, 'Lomito a la Finestra', 302, TRUE),
  ('ensaladas', NULL, 'Capressa', 'Tomate fresco, mozzarella de búfala, albahaca, aceite de oliva y aceto balsámico.', '$8,04', NULL, NULL, 'Capressa', 400, TRUE),
  ('ensaladas', NULL, 'Giardino', 'Mix de rúgula y lechuga, tomate deshidratado, aceituna negra, palmito, pasas, mozzarella en cubitos, nuez, jamón serrano y aderezo de aceto balsámico con vino.', '$14,74', NULL, NULL, 'Giardino', 401, TRUE),
  ('ensaladas', NULL, 'Panzanella', 'Lechuga, pepino, celery, tomate, aceitunas verdes, toque de cebolla morada, crotones de masa madre, almendras.', '$10,72', NULL, NULL, 'Panzanella', 402, TRUE),
  ('infantil', NULL, 'Pastichito', 'Capas de pasta fresca, salsa bologna, salsa bechamel, jamón de cerdo, mozzarella.', '$5,36', NULL, NULL, 'Pastichito', 500, TRUE),
  ('infantil', NULL, 'Media Porción Pasta Larga', 'Pasta larga a elección, acompañada de la salsa de su preferencia.', '$5,36', NULL, NULL, 'Media Porción Pasta', 501, TRUE),
  ('infantil', NULL, 'Tenders de Pollo', 'Tiras de pechuga de pollo empanizadas y fritas, acompañadas de papas fritas rústicas.', '$8,04', NULL, NULL, 'Tenders de Pollo', 502, TRUE),
  ('infantil', NULL, 'Bambini (Mini Pizza)', 'Mini pizza 20 cms — Napolitana, mozzarella, jamón artesanal.', '$6,70', NULL, NULL, 'Bambini Mini Pizza', 503, TRUE),
  ('postres', NULL, 'Tiramisú Experiencia ⭐', 'Servimos en vivo el mejor tiramisú de la ciudad. Una experiencia única preparada en tu mesa.', '$4,02', NULL, NULL, 'el Tiramisú Experiencia', 600, TRUE),
  ('postres', NULL, 'Pannacotta', 'Nata de crema de leche y queso crema, bañada en reducción de frutos rojos.', '$4,02', NULL, NULL, 'Pannacotta', 601, TRUE),
  ('postres', NULL, 'Cheesecake de Maracuyá', 'Base de galleta dulce triturada, con capa a base de queso crema y topping de maracuyá.', '$4,02', NULL, NULL, 'Cheesecake de Maracuyá', 602, TRUE),
  ('bebidas', 'Naturales', 'Jugos Naturales', 'Mora · Parchita · Frappé de Mango · Frappé de Maracuyá · Frappé Limonada & Menta · Frappé Limonada & Frutos Rojos.', '$2,68', 'bebidas/jugo_de_mora.webp', NULL, 'un Jugo Natural', 700, TRUE),
  ('bebidas', 'Refrescos', 'Frappé (todos los sabores)', 'Consulta los sabores disponibles del día.', '$3,35', 'bebidas/Frappe.webp', NULL, 'un Frappé', 701, TRUE),
  ('bebidas', 'Aguas', 'Agua con Gas', 'Sola · con Rodajas de Limón · con Frutos Rojos · con Maracuyá.', '$3,35', 'bebidas/agua_con_gas.webp', NULL, 'Agua con Gas', 702, TRUE),
  ('bebidas', 'Refrescos', 'Nestea de Durazno', 'Té frío de durazno.', '$2,68', 'bebidas/Té_de_durazno.webp', NULL, 'Nestea de Durazno', 703, TRUE),
  ('bebidas', 'Aguas', 'Agua Minalba 600ml', 'Agua mineral natural.', '$2,01', 'bebidas/agua_minalba.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'Agua Minalba', 704, TRUE),
  ('bebidas', 'Refrescos', 'Refrescos Lata', 'Todas las variedades disponibles.', '$3,04', 'bebidas/coca_cola_lata.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'un Refresco Lata', 705, TRUE),
  ('bebidas', 'Familiar', 'Coca Cola 2L', 'Solo para llevar.', '$3,35', 'bebidas/coca_cola_2l.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'Coca Cola 2L', 706, TRUE),
  ('adicionales', NULL, 'Festival (3 salsas en 1 plato)', 'Pesto Latte + Carbonara + Napolitana en un mismo plato.', '$3,35', NULL, NULL, 'el Festival Italiano', 800, TRUE),
  ('adicionales', NULL, 'Due Salse (2 salsas en 1 plato)', '2 salsas a tu elección en un mismo plato.', '$2,68', NULL, NULL, 'Due Salse', 801, TRUE),
  ('adicionales', NULL, 'Pan (unidad)', 'Pan artesanal de masa madre.', '$0,34', NULL, NULL, 'Pan', 802, TRUE),
  ('adicionales', NULL, 'Queso Parmesano', 'Porción de queso parmesano rallado.', '$2,68', NULL, NULL, 'Queso Parmesano', 803, TRUE),
  ('adicionales', NULL, 'Ravioli (para llevar)', 'Ravioli frescos para preparar en casa.', '$5,36', 'adicionales/ravioli.webp', NULL, 'Ravioli para llevar', 804, TRUE),
  ('adicionales', NULL, 'Pasta Fresca (para llevar)', 'Pasta fresca artesanal para preparar en casa.', '$2,68', NULL, NULL, 'Pasta Fresca para llevar', 805, TRUE),
  ('adicionales', NULL, 'Salsas (para llevar)', 'Salsas frescas del día para llevar a casa.', '$6,70', NULL, NULL, 'Salsas para llevar', 806, TRUE),
  ('adicionales', NULL, 'Conservas', 'Conservas artesanales de la casa.', '$8,04', NULL, NULL, 'Conservas de La Finestra', 807, TRUE)
ON CONFLICT (categoria, name) DO UPDATE
SET cat = EXCLUDED.cat,
    descripcion = EXCLUDED.descripcion,
    price = EXCLUDED.price,
    img = EXCLUDED.img,
    img_style = EXCLUDED.img_style,
    wa_text = EXCLUDED.wa_text,
    orden = EXCLUDED.orden,
    disponible = EXCLUDED.disponible,
    updated_at = NOW();

-- 3. DESTACADOS (5 Platos Estrella del Carrusel con FK D-02)
INSERT INTO public.destacados (menu_item_id, badge, orden, disponible) VALUES
  ((SELECT id FROM public.menu_items WHERE name = 'Burrata Pesto' LIMIT 1), '⭐ Chef recomienda', 0, TRUE),
  ((SELECT id FROM public.menu_items WHERE name = 'Pasticho Tradicional de Bologna' LIMIT 1), '🔥 Más Vendido', 1, TRUE),
  ((SELECT id FROM public.menu_items WHERE name = 'Tallarín Frutti Latte' LIMIT 1), '🍽️ Favorito', 2, TRUE),
  ((SELECT id FROM public.menu_items WHERE name = 'Ripieno Ragú' LIMIT 1), '✨ Especial', 3, TRUE),
  ((SELECT id FROM public.menu_items WHERE name = 'Salumiera' LIMIT 1), '🔥 Más Vendido', 4, TRUE)
ON CONFLICT (menu_item_id) DO UPDATE
SET badge = EXCLUDED.badge,
    orden = EXCLUDED.orden,
    disponible = EXCLUDED.disponible,
    updated_at = NOW();

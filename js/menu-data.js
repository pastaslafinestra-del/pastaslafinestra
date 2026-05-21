/**
 * menu-data.js — Datos del menú de La Finestra.
 *
 * Cada plato es un objeto con estas propiedades:
 *   name     {string}  Nombre del plato           (obligatorio)
 *   desc     {string}  Descripción                (obligatorio)
 *   price    {string}  Precio en $                (obligatorio)
 *   waText   {string}  Texto del mensaje WhatsApp (obligatorio)
 *   cat      {string}  Subcategoría visible       (opcional)
 *   img      {string}  Ruta relativa desde assets/(opcional)
 *   imgStyle {string}  Estilos extra del mcard-img (opcional)
 *
 * Para agregar un plato  → añade un objeto al array de su categoría.
 * Para cambiar un precio → edita el campo price del objeto correspondiente.
 * Para agregar una foto  → añade el campo img con la ruta relativa.
 *
 * NOTA: WA_NUMBER ya no vive aquí — está en config.js.
 */

export const menuData = {

  /* ── ENTRADAS ─────────────────────────────────────── */
  entradas: [
    {
      name:   'Triángolo al Pomodoro',
      desc:   'Triángulos de masa crocante, bañados en salsa napolitana y queso pecorino.',
      price:  '$8,04',
      waText: 'un Triángolo al Pomodoro',
    },
    {
      name:   'Burrata Pesto',
      desc:   'Perlas fritas de Mozzarella de Búfala rellenas de pesto, en salsa pomodoro, acompañadas de pan de masa madre.',
      price:  '$10,64',
      waText: 'una Burrata Pesto',
      img:    'entradas/burrata_pesto.webp',
    },
    {
      name:   'Caponata Siciliana',
      desc:   'Berenjenas, pimentones, cebolla morada, aceitunas negras y tomates encurtidos en aceite de oliva y vinagre de manzana.',
      price:  '$8,04',
      waText: 'una Caponata Siciliana',
    },
    {
      name:   'Bruschettas',
      desc:   'Tostadas de pan de masa madre con tomate deshidratado, pesto y aceto balsámico.',
      price:  '$8,04',
      waText: 'Bruschettas',
    },
    {
      name:   'Fettunta',
      desc:   'Pan de masa madre tostado al estilo toscano.',
      price:  '$8,04',
      waText: 'Fettunta',
    },
    {
      name:   'Frittata',
      desc:   'Bolitas apanadas fritas rellenas de pasta, salsa bologna, mozzarella y queso pecorino, servidas con más salsa bologna.',
      price:  '$8,04',
      waText: 'Frittata',
    },
    {
      name:   'Rotolo',
      desc:   'Rollo de queso crema, pimentón dulce, pistacho, nueces y tocineta, servido como dip para untar en tostadas de pan de masa madre.',
      price:  '$8,04',
      waText: 'Rotolo',
      img:    'entradas/Rotolo.webp',
    },
  ],

  /* ── PASTAS ───────────────────────────────────────── */
  pastas: [
    {
      cat:    'Pasta Larga',
      name:   'Fettuccine / Tallarín',
      desc:   'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.',
      price:  '$8,71',
      waText: 'Pasta Larga',
    },
    {
      cat:    'Pastificio ⭐',
      name:   'Pastificio',
      desc:   'En un mismo plato: Pasticho de Bologna, Tallarín 4 Formaggio y Milanesa de Pollo a la Pizzaiola.',
      price:  '$16,08',
      waText: 'el Pastificio',
    },
    {
      cat:    'Pasta Corta',
      name:   'Cavatelli / Gnocchi de Papa',
      desc:   'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.',
      price:  '$8,71',
      waText: 'Pasta Corta',
      img:    'pastas/Gnocchi_s_de_papa.webp',
    },
    {
      cat:    'Ravioli',
      name:   'Ravioli — Almendra & Manzana Acaramelada',
      desc:   'Ravioli relleno, acompañado de la salsa de tu preferencia.',
      price:  '$11,39',
      waText: 'Ravioli Almendra y Manzana',
    },
    {
      cat:    'Ravioli',
      name:   'Ravioli — Carne',
      desc:   'Ravioli relleno de carne, acompañado de la salsa de tu preferencia.',
      price:  '$10,05',
      waText: 'Ravioli de Carne',
    },
    {
      cat:    'Ravioli',
      name:   'Ravioli — Cerdo a la Naranja / Ricotta & Espinaca / Jamón Serrano & Mozz',
      desc:   'Ravioli relleno a tu elección.',
      price:  '$9,38 – $11,73',
      waText: 'Ravioli',
    },
    {
      cat:    'Frutti di Mare',
      name:   'Tallarín Frutti Latte',
      desc:   'Tallarines salteados en aceite de oliva con salsa frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).',
      price:  '$20,10',
      waText: 'Tallarín Frutti Latte',
      img:    'pastas/Tallarin_frutti_latte.webp',
    },
    {
      cat:    'Frutti di Mare',
      name:   'Tallarín Frutti Roja',
      desc:   'Tallarines en salsa napolitana con frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).',
      price:  '$20,10',
      waText: 'Tallarín Frutti Roja',
      img:    'pastas/Tallarin_Frutti_Roja.webp',
    },
    {
      cat:    'Pasticho',
      name:   'Pasticho Tradicional de Bologna',
      desc:   'Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.',
      price:  '$9,38',
      waText: 'Pasticho Tradicional',
      img:    'pastas/Pasticho_Tradicional_de_Bologna.webp',
    },
    {
      cat:    'Pasticho',
      name:   'Pasticho de Berenjena con Bologna',
      desc:   'Láminas de Berenjena, Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.',
      price:  '$9,38',
      waText: 'Pasticho de Berenjena',
    },
    {
      cat:    'Ripieno ⭐',
      name:   'Ripieno Finestra',
      desc:   'Bola de pan de masa madre rellena con Brócoli, Zanahoria, Champiñones y Pechuga de Pollo en salsa blanca.',
      price:  '$10,72',
      waText: 'Ripieno Finestra',
    },
    {
      cat:    'Ripieno ⭐',
      name:   'Ripieno Ragú',
      desc:   'Bola de pan de masa madre rellena con Ragú de Mechada.',
      price:  '$10,72',
      waText: 'Ripieno Ragú',
      img:    'pastas/Ripieno_Ragú.webp',
    },
    {
      cat:    'Ripieno ⭐',
      name:   'Ripieno Azzurro',
      desc:   'Bola de pan de masa madre rellena con Lomito en tiras encurtido en vino tinto y romero, con toque de Queso Azul.',
      price:  '$12,06',
      waText: 'Ripieno Azzurro',
    },
  ],

  /* ── PIZZAS ───────────────────────────────────────── */
  pizzas: [
    {
      name:   'Margherita',
      desc:   'Napolitana, mozzarella, tomate cherry, albahaca fresca, mozzarella de búfala, trazos de pesto.',
      price:  '$9,38',
      waText: 'Pizza Margherita',
    },
    {
      name:   'Quattro Formaggi',
      desc:   'Bechamel, queso mozzarella, queso brie, queso provolone, queso pecorino crocante.',
      price:  '$14,74',
      waText: 'Pizza Quattro Formaggi',
    },
    {
      name:   'Marinara',
      desc:   'Napolitana, tomate deshidratado, ajo en rodajas crocantes, anchoas, polvo de aceitunas negras, trazos de albahaca.',
      price:  '$9,38',
      waText: 'Pizza Marinara',
      img:    'pizzas/Marinara.webp',
    },
    {
      name:   'Quotidiano',
      desc:   'Napolitana, mozzarella, jamón artesanal, pechuga de pollo en tiras, champiñones salteados en oliva y vino blanco.',
      price:  '$9,38',
      waText: 'Pizza Quotidiano',
    },
    {
      name:   'Valeria',
      desc:   'Napolitana, mozzarella, pepperoni, queso pecorino crocante.',
      price:  '$9,38',
      waText: 'Pizza Valeria',
    },
    {
      name:   'Frutti di Mare',
      desc:   'Napolitana, aros de calamar, camarón, pulpo, mejillón negro, perejil deshidratado.',
      price:  '$20,10',
      waText: 'Pizza Frutti di Mare',
    },
    {
      name:   'Purtroppo',
      desc:   'Pomodoro, mozzarella, tomate confitado, jamón serrano, rúgula, orégano, pecorino en tiras, polvo de aceitunas verdes.',
      price:  '$11,39',
      waText: 'Pizza Purtroppo',
    },
    {
      name:   'Salumiera',
      desc:   'Pomodoro, mozzarella, jamón artesanal, chorizo español, bologna de cerdo & pistacho, trazos de nuez, pimienta negra.',
      price:  '$11,39',
      waText: 'Pizza Salumiera',
      img:    'pizzas/Salumiera.webp',
    },
    {
      name:   'Carpaccio',
      desc:   'Napolitana, tomate deshidratado, carpaccio de lomito, alcaparras asadas, pecorino en lajas, reducción de aceto balsámico.',
      price:  '$11,39',
      waText: 'Pizza Carpaccio',
    },
    {
      name:   'Messo',
      desc:   'Bechamel, mozzarella, pomodoro, pesto.',
      price:  '$9,38',
      waText: 'Pizza Messo',
    },
  ],

  /* ── PROTEÍNAS ────────────────────────────────────── */
  proteinas: [
    {
      name:   'Milanesa de Pollo a la Pizzaiola',
      desc:   'Pechuga de pollo apanada, napolitana, mozzarella, tomate cherry y albahaca fresca.',
      price:  '$10,72',
      waText: 'Milanesa de Pollo',
    },
    {
      name:   'Pollo al Limone',
      desc:   'Pechuga de pollo en salsa de limón y alcaparras, acompañada de vegetales salteados.',
      price:  '$10,72',
      waText: 'Pollo al Limone',
    },
    {
      name:   'Lomito a la Finestra',
      desc:   'Medallones de lomito en salsa de vino tinto y romero, acompañados de papas rústicas.',
      price:  '$16,08',
      waText: 'Lomito a la Finestra',
    },
  ],

  /* ── ENSALADAS ────────────────────────────────────── */
  ensaladas: [
    {
      name:   'Capressa',
      desc:   'Tomate fresco, mozzarella de búfala, albahaca, aceite de oliva y aceto balsámico.',
      price:  '$8,04',
      waText: 'Capressa',
    },
    {
      name:   'Giardino',
      desc:   'Mix de rúgula y lechuga, tomate deshidratado, aceituna negra, palmito, pasas, mozzarella en cubitos, nuez, jamón serrano y aderezo de aceto balsámico con vino.',
      price:  '$14,74',
      waText: 'Giardino',
    },
    {
      name:   'Panzanella',
      desc:   'Lechuga, pepino, celery, tomate, aceitunas verdes, toque de cebolla morada, crotones de masa madre, almendras.',
      price:  '$10,72',
      waText: 'Panzanella',
    },
  ],

  /* ── MENÚ INFANTIL ────────────────────────────────── */
  infantil: [
    {
      name:   'Pastichito',
      desc:   'Capas de pasta fresca, salsa bologna, salsa bechamel, jamón de cerdo, mozzarella.',
      price:  '$5,36',
      waText: 'Pastichito',
    },
    {
      name:   'Media Porción Pasta Larga',
      desc:   'Pasta larga a elección, acompañada de la salsa de su preferencia.',
      price:  '$5,36',
      waText: 'Media Porción Pasta',
    },
    {
      name:   'Tenders de Pollo',
      desc:   'Tiras de pechuga de pollo empanizadas y fritas, acompañadas de papas fritas rústicas.',
      price:  '$8,04',
      waText: 'Tenders de Pollo',
    },
    {
      name:   'Bambini (Mini Pizza)',
      desc:   'Mini pizza 20 cms — Napolitana, mozzarella, jamón artesanal.',
      price:  '$6,70',
      waText: 'Bambini Mini Pizza',
    },
  ],

  /* ── POSTRES ──────────────────────────────────────── */
  postres: [
    {
      name:   'Tiramisú Experiencia ⭐',
      desc:   'Servimos en vivo el mejor tiramisú de la ciudad. Una experiencia única preparada en tu mesa.',
      price:  '$4,02',
      waText: 'el Tiramisú Experiencia',
    },
    {
      name:   'Pannacotta',
      desc:   'Nata de crema de leche y queso crema, bañada en reducción de frutos rojos.',
      price:  '$4,02',
      waText: 'Pannacotta',
    },
    {
      name:   'Cheesecake de Maracuyá',
      desc:   'Base de galleta dulce triturada, con capa a base de queso crema y topping de maracuyá.',
      price:  '$4,02',
      waText: 'Cheesecake de Maracuyá',
    },
  ],

  /* ── BEBIDAS ──────────────────────────────────────── */
  bebidas: [
    {
      cat:    'Naturales',
      name:   'Jugos Naturales',
      desc:   'Mora · Parchita · Frappé de Mango · Frappé de Maracuyá · Frappé Limonada & Menta · Frappé Limonada & Frutos Rojos.',
      price:  '$2,68',
      waText: 'un Jugo Natural',
      img:    'bebidas/jugo_de_mora.webp',
    },
    {
      cat:    'Refrescos',
      name:   'Frappé (todos los sabores)',
      desc:   'Consulta los sabores disponibles del día.',
      price:  '$3,35',
      waText: 'un Frappé',
      img:    'bebidas/Frappe.webp',
    },
    {
      cat:    'Aguas',
      name:   'Agua con Gas',
      desc:   'Sola · con Rodajas de Limón · con Frutos Rojos · con Maracuyá.',
      price:  '$3,35',
      waText: 'Agua con Gas',
      img:    'bebidas/agua_con_gas.webp',
    },
    {
      cat:    'Refrescos',
      name:   'Nestea de Durazno',
      desc:   'Té frío de durazno.',
      price:  '$2,68',
      waText: 'Nestea de Durazno',
      img:    'bebidas/Té_de_durazno.webp',
    },
    {
      cat:    'Aguas',
      name:   'Agua Minalba 600ml',
      desc:   'Agua mineral natural.',
      price:  '$2,01',
      waText: 'Agua Minalba',
      img:    'bebidas/agua_minalba.webp',
      imgStyle: 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;',
    },
    {
      cat:    'Refrescos',
      name:   'Refrescos Lata',
      desc:   'Todas las variedades disponibles.',
      price:  '$3,04',
      waText: 'un Refresco Lata',
      img:    'bebidas/coca_cola_lata.webp',
      imgStyle: 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;',
    },
    {
      cat:    'Familiar',
      name:   'Coca Cola 2L',
      desc:   'Solo para llevar.',
      price:  '$3,35',
      waText: 'Coca Cola 2L',
      img:    'bebidas/coca_cola_2l.webp',
      imgStyle: 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;',
    },
  ],

  /* ── ADICIONALES ──────────────────────────────────── */
  adicionales: [
    {
      name:   'Festival (3 salsas en 1 plato)',
      desc:   'Pesto Latte + Carbonara + Napolitana en un mismo plato.',
      price:  '$3,35',
      waText: 'el Festival Italiano',
    },
    {
      name:   'Due Salsa (2 salsas en 1 plato)',
      desc:   '2 salsas a tu elección en un mismo plato.',
      price:  '$2,68',
      waText: 'Due Salsa',
    },
    {
      name:   'Pan (unidad)',
      desc:   'Pan artesanal de masa madre.',
      price:  '$0,34',
      waText: 'Pan',
    },
    {
      name:   'Queso Parmesano',
      desc:   'Porción de queso parmesano rallado.',
      price:  '$2,68',
      waText: 'Queso Parmesano',
    },
    {
      name:   'Ravioli (para llevar)',
      desc:   'Ravioli frescos para preparar en casa.',
      price:  '$5,36',
      waText: 'Ravioli para llevar',
      img:    'adicionales/ravioli.webp',
    },
    {
      name:   'Pasta Fresca (para llevar)',
      desc:   'Pasta fresca artesanal para preparar en casa.',
      price:  '$2,68',
      waText: 'Pasta Fresca para llevar',
    },
    {
      name:   'Salsas (para llevar)',
      desc:   'Salsas frescas del día para llevar a casa.',
      price:  '$6,70',
      waText: 'Salsas para llevar',
    },
    {
      name:   'Conservas',
      desc:   'Conservas artesanales de la casa.',
      price:  '$8,04',
      waText: 'Conservas de La Finestra',
    },
  ],

};

/* ── DESTACADOS ───────────────────────────────────────
   Fuente única de verdad para la sección destacados.
   badge: etiqueta visual de la card.
   Los precios y datos deben coincidir con menuData.
─────────────────────────────────────────────────────── */
export const destacadosData = [
  {
    badge:  '⭐ Chef recomienda',
    name:   'Burrata Pesto',
    desc:   'Perlas fritas de Mozzarella de Búfala rellenas de pesto, en salsa pomodoro, acompañadas de pan de masa madre.',
    price:  '$10,64',
    img:    'entradas/burrata_pesto.webp',
    waText: 'una Burrata Pesto',
  },
  {
    badge:  '🔥 Más Vendido',
    name:   'Pasticho Tradicional de Bologna',
    desc:   'Capas de pasta fresca, salsa bologna, bechamel, mozzarella y queso parmesano gratinado.',
    price:  '$9,38',
    img:    'pastas/Pasticho_Tradicional_de_Bologna.webp',
    waText: 'Pasticho Tradicional de Bologna',
  },
  {
    badge:  '🍽️ Favorito',
    name:   'Tallarín Frutti Latte',
    desc:   'Tallarín fresco con salsa blanca, frutos de mar salteados en oliva y vino blanco.',
    price:  '$20,10',
    img:    'pastas/Tallarin_frutti_latte.webp',
    waText: 'Tallarín Frutti Latte',
  },
  {
    badge:  '✨ Especial',
    name:   'Ripieno Ragú',
    desc:   'Ravioli relleno bañado en ragú de carne cocido a fuego lento.',
    price:  '$10,72',
    img:    'pastas/Ripieno_Ragú.webp',
    waText: 'Ripieno Ragú',
  },
  {
    badge:  '🔥 Más Vendido',
    name:   'Salumiera',
    desc:   'Pomodoro, mozzarella, jamón artesanal, chorizo español, bologna de cerdo & pistacho, trazos de nuez, pimienta negra.',
    price:  '$11,39',
    img:    'pizzas/Salumiera.webp',
    waText: 'Pizza Salumiera',
  },
];
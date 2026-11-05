/**
 * site.config.js — Archivo único de configuración por cliente (T-01)
 *
 * Para instanciar esta plantilla con un nuevo cliente gastronómico:
 * 1. Edita los valores de este archivo.
 * 2. Reemplaza los assets gráficos en /assets/images/.
 * 3. Ejecuta `npm run build` y `npm run quality-gate`.
 */

export const siteConfig = {
  brand: {
    name: 'La Finestra',
    tagline: 'Pastas, Pizzas y Salsas Frescas Artesanales',
    logo: 'assets/images/lafinestra_logo_clean.webp',
    logoDark: 'assets/images/lafinestra_logo_dark.webp',
    colors: {
      primary: '#1B4332',
      accent: '#D4A373'
    }
  },
  contact: {
    whatsapp: '584247827899',
    whatsappFormatted: '+58 424-7827899',
    instagram: 'lafinestrapastas',
    address: 'San Cristóbal, Táchira, Venezuela',
    hours: 'Lunes a Domingo 11:00 AM – 10:00 PM',
    deliveryAvailable: true
  },
  locale: {
    lang: 'es-VE',
    timezone: 'America/Caracas',
    currency: 'USD',
    currencySymbol: '$'
  },
  features: {
    menu: true,
    carrito: true,
    reservas: true,
    admin: true,
    isDemo: false
  },
  legal: {
    taxId: 'V-19236204-7',
    showTaxId: true,
    developedBy: 'Aeon Studio',
    developedByUrl: 'https://aeon.com.ve'
  },
  supabase: {
    url: 'https://daevefcmtmnjxliosdhf.supabase.co',
    anonKey: 'sb_publishable_NjeW434fUs7h7bl8NDsczw_h1ozVnLX',
    bucket: 'menu-images',
    storageUrl: 'https://atjijqvwwdlydgsonptr.supabase.co/storage/v1/object/public/menu-images/'
  }
};

export default siteConfig;

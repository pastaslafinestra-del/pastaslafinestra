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
    whatsapp: '584247842743',
    whatsappFormatted: '+58 424-7842743',
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
    url: 'https://atjijqvwwdlydgsonptr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0amlqcXZ3d2RseWRnc29ucHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTI1MDIsImV4cCI6MjA5NDg4ODUwMn0.DDVEbZaVmAqmuvUs-jAHYAWm1PVUyT1zzy5gKJCdK3Q',
    bucket: 'menu-images'
  }
};

export default siteConfig;

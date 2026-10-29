# 🚀 Guía de Despliegue y Alta de Nuevos Clientes (Plantilla Gastronómica)

> **Estándar:** Checklist repetible para instanciar la plantilla en un nuevo restaurante o comercio.  
> **Objetivo:** Poner en producción un nuevo cliente en < 2 horas con aislamiento total y cero secretos expuestos.

---

## 📋 Checklist de 8 Pasos

### Paso 1: Aislamiento de Infraestructura (Un proyecto Supabase por cliente)
1. Iniciar sesión en [Supabase](https://supabase.com) y crear un proyecto nuevo para el cliente.
2. En **Authentication → Providers → Email**:
   - **Desactivar** *"Allow new users to sign up"* (cero registro abierto).
3. En **SQL Editor**:
   - Ejecutar la suite de migraciones (`docs/database/migrations/001_initial_schema_v2.0.2.sql` en adelante) o correr:
     ```bash
     npm run db:migrate
     ```

---

### Paso 2: Creación del Administrador con Rol Estricto
1. En **Authentication → Users**, invitar o crear el usuario del dueño del restaurante (ej. `admin@cliente.com`).
2. En **SQL Editor**, asignarle formalmente el rol `admin` en `app_metadata` (protegido contra manipulación del cliente):
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
   WHERE email = 'admin@cliente.com';
   ```
3. Recomendar y guiar al administrador a activar **MFA (Autenticación de Dos Factores)** en su primer acceso.

---

### Paso 3: Configuración del Bucket de Storage y RLS
1. Ejecutar la migración `003_storage_policies_and_bucket.sql`:
   - Bucket: `menu-images` (Público, límite 4 MB, tipos permitidos: `webp`, `jpeg`, `png`).
   - Políticas RLS sobre `storage.objects`: `INSERT`, `UPDATE`, `DELETE` condicionadas a `public.is_admin()`.

---

### Paso 4: Parametrización en `site.config.js`
Editar [`site.config.js`](../../site.config.js) con los datos del nuevo cliente:
```javascript
export const siteConfig = {
  brand: {
    name: 'Nombre del Restaurante',
    tagline: 'Especialidades Gastronómicas Artesanales',
    logo: 'assets/images/logo_cliente.webp',
    colors: { primary: '#1B4332', accent: '#D4A373' }
  },
  contact: {
    whatsapp: '584120000000',
    whatsappFormatted: '+58 412-0000000',
    instagram: 'usuario_ig',
    address: 'Dirección física del restaurante',
    hours: 'Lunes a Domingo 11:00 AM – 10:00 PM'
  },
  supabase: {
    url: 'https://nuevo-proyecto.supabase.co',
    anonKey: 'eyJ...',
    bucket: 'menu-images'
  }
};
```

---

### Paso 5: Carga del Catálogo Inicial
1. Definir los platos locales en `js/menu-data.js` como fuente de verdad resiliente.
2. Ejecutar el seed en Supabase (`docs/database/seed.sql`):
   ```bash
   npm run db:seed
   ```

---

### Paso 6: Compilación y Pre-renderizado
Ejecutar la compilación estática para inyectar el catálogo en el HTML estático:
```bash
npm run build
```

---

### Paso 7: Validación de Calidad Automatizada
Ejecutar la compuerta de calidad y la suite de pruebas de seguridad:
```bash
npm run quality-gate
npm run test:rls
```
Ambos comandos deben reportar **100% PASS** antes de cualquier despliegue.

---

### Paso 8: Despliegue en Vercel y Entrega
1. Conectar el repositorio en [Vercel](https://vercel.com).
2. Configurar el dominio personalizado del cliente (ej. `menu.cliente.com`).
3. Probar el panel administrativo `/admin`:
   - Iniciar sesión con la cuenta de administrador.
   - Alternar la disponibilidad de un plato y verificar que la base de datos se actualiza de verdad.
4. Entregar al cliente sus credenciales y manual operativo de 1 página por canal seguro.

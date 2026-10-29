import siteConfig from '../site.config.js';

export const WA_NUMBER       = siteConfig.contact.whatsapp;
export const ASSETS_BASE_URL = `${siteConfig.supabase.url}/storage/v1/object/public/${siteConfig.supabase.bucket}/`;
export const SUPABASE_URL    = siteConfig.supabase.url;
export const SUPABASE_ANON   = siteConfig.supabase.anonKey;

export { siteConfig };

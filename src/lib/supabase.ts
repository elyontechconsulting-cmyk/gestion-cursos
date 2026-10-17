import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.configured) {
  console.warn('[supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa .env.local');
}

export const supabase = createClient(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseAnonKey || 'public-anon-key',
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'gc-auth' },
    global: { headers: { 'x-client-info': 'gestion-cursos-web' } },
  },
);

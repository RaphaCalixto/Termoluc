import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com fallback seguro para produção na Vercel
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://njdkldfvyjxkybumhzah.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_k8BP9fKhH4E4j8z5VVQMtw_CWQDEhZ_';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

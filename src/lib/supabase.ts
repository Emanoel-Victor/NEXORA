import { createClient } from '@supabase/supabase-js';

const isServer = typeof window === 'undefined';

const supabaseUrl = isServer 
  ? process.env.VITE_SUPABASE_URL 
  : (import.meta.env?.VITE_SUPABASE_URL);

const supabaseAnonKey = isServer 
  ? process.env.VITE_SUPABASE_ANON_KEY 
  : (import.meta.env?.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

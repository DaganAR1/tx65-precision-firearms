import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase Init:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'MISSING',
  key: supabaseAnonKey ? 'PRESENT' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'CRITICAL: Supabase credentials missing. The website cannot connect to the database. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables in the Secrets panel.';
  console.error(errorMsg);
  if (typeof window !== 'undefined') {
    // We don't want to crash the whole app immediately, but we want to make it obvious
    // In a real app, you might redirect to a setup page or show a global error banner.
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

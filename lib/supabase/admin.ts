import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Service-Role Supabase Admin Client
 * CAUTION: Bypasses Row Level Security (RLS).
 * MUST NEVER BE EXPOSED TO BROWSER CODE OR INCLUDED IN CLIENT BUNDLES.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: createAdminClient() called in client environment!');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl === 'YOUR_SUPABASE_URL' || serviceRoleKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    throw new Error('Supabase admin configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

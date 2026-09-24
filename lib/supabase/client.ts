'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabaseUrl = (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')))
    ? rawUrl
    : 'https://placeholder.supabase.co';

  const supabaseAnonKey = (rawAnonKey && rawAnonKey !== 'YOUR_SUPABASE_ANON_KEY')
    ? rawAnonKey
    : 'placeholder-anon-key';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

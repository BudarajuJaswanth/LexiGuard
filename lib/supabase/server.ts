import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabaseUrl = (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')))
    ? rawUrl
    : 'https://placeholder.supabase.co';

  const supabaseAnonKey = (rawAnonKey && rawAnonKey !== 'YOUR_SUPABASE_ANON_KEY')
    ? rawAnonKey
    : 'placeholder-anon-key';

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}
